"use server";

import { db, news, classes, stocks } from "@repo/db";
import { eq, and, lte, inArray, asc } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";
import { checkClassStatus } from "@/lib/class-status";

interface RelatedStock {
  id: string;
  name: string;
}
export const getCurrentDayNews = withAuth(async (user) => {
  try {
    // 클래스의 current_day 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: {
        currentDay: true,
      },
    });

    if (!classInfo || !classInfo.currentDay) {
      return [];
    }

    // current_day의 뉴스만 조회
    const allNews = await db.query.news.findMany({
      where: and(
        eq(news.classId, user.classId),
        eq(news.day, classInfo.currentDay)
      ),
      orderBy: [asc(news.createdAt)],
    });

    // 모든 관련 주식 ID 수집
    const allStockIds = new Set<string>();
    allNews.forEach((newsItem) => {
      if (newsItem.relatedStockIds && Array.isArray(newsItem.relatedStockIds)) {
        newsItem.relatedStockIds.forEach((id) => allStockIds.add(id as string));
      }
    });

    // 주식 정보 조회
    const stocksData =
      allStockIds.size > 0
        ? await db.query.stocks.findMany({
            where: inArray(stocks.id, Array.from(allStockIds)),
          })
        : [];

    // 주식 ID -> 이름 매핑
    const stockMap = new Map(stocksData.map((s) => [s.id, s.name]));

    // 뉴스에 주식 이름 추가
    const newsWithStockNames = allNews.map((newsItem) => ({
      ...newsItem,
      relatedStocks:
        newsItem.relatedStockIds && Array.isArray(newsItem.relatedStockIds)
          ? newsItem.relatedStockIds
              .map((id): RelatedStock | null => {
                const stockName = stockMap.get(id as string);
                return stockName ? { id: id as string, name: stockName } : null;
              })
              .filter((stock): stock is RelatedStock => stock !== null)
          : [],
    }));

    return newsWithStockNames;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
});

export const getNewsByDay = withAuth(async (user, day: number) => {
  try {
    // 특정 Day의 뉴스만 조회
    const dayNews = await db.query.news.findMany({
      where: and(eq(news.classId, user.classId), eq(news.day, day)),
    });

    return dayNews;
  } catch (error) {
    console.error("Failed to fetch news by day:", error);
    return [];
  }
});

// 특정 주식 관련 뉴스 조회
export const getNewsByStock = withAuth(async (user, stockId: string) => {
  try {
    // 클래스의 current_day 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: {
        currentDay: true,
      },
    });

    if (!classInfo || !classInfo.currentDay) {
      return [];
    }

    // 현재 Day까지의 뉴스만 조회
    const allNews = await db.query.news.findMany({
      where: and(
        eq(news.classId, user.classId),
        lte(news.day, classInfo.currentDay)
      ),
      orderBy: [asc(news.day)],
    });

    // stockId가 relatedStockIds에 포함된 뉴스만 필터링
    const stockNews = allNews.filter((newsItem) => {
      if (newsItem.relatedStockIds && Array.isArray(newsItem.relatedStockIds)) {
        return newsItem.relatedStockIds.includes(stockId);
      }
      return false;
    });

    return stockNews;
  } catch (error) {
    console.error("Failed to fetch news by stock:", error);
    return [];
  }
});

// 클래스의 모든 뉴스 조회 (Day별 그룹화)
export const getAllNews = withAuth(async (user) => {
  // 클래스 상태 확인
  await checkClassStatus();

  try{
    // 클래스의 current_day 조회
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, user.classId),
      columns: {
        currentDay: true,
      },
    });

    if (!classInfo || !classInfo.currentDay) {
      return { news: [], currentDay: 1 };
    }

    // 현재 Day까지의 뉴스만 조회
    const allNews = await db.query.news.findMany({
      where: and(
        eq(news.classId, user.classId),
        lte(news.day, classInfo.currentDay)
      ),
      orderBy: [asc(news.day), asc(news.createdAt)],
    });

    // 모든 관련 주식 ID 수집
    const allStockIds = new Set<string>();
    allNews.forEach((newsItem) => {
      if (newsItem.relatedStockIds && Array.isArray(newsItem.relatedStockIds)) {
        newsItem.relatedStockIds.forEach((id) => allStockIds.add(id as string));
      }
    });

    // 주식 정보 조회
    const stocksData =
      allStockIds.size > 0
        ? await db.query.stocks.findMany({
            where: inArray(stocks.id, Array.from(allStockIds)),
          })
        : [];

    // 주식 ID -> 이름 매핑
    const stockMap = new Map(stocksData.map((s) => [s.id, s.name]));

    // 뉴스에 주식 이름 추가
    const newsWithStockNames = allNews.map((newsItem) => ({
      ...newsItem,
      relatedStocks:
        newsItem.relatedStockIds && Array.isArray(newsItem.relatedStockIds)
          ? newsItem.relatedStockIds
              .map((id): RelatedStock | null => {
                const stockName = stockMap.get(id as string);
                return stockName ? { id: id as string, name: stockName } : null;
              })
              .filter((stock): stock is RelatedStock => stock !== null)
          : [],
    }));

    return {
      news: newsWithStockNames,
      currentDay: classInfo.currentDay,
    };
  } catch (error) {
    console.error("Failed to fetch all news:", error);
    return { news: [], currentDay: 1 };
  }
});
