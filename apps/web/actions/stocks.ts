"use server";

import {
  db,
  stocks,
  classStockPrices,
  holdings,
  classes,
  wallets,
  transactions,
  news,
} from "@repo/db";
import { eq, and, inArray, lte, asc } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";
import { checkClassStatus } from "@/lib/class-status";

interface StockPriceData {
  day: number;
  price: number;
  news?: Array<{
    title: string;
    content: string;
  }>;
}

interface StockWithPrices {
  id: string;
  name: string;
  prices: StockPriceData[];
  currentDay: number;
  maxDay: number;
}

export const getStocksWithPrices = withAuth(async (user) => {
  try {
    // 클래스 정보 조회 (current_day)
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: {
        currentDay: true,
      },
    });

    if (!classInfo || !classInfo.currentDay) {
      return [];
    }

    const currentDay = classInfo.currentDay;

    // 모든 주식 조회
    const allStocks = await db.query.stocks.findMany({
      orderBy: [asc(stocks.name)],
    });

    // 현재 Day까지의 가격 조회
    const allPrices = await db.query.classStockPrices.findMany({
      where: and(
        eq(classStockPrices.classId, user.classId),
        lte(classStockPrices.day, currentDay)
      ),
      orderBy: [asc(classStockPrices.day)],
    });

    // 현재 Day까지의 뉴스 조회 (가격에 영향을 준 전날 뉴스)
    const allNews = await db.query.news.findMany({
      where: and(eq(news.classId, user.classId), lte(news.day, currentDay)),
      orderBy: [asc(news.day)],
    });

    // 주식별로 데이터 구성
    const stocksWithPrices: StockWithPrices[] = allStocks.map((stock) => {
      // 해당 주식의 가격 데이터
      const stockPrices = allPrices.filter((p) => p.stockId === stock.id);

      // Day별 가격 및 관련 뉴스 매핑
      const pricesByDay: StockPriceData[] = [];

      for (let day = 1; day <= currentDay; day++) {
        const priceData = stockPrices.find((p) => p.day === day);

        if (priceData) {
          // 전날 뉴스 찾기 (day 2의 가격은 day 1의 뉴스 영향)
          const previousDayNews = allNews.filter(
            (n) =>
              n.day === day - 1 &&
              n.relatedStockIds &&
              Array.isArray(n.relatedStockIds) &&
              n.relatedStockIds.includes(stock.id)
          );

          pricesByDay.push({
            day,
            price:
              typeof priceData.price === "number"
                ? priceData.price
                : Number(priceData.price) || 0,
            news: previousDayNews
              .filter((n) => n.title && n.content)
              .map((n) => ({
                title: n.title!,
                content: n.content!,
              })),
          });
        }
      }

      return {
        id: stock.id,
        name: stock.name,
        prices: pricesByDay,
        currentDay,
        maxDay: 9, // 고정값 (필요시 DB에서 조회 가능)
      };
    });

    return stocksWithPrices;
  } catch (error) {
    console.error("Failed to fetch stocks with prices:", error);
    return [];
  }
});

// 특정 주식들의 기본 정보 조회
export const getStockInfo = withAuth(async (user, stockIds: string[]) => {
  try {
    if (stockIds.length === 0) return [];

    // 주식 정보 조회
    const stocksData = await db.query.stocks.findMany({
      where: inArray(stocks.id, stockIds),
      columns: {
        id: true,
        name: true,
        industrySector: true,
        remarks: true,
        marketCountryCode: true,
      },
    });

    return stocksData.map((stock) => ({
      id: stock.id,
      name: stock.name,
      sector: stock.industrySector,
      remarks: stock.remarks,
      marketCountry: stock.marketCountryCode,
    }));
  } catch (error) {
    console.error("Failed to fetch stock info:", error);
    return [];
  }
});

