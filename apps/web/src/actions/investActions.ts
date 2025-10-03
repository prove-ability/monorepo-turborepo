"use server";

import { stackServerApp } from "@/stack/server";
import {
  db,
  classStockPrices,
  holdings,
  transactions,
  guests,
  wallets,
} from "@repo/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getStocks(classId: string, day: number) {
  try {
    const stockData = await db.query.stocks.findMany({
      with: {
        classStockPrices: {
          where: and(
            eq(classStockPrices.classId, classId),
            inArray(classStockPrices.day, [day, day - 1])
          ),
          columns: { day: true, price: true },
        },
      },
    });

    // 주식별로 현재가와 전일가를 찾아서 등락률을 계산합니다.
    const processedStocks = stockData.map((stock) => {
      const prices = stock.classStockPrices as { day: number; price: string }[];
      const currentPriceInfo = prices.find((p) => p.day === day);
      const prevPriceInfo = prices.find((p) => p.day === day - 1);

      const currentPrice = currentPriceInfo
        ? parseFloat(currentPriceInfo.price)
        : 0;
      const prevPrice = prevPriceInfo
        ? parseFloat(prevPriceInfo.price)
        : currentPrice; // 전일 가격 없으면 현재가로

      const priceChange = currentPrice - prevPrice;
      const changeRate = prevPrice === 0 ? 0 : (priceChange / prevPrice) * 100;

      return {
        ...stock,
        price: currentPrice,
        priceChange,
        changeRate,
      };
    });

    return processedStocks;
  } catch (error) {
    console.error("일차별 주식 정보 조회 실패:", error);
    return [];
  }
}

export type PortfolioItem = {
  quantity: number;
  stocks: {
    id: string;
    name: string;
    class_stock_prices: {
      price: number;
    }[];
  };
};

export async function getClassPortfolio(
  classId: string,
  day: number
): Promise<PortfolioItem[]> {
  try {
    const portfolioData = await db.query.holdings.findMany({
      where: eq(holdings.classId, classId),
      with: {
        stock: {
          with: {
            classStockPrices: {
              where: eq(classStockPrices.day, day),
              columns: { price: true },
            },
          },
        },
      },
    });

    return portfolioData
      .filter(
        (item) =>
          item.stock && (item.stock.classStockPrices as any[]).length > 0
      )
      .map((item) => ({
        quantity: item.quantity || 0,
        stocks: {
          id: item.stock!.id,
          name: item.stock!.name || "N/A",
          class_stock_prices: (
            item.stock!.classStockPrices as { price: string }[]
          ).map((p) => ({ price: parseFloat(p.price) })),
        },
      }));
  } catch (error) {
    console.error("포트폴리오 정보 조회 실패:", error);
    return [];
  }
}

interface TradeParams {
  stockId: string;
  quantity: number;
  price: number;
  action: "buy" | "sell";
}

export async function executeTrade(
  params: TradeParams
): Promise<{ success?: boolean; error?: string }> {
  const user = await stackServerApp.getUser();
  if (!user) {
    return { error: "사용자를 찾을 수 없습니다." };
  }
  const authUser = user;

  const { stockId, quantity, price, action } = params;
  const totalValue = price * quantity;

  try {
    await db.transaction(async (tx: any) => {
      const user = await tx.query.guests.findFirst({
        where: eq(guests.id, authUser.id),
        columns: { id: true, classId: true },
        with: {
          class: { columns: { currentDay: true } },
          wallet: { columns: { id: true, balance: true } },
        },
      });

      if (!user || !user.class || !user.wallet) {
        throw new Error("사용자, 클래스 또는 지갑 정보를 찾을 수 없습니다.");
      }

      const walletBalance = parseFloat(user.wallet.balance);

      if (action === "buy") {
        if (walletBalance < totalValue) {
          throw new Error("자산이 부족합니다.");
        }

        await tx
          .update(wallets)
          .set({ balance: String(walletBalance - totalValue) })
          .where(eq(wallets.id, user.wallet.id));

        const holding = await tx.query.holdings.findFirst({
          where: and(
            eq(holdings.userId, user.id),
            eq(holdings.stockId, stockId)
          ),
        });

        if (holding) {
          const newQuantity = holding.quantity + quantity;
          const newAvgPrice =
            (holding.quantity * parseFloat(holding.averagePurchasePrice) +
              totalValue) /
            newQuantity;
          await tx
            .update(holdings)
            .set({
              quantity: newQuantity,
              averagePurchasePrice: String(newAvgPrice),
            })
            .where(eq(holdings.id, holding.id));
        } else {
          await tx.insert(holdings).values({
            userId: user.id,
            classId: user.classId,
            stockId: stockId,
            quantity: quantity,
            averagePurchasePrice: String(price),
          });
        }
      } else if (action === "sell") {
        const holding = await tx.query.holdings.findFirst({
          where: and(
            eq(holdings.userId, user.id),
            eq(holdings.stockId, stockId)
          ),
        });

        if (!holding || holding.quantity < quantity) {
          throw new Error("보유 수량이 부족합니다.");
        }

        await tx
          .update(wallets)
          .set({ balance: String(walletBalance + totalValue) })
          .where(eq(wallets.id, user.wallet.id));

        if (holding.quantity > quantity) {
          await tx
            .update(holdings)
            .set({ quantity: holding.quantity - quantity })
            .where(eq(holdings.id, holding.id));
        } else {
          await tx.delete(holdings).where(eq(holdings.id, holding.id));
        }
      }

      await tx.insert(transactions).values({
        walletId: user.wallet.id,
        classId: user.classId,
        stockId: stockId,
        type: action,
        quantity: quantity,
        price: String(price),
        day: user.class.currentDay,
      });
    });

    revalidatePath("/invest");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
