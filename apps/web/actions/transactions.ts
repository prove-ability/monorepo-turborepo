"use server";

import { db, transactions, wallets, stocks } from "@repo/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";
import { checkClassStatus } from "@/lib/class-status";

export interface TransactionItem {
  id: string;
  type: "deposit" | "withdrawal";
  subType: "buy" | "sell" | "benefit";
  stockName: string | null;
  quantity: number;
  price: string;
  day: number;
  createdAt: Date;
}

export const getTransactionHistory = withAuth(async (user) => {
  // 클래스 상태 확인
  await checkClassStatus();

  try {
    // 사용자의 지갑 조회
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.guestId, user.id),
    });

    if (!wallet) {
      return [];
    }

    // 거래 내역 조회 (최신 Day부터, Day 내에서는 최신 시간순)
    const transactionList = await db.query.transactions.findMany({
      where: eq(transactions.walletId, wallet.id),
      orderBy: [desc(transactions.day), desc(transactions.createdAt)],
    });

    // N+1 쿼리 문제 해결: 모든 주식 ID를 한 번에 조회
    const stockIds = [
      ...new Set(
        transactionList
          .map((tx) => tx.stockId)
          .filter((id): id is string => id !== null)
      ),
    ];

    // 주식 정보 일괄 조회
    const stocksData =
      stockIds.length > 0
        ? await db.query.stocks.findMany({
            where: inArray(stocks.id, stockIds),
            columns: {
              id: true,
              name: true,
            },
          })
        : [];

    // 주식 ID -> 이름 맵 생성
    const stockMap = new Map(stocksData.map((s) => [s.id, s.name]));

    // 거래 내역 포맷팅 (메모리에서 처리)
    const formattedTransactions: TransactionItem[] = transactionList.map((tx) => ({
      id: tx.id,
      type: tx.type as "deposit" | "withdrawal",
      subType: tx.subType as "buy" | "sell" | "benefit",
      stockName: tx.stockId ? stockMap.get(tx.stockId) || null : null,
      quantity: tx.quantity,
      price: tx.price,
      day: tx.day,
      createdAt: tx.createdAt,
    }));

    return formattedTransactions;
  } catch (error) {
    console.error("Failed to fetch transaction history:", error);
    return [];
  }
});