// 투자 페이지를 위한 주식 목록 조회 (현재가, 보유량 포함)
export const getStocksForInvest = withAuth(async (user) => {
  // 클래스 상태 확인
  await checkClassStatus();

  try {
    // 클래스 정보 및 현재 Day 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: { currentDay: true },
    });

    if (!classInfo || classInfo.currentDay === null) {
      return { stocks: [], balance: 0, currentDay: 1, totalDays: 0 };
    }

    const currentDay = classInfo.currentDay;

    // 최대 Day 조회 (totalDays)
    const maxDayResult = await db.query.classStockPrices.findMany({
      where: eq(classStockPrices.classId, user.classId),
      orderBy: (classStockPrices, { desc }) => [desc(classStockPrices.day)],
      limit: 1,
    });
    const totalDays = maxDayResult[0]?.day || 0;

    // 현재 Day의 가격 조회
    const currentPrices = await db.query.classStockPrices.findMany({
      where: and(
        eq(classStockPrices.classId, user.classId),
        eq(classStockPrices.day, currentDay)
      ),
    });

    // 해당 클래스에 속한 주식 ID 목록 추출
    const classStockIds = Array.from(
      new Set(currentPrices.map((p) => p.stockId))
    );

    // 해당 클래스에 속한 주식만 조회
    const allStocks =
      classStockIds.length > 0
        ? await db.query.stocks.findMany({
            where: inArray(
              stocks.id,
              classStockIds.filter((id): id is string => id !== null)
            ),
            orderBy: [asc(stocks.name)],
            columns: {
              id: true,
              name: true,
              marketCountryCode: true,
            },
          })
        : [];

    // 전날 가격 조회 (등락률 계산용)
    const previousPrices =
      currentDay > 1
        ? await db.query.classStockPrices.findMany({
            where: and(
              eq(classStockPrices.classId, user.classId),
              eq(classStockPrices.day, currentDay - 1)
            ),
          })
        : [];

    // 현재 Day의 뉴스만 조회 (주식별 뉴스 개수 계산용 - 최적화)
    const allNews = await db.query.news.findMany({
      where: and(eq(news.classId, user.classId), eq(news.day, currentDay)),
      columns: {
        relatedStockIds: true,
      },
    });

    // 사용자의 보유 주식 조회
    const userHoldings = await db.query.holdings.findMany({
      where: and(
        eq(holdings.guestId, user.id),
        eq(holdings.classId, user.classId)
      ),
    });

    // 사용자의 지갑 조회
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.guestId, user.id),
    });

    const balance = parseFloat(wallet?.balance || "0");

    // 초기 자본 계산 (지원금만 조회 - 최적화)
    let initialCapital = 0;
    if (wallet) {
      const benefitTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.walletId, wallet.id),
          eq(transactions.type, "deposit"),
          eq(transactions.subType, "benefit")
        ),
        columns: {
          price: true,
        },
      });

      initialCapital = benefitTransactions.reduce(
        (sum, tx) => sum + parseFloat(tx.price || "0"),
        0
      );
    }

    // 주식 데이터 조합
    const stocksWithInfo = allStocks.map((stock) => {
      const currentPrice = currentPrices.find((p) => p.stockId === stock.id);
      const previousPrice = previousPrices.find((p) => p.stockId === stock.id);
      const holding = userHoldings.find((h) => h.stockId === stock.id);

      const currentPriceValue = parseFloat(currentPrice?.price || "0");
      const previousPriceValue = parseFloat(previousPrice?.price || "0");

      const change =
        previousPriceValue > 0 ? currentPriceValue - previousPriceValue : 0;
      const changeRate =
        previousPriceValue > 0 ? (change / previousPriceValue) * 100 : 0;

      const holdingQuantity = holding?.quantity || 0;
      const holdingValue = currentPriceValue * holdingQuantity;

      // 해당 주식 관련 뉴스 개수 계산
      const newsCount = allNews.filter((newsItem) => {
        if (
          newsItem.relatedStockIds &&
          Array.isArray(newsItem.relatedStockIds)
        ) {
          return newsItem.relatedStockIds.includes(stock.id);
        }
        return false;
      }).length;

      return {
        id: stock.id,
        name: stock.name,
        currentPrice: currentPriceValue,
        change,
        changeRate,
        marketCountryCode: stock.marketCountryCode,
        holdingQuantity,
        holdingValue,
        averagePurchasePrice: parseFloat(holding?.averagePurchasePrice || "0"),
        newsCount,
      };
    });

    // 전체 자산 계산
    const totalHoldingValue = stocksWithInfo.reduce(
      (sum, s) => sum + s.holdingValue,
      0
    );
    const totalAssets = balance + totalHoldingValue;

    // 전체 자산 대비 수익률 계산
    const profit = totalAssets - initialCapital;
    const profitRate = initialCapital > 0 ? (profit / initialCapital) * 100 : 0;

    return {
      stocks: stocksWithInfo,
      balance,
      currentDay,
      totalDays,
      initialCapital,
      totalAssets,
      profit,
      profitRate,
    };
  } catch (error) {
    console.error("Failed to fetch stocks for invest:", error);
    return {
      stocks: [],
      balance: 0,
      totalDays: 0,
      currentDay: 1,
      initialCapital: 0,
      totalAssets: 0,
      profit: 0,
      profitRate: 0,
    };
  }
});

// 단일 주식 정보 조회
export const getStockById = withAuth(async (user, stockId: string) => {
  try {
    // 클래스 정보 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: { currentDay: true },
    });

    if (!classInfo || classInfo.currentDay === null) {
      return null;
    }

    const currentDay = classInfo.currentDay;

    // 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.id, stockId),
    });

    if (!stock) {
      return null;
    }

    // 현재 Day의 가격 조회
    const currentPrice = await db.query.classStockPrices.findFirst({
      where: and(
        eq(classStockPrices.classId, user.classId),
        eq(classStockPrices.stockId, stockId),
        eq(classStockPrices.day, currentDay)
      ),
    });

    // 전날 가격 조회 (등락률 계산용)
    const previousPrice =
      currentDay > 1
        ? await db.query.classStockPrices.findFirst({
            where: and(
              eq(classStockPrices.classId, user.classId),
              eq(classStockPrices.stockId, stockId),
              eq(classStockPrices.day, currentDay - 1)
            ),
          })
        : null;

    const currentPriceValue = parseFloat(currentPrice?.price || "0");
    const previousPriceValue = parseFloat(previousPrice?.price || "0");

    const change =
      previousPriceValue > 0 ? currentPriceValue - previousPriceValue : 0;
    const changeRate =
      previousPriceValue > 0 ? (change / previousPriceValue) * 100 : 0;

    return {
      id: stock.id,
      name: stock.name,
      currentPrice: currentPriceValue,
      change,
      changeRate,
      marketCountryCode: stock.marketCountryCode,
      industrySector: stock.industrySector,
      remarks: stock.remarks,
    };
  } catch (error) {
    console.error("Error fetching stock info:", error);
    return null;
  }
});
