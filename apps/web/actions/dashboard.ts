"use server";

import {
  db,
  guests,
  wallets,
  holdings,
  transactions,
  classStockPrices,
  classes,
} from "@repo/db";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";

export interface DashboardData {
  // 기본 정보
  userName: string;
  className: string;
  currentDay: number;
  totalDays: number;

  // 자산 현황
  balance: number;
  totalHoldingValue: number;
  totalAssets: number;
  
  // 수익 현황
  initialCapital: number;
  profit: number;
  profitRate: number;

  // 보유 주식
  holdingStocks: Array<{
    stockId: string;
    stockName: string;
    quantity: number;
    currentPrice: number;
    holdingValue: number;
    averagePrice: number;
    profitLoss: number;
    profitLossRate: number;
  }>;

  // 랭킹 정보
  myRank: number | null;
  totalParticipants: number;
}

export const getDashboardData = withAuth(async (user) => {
  try {
    // 1. 클래스 정보 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
    });

    if (!classInfo || classInfo.currentDay === null) {
      throw new Error("클래스 정보를 찾을 수 없습니다.");
    }

    const currentDay = classInfo.currentDay;

    // 실제 데이터에서 최대 Day 조회
    const maxDayResult = await db.query.classStockPrices.findMany({
      where: eq(classStockPrices.classId, user.classId),
      orderBy: (classStockPrices, { desc }) => [desc(classStockPrices.day)],
      limit: 1,
    });
    
    const totalDays = maxDayResult[0]?.day || 0;

    // 2. 지갑 조회
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.guestId, user.id),
    });

    const balance = parseFloat(wallet?.balance || "0");

    // 3. 보유 주식 조회
    const userHoldings = await db.query.holdings.findMany({
      where: and(
        eq(holdings.guestId, user.id),
        eq(holdings.classId, user.classId)
      ),
      with: {
        stock: true,
      },
    });

    // 4. 보유 주식의 현재가 및 평가액 계산
    let totalHoldingValue = 0;
    const holdingStocks = [];

    for (const holding of userHoldings) {
      if (!holding.stock || !holding.stockId) continue;

      const currentPrice = await db.query.classStockPrices.findFirst({
        where: and(
          eq(classStockPrices.classId, user.classId),
          eq(classStockPrices.stockId, holding.stockId),
          eq(classStockPrices.day, currentDay)
        ),
      });

      if (currentPrice) {
        const price = parseFloat(currentPrice.price || "0");
        const quantity = holding.quantity || 0;
        const holdingValue = price * quantity;
        const averagePrice = parseFloat(holding.averagePurchasePrice || "0");
        const profitLoss = (price - averagePrice) * quantity;
        const profitLossRate =
          averagePrice > 0 ? (profitLoss / (averagePrice * quantity)) * 100 : 0;

        totalHoldingValue += holdingValue;

        holdingStocks.push({
          stockId: holding.stockId,
          stockName: holding.stock.name,
          quantity,
          currentPrice: price,
          holdingValue,
          averagePrice,
          profitLoss,
          profitLossRate,
        });
      }
    }

    // 5. 초기 자본 계산 (모든 지원금 합계)
    let initialCapital = 0;
    if (wallet) {
      const allTransactions = await db.query.transactions.findMany({
        where: eq(transactions.walletId, wallet.id),
      });

      for (const tx of allTransactions) {
        const amount = parseFloat(tx.price || "0");
        if (tx.type === "deposit" && tx.subType === "benefit") {
          initialCapital += amount;
        }
      }
    }

    // 6. 총 자산 및 수익 계산
    const totalAssets = balance + totalHoldingValue;
    const profit = totalAssets - initialCapital;
    const profitRate = initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

    // 7. 랭킹 정보 계산
    const classGuests = await db.query.guests.findMany({
      where: eq(guests.classId, user.classId),
    });

    const totalParticipants = classGuests.length;

    // 간단한 랭킹 계산 (수익률 기준)
    const guestProfitRates = await Promise.all(
      classGuests.map(async (guest) => {
        const guestWallet = await db.query.wallets.findFirst({
          where: eq(wallets.guestId, guest.id),
        });

        const guestBalance = parseFloat(guestWallet?.balance || "0");

        const guestHoldings = await db.query.holdings.findMany({
          where: and(
            eq(holdings.guestId, guest.id),
            eq(holdings.classId, user.classId)
          ),
        });

        let guestHoldingValue = 0;
        for (const h of guestHoldings) {
          if (!h.stockId) continue;
          const price = await db.query.classStockPrices.findFirst({
            where: and(
              eq(classStockPrices.classId, user.classId),
              eq(classStockPrices.stockId, h.stockId),
              eq(classStockPrices.day, currentDay)
            ),
          });
          if (price) {
            guestHoldingValue += parseFloat(price.price || "0") * (h.quantity || 0);
          }
        }

        let guestInitialCapital = 0;
        if (guestWallet) {
          const guestTransactions = await db.query.transactions.findMany({
            where: eq(transactions.walletId, guestWallet.id),
          });
          for (const tx of guestTransactions) {
            if (tx.type === "deposit" && tx.subType === "benefit") {
              guestInitialCapital += parseFloat(tx.price || "0");
            }
          }
        }

        const guestTotalAssets = guestBalance + guestHoldingValue;
        const guestProfit = guestTotalAssets - guestInitialCapital;
        const guestProfitRate =
          guestInitialCapital > 0 ? (guestProfit / guestInitialCapital) * 100 : 0;

        return {
          guestId: guest.id,
          profitRate: guestProfitRate,
        };
      })
    );

    // 수익률 내림차순 정렬
    const sortedRates = guestProfitRates.sort(
      (a, b) => b.profitRate - a.profitRate
    );
    const myRank =
      sortedRates.findIndex((g) => g.guestId === user.id) + 1 || null;

    return {
      userName: user.name,
      className: classInfo.name,
      currentDay,
      totalDays,
      balance,
      totalHoldingValue,
      totalAssets,
      initialCapital,
      profit,
      profitRate,
      holdingStocks,
      myRank,
      totalParticipants,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    throw error;
  }
});
