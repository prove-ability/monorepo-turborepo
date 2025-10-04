"use server";

import { db, stocks, classStockPrices, classes, news } from "@repo/db";
import { eq, and, lte, asc, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";

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
