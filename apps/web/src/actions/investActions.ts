"use server";

import { createWebClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStocks(classId: number, day: number) {
  "use server";
  const supabase = await createWebClient();

  // 현재일과 전일 주가 정보를 함께 조회합니다.
  const { data, error } = await supabase
    .from("stocks")
    .select(
      `
      *,
      class_stock_prices!inner ( day, price )
    `
    )
    .eq("class_stock_prices.class_id", classId)
    .in("class_stock_prices.day", [day, day - 1]);

  if (error) {
    console.error("일차별 주식 정보 조회 실패:", error);
    return [];
  }

  // 주식별로 현재가와 전일가를 찾아서 등락률을 계산합니다.
  const processedStocks = data.map((stock) => {
    const currentPriceInfo = stock.class_stock_prices.find(
      (p: { day: number; price: number }) => p.day === day
    );
    const prevPriceInfo = stock.class_stock_prices.find(
      (p: { day: number; price: number }) => p.day === day - 1
    );

    const currentPrice = currentPriceInfo?.price ?? 0;
    const prevPrice = prevPriceInfo?.price ?? currentPrice; // 전일 가격 없으면 현재가로

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
  const supabase = await createWebClient();
  const { data, error } = await supabase
    .from("holdings")
    .select(
      `
      quantity,
      stocks:stocks!inner ( id, name, class_stock_prices!inner(price) )
    `
    )
    .eq("class_id", classId)
    .eq("stocks.class_stock_prices.day", day);

    if (error) {
    console.error("포트폴리오 정보 조회 실패:", error);
    return [];
  }

  const portfolioData = data
    .map((item) => {
      const stockInfo = Array.isArray(item.stocks)
        ? item.stocks[0]
        : item.stocks;

      if (
        stockInfo &&
        stockInfo.class_stock_prices &&
        stockInfo.class_stock_prices.length > 0
      ) {
        return {
          quantity: item.quantity,
          stocks: {
            id: stockInfo.id,
            name: stockInfo.name,
            class_stock_prices: stockInfo.class_stock_prices,
          },
        };
      }
      return null;
    })
    .filter((item): item is PortfolioItem => item !== null);

  return portfolioData;
}

interface TradeParams {
  stockId: string;
  quantity: number;
  price: number;
  action: "buy" | "sell";
  classId: string;
}

export async function executeTrade(
  params: TradeParams
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createWebClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  const { error } = await supabase.rpc("handle_trade", {
    p_user_id: user.id,
    p_class_id: params.classId,
    p_stock_id: params.stockId,
    p_quantity: params.quantity,
    p_price: params.price,
    p_action: params.action,
  });

  if (error) {
    console.error("거래 처리 실패:", error);
    const message = error.message.includes("Insufficient")
      ? error.message
      : "거래 처리 중 오류가 발생했습니다.";
    return { error: message };
  }

  revalidatePath("/invest");

  return { success: true };
}
