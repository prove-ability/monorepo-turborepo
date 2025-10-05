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
import { checkClassStatus } from "@/lib/class-status";

export interface RankingEntry {
  rank: number;
  guestId: string;
  nickname: string | null;
  totalAssets: number; // 총 자산 (잔액 + 보유 주식 평가액)
  initialCapital: number; // 초기 자본 (받은 지원금 총액)
  profit: number; // 수익금 (총 자산 - 초기 자본)
  profitRate: number; // 수익률 (%)
  isCurrentUser: boolean;
}

/**
 * 클래스 내 게스트들의 수익 랭킹 조회
 * 수익률 기준 정렬, 동일 시 닉네임 가나다 순
 */
export const getClassRanking = withAuth(async (user) => {
  // 클래스 상태 확인
  await checkClassStatus();

  try {
    // 클래스 정보 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: { currentDay: true },
    });

    if (!classInfo || classInfo.currentDay === null) {
      return [];
    }

    const currentDay = classInfo.currentDay;

    // 같은 클래스의 모든 게스트 조회
    const classGuests = await db.query.guests.findMany({
      where: eq(guests.classId, user.classId),
      columns: {
        id: true,
        nickname: true,
      },
    });

    // 각 게스트의 랭킹 데이터 계산
    const rankingData: Omit<RankingEntry, "rank">[] = await Promise.all(
      classGuests.map(async (guest) => {
        // 1. 지갑 조회 (현재 잔액)
        const wallet = await db.query.wallets.findFirst({
          where: eq(wallets.guestId, guest.id),
        });

        const balance = parseFloat(wallet?.balance || "0");

        // 2. 보유 주식 조회
        const guestHoldings = await db.query.holdings.findMany({
          where: and(
            eq(holdings.guestId, guest.id),
            eq(holdings.classId, user.classId)
          ),
        });

        // 3. 보유 주식의 현재가 조회하여 평가액 계산
        let holdingsValue = 0;
        for (const holding of guestHoldings) {
          if (!holding.stockId) continue;

          const currentPrice = await db.query.classStockPrices.findFirst({
            where: and(
              eq(classStockPrices.classId, user.classId),
              eq(classStockPrices.stockId, holding.stockId),
              eq(classStockPrices.day, currentDay)
            ),
          });

          if (currentPrice) {
            const price = parseFloat(currentPrice.price || "0");
            holdingsValue += price * (holding.quantity || 0);
          }
        }

        // 4. 거래 내역 조회하여 초기 자본 계산
        // 초기 자본 = 모든 지원금(benefit) 합계
        let initialCapital = 0;

        if (wallet) {
          const allTransactions = await db.query.transactions.findMany({
            where: eq(transactions.walletId, wallet.id),
          });

          for (const tx of allTransactions) {
            const amount = parseFloat(tx.price || "0");

            if (tx.type === "deposit" && tx.subType === "benefit") {
              // 게스트 생성 시 초기 자본 + Day 증가 시 받은 지원금
              initialCapital += amount;
            }
          }
        }

        // 5. 총 자산 및 수익 계산
        const totalAssets = balance + holdingsValue;

        // 순수익 = 현재 총 자산 - 초기 자본
        const profit = totalAssets - initialCapital;

        // 수익률 = (순수익 / 초기 자본) × 100
        const profitRate =
          initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

        return {
          guestId: guest.id,
          nickname: guest.nickname,
          totalAssets,
          initialCapital,
          profit,
          profitRate,
          isCurrentUser: guest.id === user.id,
        };
      })
    );

    // 6. 정렬: 수익률 내림차순, 동일 시 닉네임 가나다 순
    const sortedData = rankingData.sort((a, b) => {
      if (b.profitRate !== a.profitRate) {
        return b.profitRate - a.profitRate;
      }
      // 수익률이 같으면 닉네임 가나다 순
      const nameA = a.nickname || "닉네임 없음";
      const nameB = b.nickname || "닉네임 없음";
      return nameA.localeCompare(nameB, "ko");
    });

    // 7. 순위 부여
    const rankedData: RankingEntry[] = sortedData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return rankedData;
  } catch (error) {
    console.error("Failed to fetch class ranking:", error);
    return [];
  }
});
