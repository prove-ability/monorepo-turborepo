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
import { eq, and, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
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
 * 랭킹 데이터 계산 함수 (캐싱 대상)
 * classId와 currentDay를 기준으로 캐싱
 */
const calculateRankingData = async (classId: string, currentDay: number, currentUserId: string) => {

  // 같은 클래스의 모든 게스트 조회
  const classGuests = await db.query.guests.findMany({
    where: eq(guests.classId, classId),
    columns: {
      id: true,
      nickname: true,
    },
  });

  if (classGuests.length === 0) {
    return [];
  }

  const guestIds = classGuests.map((g) => g.id);

  // 병렬로 모든 데이터 일괄 조회 (N+1 쿼리 문제 해결)
  const [allWallets, allHoldings] = await Promise.all([
    // 1. 모든 학생의 지갑 정보 일괄 조회
    db.query.wallets.findMany({
      where: inArray(wallets.guestId, guestIds),
    }),

    // 2. 모든 학생의 보유 주식 일괄 조회
    db.query.holdings.findMany({
      where: and(
        inArray(holdings.guestId, guestIds),
        eq(holdings.classId, classId)
      ),
    }),
  ]);

  // 지갑 ID로 맵 생성
  const walletMap = new Map(allWallets.map((w) => [w.guestId, w]));

  // 3. 필요한 모든 주식 ID 추출
  const stockIds = [
    ...new Set(
      allHoldings.map((h) => h.stockId).filter((id): id is string => id !== null)
    ),
  ];

  // 4. 병렬로 주식 가격 및 지원금 조회
  const walletIds = allWallets.map((w) => w.id);
  
  const [allPrices, benefitSums] = await Promise.all([
    // 4-1. 모든 주식의 현재가 일괄 조회
    stockIds.length > 0
      ? db.query.classStockPrices.findMany({
          where: and(
            eq(classStockPrices.classId, classId),
            inArray(classStockPrices.stockId, stockIds),
            eq(classStockPrices.day, currentDay)
          ),
        })
      : Promise.resolve([]),

    // 4-2. 모든 학생의 지원금 합계 일괄 조회 (SQL 집계)
    walletIds.length > 0
      ? db
          .select({
            walletId: transactions.walletId,
            total: sql<string>`COALESCE(SUM(CAST(${transactions.price} AS NUMERIC)), 0)`,
          })
          .from(transactions)
          .where(
            and(
              inArray(transactions.walletId, walletIds),
              eq(transactions.type, "deposit"),
              eq(transactions.subType, "benefit")
            )
          )
          .groupBy(transactions.walletId)
      : Promise.resolve([]),
  ]);

  // 주식 가격 맵 생성
  const priceMap = new Map(
    allPrices.map((p) => [p.stockId, parseFloat(p.price || "0")])
  );

  // 지원금 맵 생성
  const benefitMap = new Map(
    benefitSums.map((b) => [b.walletId, parseFloat(b.total || "0")])
  );

  // 5. 각 게스트의 랭킹 데이터 계산 (메모리에서 처리)
  const rankingData: Omit<RankingEntry, "rank">[] = classGuests.map((guest) => {
    const wallet = walletMap.get(guest.id);
    const balance = parseFloat(wallet?.balance || "0");

    // 보유 주식 평가액 계산
    const guestHoldings = allHoldings.filter((h) => h.guestId === guest.id);
    let holdingsValue = 0;

    for (const holding of guestHoldings) {
      if (!holding.stockId) continue;
      const price = priceMap.get(holding.stockId) || 0;
      holdingsValue += price * (holding.quantity || 0);
    }

    // 초기 자본, 총 자산, 수익 계산
    const initialCapital = wallet ? benefitMap.get(wallet.id) || 0 : 0;
    const totalAssets = balance + holdingsValue;
    const profit = totalAssets - initialCapital;
    const profitRate = initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

    return {
      guestId: guest.id,
      nickname: guest.nickname,
      totalAssets,
      initialCapital,
      profit,
      profitRate,
      isCurrentUser: guest.id === currentUserId,
    };
  });

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
};

/**
 * 캐싱된 랭킹 데이터 조회 함수
 * 5분 TTL, classId와 day를 기준으로 캐싱
 */
const getCachedRankingData = (classId: string, currentDay: number, currentUserId: string) => {
  return unstable_cache(
    async () => calculateRankingData(classId, currentDay, currentUserId),
    [`ranking-${classId}-${currentDay}`],
    {
      revalidate: 300, // 5분 TTL
      tags: [`ranking-${classId}`, `ranking-${classId}-day-${currentDay}`],
    }
  )();
};

/**
 * 클래스 내 게스트들의 수익 랭킹 조회
 * 수익률 기준 정렬, 동일 시 닉네임 가나다 순
 * 
 * 캐싱 전략:
 * - 5분 TTL로 자동 갱신
 * - 거래 발생 시 revalidateTag로 즉시 무효화
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
      return { rankings: [], currentDay: 1 };
    }

    const currentDay = classInfo.currentDay;

    // 캐싱된 랭킹 데이터 조회
    const rankedData = await getCachedRankingData(user.classId, currentDay, user.id);

    return {
      rankings: rankedData,
      currentDay,
    };
  } catch (error) {
    console.error("Failed to fetch class ranking:", error);
    return { rankings: [], currentDay: 1 };
  }
});
