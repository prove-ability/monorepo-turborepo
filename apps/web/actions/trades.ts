"use server";

import {
  dbWithTransaction,
  wallets,
  holdings,
  transactions,
  classes,
} from "@repo/db";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";

export interface TradeResult {
  success: boolean;
  message: string;
  balance?: string;
  holding?: {
    quantity: number;
    averagePurchasePrice: string;
  };
}

/**
 * 매수 서버 액션
 * DB 트랜잭션을 사용하여 wallets, holdings, transactions 테이블을 원자적으로 업데이트
 */
export const buyStock = withAuth(
  async (
    user,
    stockId: string,
    quantity: number,
    price: string
  ): Promise<TradeResult> => {
    if (quantity <= 0) {
      return { success: false, message: "수량은 1 이상이어야 합니다." };
    }

    try {
      return await dbWithTransaction.transaction(async (tx) => {
        // 1. 사용자의 지갑 조회
        const userWallet = await tx.query.wallets.findFirst({
          where: eq(wallets.guestId, user.id),
        });

        if (!userWallet) {
          throw new Error("지갑 정보를 찾을 수 없습니다.");
        }

        // 2. 잔액 확인
        const currentBalance = parseFloat(userWallet.balance || "0");
        const totalCost = parseFloat(price) * quantity;

        if (currentBalance < totalCost) {
          return {
            success: false,
            message: `잔액이 부족합니다. (필요: ${totalCost.toLocaleString()}원, 보유: ${currentBalance.toLocaleString()}원)`,
          };
        }

        // 3. 클래스의 현재 Day 조회
        const classInfo = await tx.query.classes.findFirst({
          where: eq(classes.id, user.classId),
          columns: { currentDay: true },
        });

        if (!classInfo || classInfo.currentDay === null) {
          throw new Error("클래스 정보를 찾을 수 없습니다.");
        }

        const currentDay = classInfo.currentDay;

        // 4. 기존 보유 주식 확인
        const existingHolding = await tx.query.holdings.findFirst({
          where: and(
            eq(holdings.guestId, user.id),
            eq(holdings.stockId, stockId),
            eq(holdings.classId, user.classId)
          ),
        });

        let newAveragePurchasePrice: string;
        let newQuantity: number;

        if (existingHolding) {
          // 기존 보유량이 있으면 평균 단가 재계산
          const existingValue =
            parseFloat(existingHolding.averagePurchasePrice || "0") *
            (existingHolding.quantity || 0);
          const newValue = parseFloat(price) * quantity;
          newQuantity = (existingHolding.quantity || 0) + quantity;
          newAveragePurchasePrice = (
            (existingValue + newValue) /
            newQuantity
          ).toFixed(2);

          // holdings 업데이트
          await tx
            .update(holdings)
            .set({
              quantity: newQuantity,
              averagePurchasePrice: newAveragePurchasePrice,
            })
            .where(eq(holdings.id, existingHolding.id));
        } else {
          // 새로운 보유 주식 추가
          newQuantity = quantity;
          newAveragePurchasePrice = parseFloat(price).toFixed(2);

          await tx.insert(holdings).values({
            guestId: user.id,
            classId: user.classId,
            stockId: stockId,
            quantity: newQuantity,
            averagePurchasePrice: newAveragePurchasePrice,
          });
        }

        // 5. 거래 내역 추가 (매수 = 출금)
        await tx.insert(transactions).values({
          walletId: userWallet.id,
          stockId: stockId,
          type: "withdrawal",
          subType: "buy",
          quantity: quantity,
          price: price,
          day: currentDay,
          classId: user.classId,
        });

        // 6. 지갑 잔액 업데이트
        const newBalance = (currentBalance - totalCost).toFixed(2);
        await tx
          .update(wallets)
          .set({ balance: newBalance })
          .where(eq(wallets.id, userWallet.id));

        return {
          success: true,
          message: `매수 완료: ${quantity}주를 ${totalCost.toLocaleString()}원에 구매했습니다.`,
          balance: newBalance,
          holding: {
            quantity: newQuantity,
            averagePurchasePrice: newAveragePurchasePrice,
          },
        };
      });
    } catch (error) {
      console.error("매수 실패:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "매수 중 오류가 발생했습니다.",
      };
    }
  }
);

/**
 * 매도 서버 액션
 * DB 트랜잭션을 사용하여 wallets, holdings, transactions 테이블을 원자적으로 업데이트
 */
export const sellStock = withAuth(
  async (
    user,
    stockId: string,
    quantity: number,
    price: string
  ): Promise<TradeResult> => {
    if (quantity <= 0) {
      return { success: false, message: "수량은 1 이상이어야 합니다." };
    }

    try {
      return await dbWithTransaction.transaction(async (tx) => {
        // 1. 사용자의 지갑 조회
        const userWallet = await tx.query.wallets.findFirst({
          where: eq(wallets.guestId, user.id),
        });

        if (!userWallet) {
          throw new Error("지갑 정보를 찾을 수 없습니다.");
        }

        // 2. 보유 주식 확인
        const existingHolding = await tx.query.holdings.findFirst({
          where: and(
            eq(holdings.guestId, user.id),
            eq(holdings.stockId, stockId),
            eq(holdings.classId, user.classId)
          ),
        });

        if (!existingHolding) {
          return {
            success: false,
            message: "보유하고 있지 않은 주식입니다.",
          };
        }

        const currentQuantity = existingHolding.quantity || 0;
        if (currentQuantity < quantity) {
          return {
            success: false,
            message: `수량이 부족합니다. (보유: ${currentQuantity}주, 매도 시도: ${quantity}주)`,
          };
        }

        // 3. 클래스의 현재 Day 조회
        const classInfo = await tx.query.classes.findFirst({
          where: eq(classes.id, user.classId),
          columns: { currentDay: true },
        });

        if (!classInfo || classInfo.currentDay === null) {
          throw new Error("클래스 정보를 찾을 수 없습니다.");
        }

        const currentDay = classInfo.currentDay;

        // 4. 보유 주식 업데이트 또는 삭제
        const newQuantity = currentQuantity - quantity;
        if (newQuantity === 0) {
          // 모두 매도하면 holdings에서 삭제
          await tx.delete(holdings).where(eq(holdings.id, existingHolding.id));
        } else {
          // 일부만 매도하면 수량 업데이트
          await tx
            .update(holdings)
            .set({ quantity: newQuantity })
            .where(eq(holdings.id, existingHolding.id));
        }

        // 5. 거래 내역 추가 (매도 = 입금)
        await tx.insert(transactions).values({
          walletId: userWallet.id,
          stockId: stockId,
          type: "deposit",
          subType: "sell",
          quantity: quantity,
          price: price,
          day: currentDay,
          classId: user.classId,
        });

        // 6. 지갑 잔액 업데이트
        const currentBalance = parseFloat(userWallet.balance || "0");
        const totalRevenue = parseFloat(price) * quantity;
        const newBalance = (currentBalance + totalRevenue).toFixed(2);

        await tx
          .update(wallets)
          .set({ balance: newBalance })
          .where(eq(wallets.id, userWallet.id));

        return {
          success: true,
          message: `매도 완료: ${quantity}주를 ${totalRevenue.toLocaleString()}원에 판매했습니다.`,
          balance: newBalance,
          holding:
            newQuantity > 0
              ? {
                  quantity: newQuantity,
                  averagePurchasePrice:
                    existingHolding.averagePurchasePrice || "0",
                }
              : undefined,
        };
      });
    } catch (error) {
      console.error("매도 실패:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "매도 중 오류가 발생했습니다.",
      };
    }
  }
);
