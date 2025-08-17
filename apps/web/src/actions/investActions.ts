"use server";

import { createWebClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStocks(classId: number, day: number) {
  "use server";
  const supabase = await createWebClient();
  const { data, error } = await supabase
    .from("class_stock_prices")
    .select(
      `
      price,
      stocks (*)
    `
    )
    .eq("class_id", classId)
    .eq("day", day);

  if (error) {
    console.error("일차별 주식 정보 조회 실패:", error);
    return [];
  }

  // stocks 객체를 펼쳐서 필요한 데이터만 반환
  return data.map((item) => ({
    ...item.stocks,
    price: item.price,
  }));
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

  console.log("classId", classId);

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
