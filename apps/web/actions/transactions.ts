"use server";

import { db, transactions, wallets, stocks } from "@repo/db";
import { eq, desc, and } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";

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
  try {
    // 사용자의 지갑 조회
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.guestId, user.id),
    });

    if (!wallet) {
      return [];
    }

    // 거래 내역 조회 (최신순)
    const transactionList = await db.query.transactions.findMany({
      where: eq(transactions.walletId, wallet.id),
      orderBy: [desc(transactions.createdAt)],
    });

    // 각 거래의 주식 정보 조회
    const formattedTransactions: TransactionItem[] = await Promise.all(
      transactionList.map(async (tx) => {
        let stockName: string | null = null;
        
        if (tx.stockId) {
          const stock = await db.query.stocks.findFirst({
            where: eq(stocks.id, tx.stockId),
          });
          stockName = stock?.name || null;
        }

        return {
          id: tx.id,
          type: tx.type as "deposit" | "withdrawal",
          subType: tx.subType as "buy" | "sell" | "benefit",
          stockName,
          quantity: tx.quantity,
          price: tx.price,
          day: tx.day,
          createdAt: tx.createdAt,
        };
      })
    );

    return formattedTransactions;
  } catch (error) {
    console.error("Failed to fetch transaction history:", error);
    return [];
  }
});
