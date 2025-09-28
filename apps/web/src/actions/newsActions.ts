"use server";

import { db, news, stocks } from "@repo/db";
import { eq, and, inArray, desc } from "drizzle-orm";

export async function getNewsByDay(classId: string, day: number) {
  try {
    const newsData = await db.query.news.findMany({
      where: and(eq(news.classId, classId), eq(news.day, day)),
      orderBy: [desc(news.createdAt)],
    });

    if (!newsData.length) {
      return [];
    }

    type NewsItem = typeof newsData[number];

    const allRelatedStockIds = newsData.flatMap(
      (item: NewsItem) => item.relatedStockIds || []
    );
    const uniqueStockIds = [...new Set(allRelatedStockIds)];

    if (uniqueStockIds.length === 0) {
      return newsData.map((item: NewsItem) => ({ ...item, tags: [] }));
    }

    const relatedStocks = await db.query.stocks.findMany({
      where: inArray(stocks.id, uniqueStockIds),
      columns: { id: true, name: true },
    });

    type RelatedStock = typeof relatedStocks[number];
    const stockMap = new Map(relatedStocks.map((s: RelatedStock) => [s.id, s.name]));

    const newsWithTags = newsData.map((item: NewsItem) => {
      const tags = (
        item.relatedStockIds || []
      ).map((id: string) => stockMap.get(id) || "").filter(Boolean) as string[];
      return { ...item, tags };
    });

    return newsWithTags;
  } catch (error) {
    console.error("뉴스 조회 실패:", error);
    return [];
  }
}
