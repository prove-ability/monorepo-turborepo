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
import { withAuth } from "@/lib/with-auth";
import { checkClassStatus } from "@/lib/class-status";

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

  // 최근 지원금 정보
  latestBenefit: {
    amount: number;
    day: number;
    createdAt: Date;
  } | null;
}

export const getDashboardData = withAuth(async (user) => {
  // 클래스 상태 확인 (종료된 클래스는 자동 로그아웃)
  await checkClassStatus();

  try {
    // 병렬로 독립적인 데이터 조회 시작
    const [classInfo, wallet, userHoldings] = await Promise.all([
      // 1. 클래스 정보 조회
      db.query.classes.findFirst({
        where: eq(classes.id, user.classId),
      }),
      
      // 2. 지갑 조회
      db.query.wallets.findFirst({
        where: eq(wallets.guestId, user.id),
      }),
      
      // 3. 보유 주식 조회 (stock 정보 포함)
      db.query.holdings.findMany({
        where: and(
          eq(holdings.guestId, user.id),
          eq(holdings.classId, user.classId)
        ),
        with: {
          stock: true,
        },
      }),
    ]);

    if (!classInfo || classInfo.currentDay === null) {
      throw new Error("클래스 정보를 찾을 수 없습니다.");
    }

    const currentDay = classInfo.currentDay;
    const balance = parseFloat(wallet?.balance || "0");

    // 병렬로 추가 데이터 조회
    const [maxDayResult, benefitSum, currentPrices, rankingData, latestBenefitTx] = await Promise.all([
      // 4. 최대 Day 조회
      db.query.classStockPrices.findMany({
        where: eq(classStockPrices.classId, user.classId),
        orderBy: (classStockPrices, { desc }) => [desc(classStockPrices.day)],
        limit: 1,
      }),

      // 5. 초기 자본 계산 (한 번에 집계)
      wallet
        ? db
            .select({
              total: sql<string>`COALESCE(SUM(CAST(${transactions.price} AS NUMERIC)), 0)`,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.walletId, wallet.id),
                eq(transactions.type, "deposit"),
                eq(transactions.subType, "benefit")
              )
            )
        : Promise.resolve([{ total: "0" }]),

      // 6. 보유 주식의 현재가 일괄 조회 (N+1 문제 해결)
      userHoldings.length > 0
        ? db.query.classStockPrices.findMany({
            where: and(
              eq(classStockPrices.classId, user.classId),
              inArray(
                classStockPrices.stockId,
                userHoldings
                  .map((h) => h.stockId)
                  .filter((id): id is string => id !== null)
              ),
              eq(classStockPrices.day, currentDay)
            ),
          })
        : Promise.resolve([]),

      // 7. 랭킹 정보 (단일 복잡한 쿼리로 최적화)
      calculateClassRanking(user.classId, currentDay),

      // 8. 최근 지원금 조회
      wallet
        ? db.query.transactions.findFirst({
            where: and(
              eq(transactions.walletId, wallet.id),
              eq(transactions.type, "deposit"),
              eq(transactions.subType, "benefit"),
              eq(transactions.day, currentDay)
            ),
            orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
          })
        : Promise.resolve(null),
    ]);

    const totalDays = maxDayResult[0]?.day || 0;
    const initialCapital = parseFloat(benefitSum[0]?.total || "0");

    // 현재가 Map 생성 (빠른 조회)
    const priceMap = new Map(
      currentPrices.map((p) => [p.stockId, parseFloat(p.price || "0")])
    );

    // 보유 주식 계산
    let totalHoldingValue = 0;
    const holdingStocks = userHoldings
      .map((holding) => {
        if (!holding.stock || !holding.stockId) return null;

        const price = priceMap.get(holding.stockId);
        if (!price) return null;

        const quantity = holding.quantity || 0;
        const holdingValue = price * quantity;
        const averagePrice = parseFloat(holding.averagePurchasePrice || "0");
        const profitLoss = (price - averagePrice) * quantity;
        const profitLossRate =
          averagePrice > 0 ? (profitLoss / (averagePrice * quantity)) * 100 : 0;

        totalHoldingValue += holdingValue;

        return {
          stockId: holding.stockId,
          stockName: holding.stock.name,
          quantity,
          currentPrice: price,
          holdingValue,
          averagePrice,
          profitLoss,
          profitLossRate,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 총 자산 및 수익 계산
    const totalAssets = balance + totalHoldingValue;
    const profit = totalAssets - initialCapital;
    const profitRate = initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

    // 내 순위 찾기
    const myRank =
      rankingData.findIndex((r) => r.guestId === user.id) + 1 || null;

    // 최근 지원금
    const latestBenefit = latestBenefitTx
      ? {
          amount: parseFloat(latestBenefitTx.price || "0"),
          day: latestBenefitTx.day,
          createdAt: latestBenefitTx.createdAt,
        }
      : null;

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
      totalParticipants: rankingData.length,
      latestBenefit,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    throw error;
  }
});

// 랭킹 계산 최적화 - 단일 복잡한 쿼리 대신 효율적인 방식
async function calculateClassRanking(classId: string, currentDay: number) {
  // 1. 클래스의 모든 학생 ID 조회
  const classGuests = await db.query.guests.findMany({
    where: eq(guests.classId, classId),
    columns: { id: true },
  });

  if (classGuests.length === 0) return [];

  const guestIds = classGuests.map((g) => g.id);

  // 2. 모든 학생의 지갑 정보 일괄 조회
  const allWallets = await db.query.wallets.findMany({
    where: inArray(wallets.guestId, guestIds),
  });

  const walletMap = new Map(allWallets.map((w) => [w.guestId, w]));

  // 3. 모든 학생의 보유 주식 일괄 조회
  const allHoldings = await db.query.holdings.findMany({
    where: and(
      inArray(holdings.guestId, guestIds),
      eq(holdings.classId, classId)
    ),
  });

  // 4. 필요한 모든 주식 ID 추출
  const stockIds = [
    ...new Set(
      allHoldings.map((h) => h.stockId).filter((id): id is string => id !== null)
    ),
  ];

  // 5. 모든 주식의 현재가 일괄 조회
  const allPrices =
    stockIds.length > 0
      ? await db.query.classStockPrices.findMany({
          where: and(
            eq(classStockPrices.classId, classId),
            inArray(classStockPrices.stockId, stockIds),
            eq(classStockPrices.day, currentDay)
          ),
        })
      : [];

  const priceMap = new Map(
    allPrices.map((p) => [p.stockId, parseFloat(p.price || "0")])
  );

  // 6. 모든 학생의 지원금 합계 일괄 조회
  const walletIds = allWallets.map((w) => w.id);
  const benefitSums =
    walletIds.length > 0
      ? await db
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
      : [];

  const benefitMap = new Map(
    benefitSums.map((b) => [b.walletId, parseFloat(b.total || "0")])
  );

  // 7. 각 학생별 자산 및 수익률 계산
  const rankings = classGuests.map((guest) => {
    const wallet = walletMap.get(guest.id);
    const balance = parseFloat(wallet?.balance || "0");

    // 보유 주식 평가액 계산
    const guestHoldings = allHoldings.filter((h) => h.guestId === guest.id);
    let holdingValue = 0;

    for (const holding of guestHoldings) {
      if (!holding.stockId) continue;
      const price = priceMap.get(holding.stockId) || 0;
      holdingValue += price * (holding.quantity || 0);
    }

    const initialCapital = wallet ? benefitMap.get(wallet.id) || 0 : 0;
    const totalAssets = balance + holdingValue;
    const profit = totalAssets - initialCapital;
    const profitRate = initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

    return {
      guestId: guest.id,
      profitRate,
    };
  });

  // 수익률 내림차순 정렬
  return rankings.sort((a, b) => b.profitRate - a.profitRate);
}
