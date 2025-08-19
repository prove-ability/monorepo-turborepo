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
}

export async function executeTrade(
  params: TradeParams
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createWebClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id, class_id")
    .eq("user_id", authUser.id)
    .single();

  if (userError || !user) {
    return { error: "학생 정보를 찾을 수 없습니다." };
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("current_day")
    .eq("id", user.class_id)
    .single();

  if (classError || !classData) {
    return { error: "클래스 정보를 조회할 수 없습니다." };
  }

  const { stockId, quantity, price, action } = params;
  const totalValue = price * quantity;

  // 1. 지갑 정보 조회
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("id, balance")
    .eq("user_id", user.user_id)
    .single();

  if (walletError || !wallet) {
    return { error: "지갑 정보를 가져올 수 없습니다." };
  }

  console.log("wallet", wallet);

  if (action === "buy") {
    // 매수 로직
    if (wallet.balance < totalValue) {
      return { error: "자산이 부족합니다." };
    }

    const { data: holding, error: holdingError } = await supabase
      .from("holdings")
      .select("id, quantity, average_purchase_price")
      .eq("user_id", user.user_id)
      .eq("stock_id", stockId)
      .single();

    // 트랜잭션 시작 (Supabase Edge Function을 사용하지 않으므로, 각 단계를 순차적으로 실행하며 실패 시 롤백을 시도해야 합니다)
    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({ balance: wallet.balance - totalValue })
      .eq("user_id", user.user_id);

    if (walletUpdateError) {
      return { error: "지갑 업데이트 실패." };
    }

    if (holding) {
      // 보유 주식 업데이트
      const newQuantity = holding.quantity + quantity;
      const newAvgPrice =
        (holding.quantity * holding.average_purchase_price + totalValue) /
        newQuantity;
      const { error: updateHoldingError } = await supabase
        .from("holdings")
        .update({ quantity: newQuantity, average_purchase_price: newAvgPrice })
        .eq("id", holding.id);
      if (updateHoldingError) {
        // 롤백
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance })
          .eq("user_id", user.user_id);
        return { error: "보유 주식 업데이트 실패." };
      }
    } else {
      // 신규 주식 추가
      const { error: insertHoldingError } = await supabase
        .from("holdings")
        .insert({
          user_id: user.user_id,
          class_id: user.class_id,
          stock_id: stockId,
          quantity: quantity,
          average_purchase_price: price,
        });
      if (insertHoldingError) {
        console.error("신규 주식 추가 실패:", insertHoldingError);
        // 롤백
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance })
          .eq("user_id", user.user_id);
        return { error: "신규 주식 추가 실패." };
      }
    }
  } else if (action === "sell") {
    // 매도 로직
    const { data: holding, error: holdingError } = await supabase
      .from("holdings")
      .select("id, quantity")
      .eq("user_id", user.user_id)
      .eq("stock_id", stockId)
      .single();

    if (holdingError || !holding || holding.quantity < quantity) {
      return { error: "보유 수량이 부족합니다." };
    }

    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({ balance: wallet.balance + totalValue })
      .eq("user_id", user.user_id);

    if (walletUpdateError) {
      return { error: "지갑 업데이트 실패." };
    }

    if (holding.quantity > quantity) {
      // 보유 수량 차감
      const { error: updateHoldingError } = await supabase
        .from("holdings")
        .update({ quantity: holding.quantity - quantity })
        .eq("id", holding.id);
      if (updateHoldingError) {
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance })
          .eq("user_id", user.user_id);
        return { error: "보유 주식 업데이트 실패." };
      }
    } else {
      // 보유 주식 삭제
      const { error: deleteHoldingError } = await supabase
        .from("holdings")
        .delete()
        .eq("id", holding.id);
      if (deleteHoldingError) {
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance })
          .eq("user_id", user.user_id);
        return { error: "보유 주식 삭제 실패." };
      }
    }
  }

  // 3. 거래 기록 추가
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      wallet_id: wallet.id,
      class_id: user.class_id,
      stock_id: stockId,
      type: action,
      quantity: quantity,
      price: price,
      day: classData.current_day,
    });

  if (transactionError) {
    console.error("거래 기록 추가 실패:", transactionError);
    return { error: "거래 기록 추가에 실패했습니다." };
  }

  revalidatePath("/invest");
  return { success: true };
}
