"use server";

import { db, classStockPrices, news } from "@repo/db";
import { eq, and, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

export interface StockPricePoint {
  day: number;
  price: number;
  change: number;
  changePercent: number;
}

export interface RelatedNews {
  id: string;
  day: number;
  title: string;
  content: string;
}

export interface StockHistoryData {
  stockId: string;
  stockName: string;
  currentPrice: number;
  priceHistory: StockPricePoint[];
  relatedNews: RelatedNews[];
}

export async function getStockHistory(stockId: string): Promise<StockHistoryData | null> {
  try {
    console.log("📊 getStockHistory called for stockId:", stockId);
    
    const session = await getSession();
    if (!session) {
      console.log("❌ No session found");
      return null;
    }

    const userClass = await db.query.guests.findFirst({
      where: (guests, { eq }) => eq(guests.id, session.id),
      with: { class: true }
    });

    if (!userClass?.class) {
      console.log("❌ No class found for user");
      return null;
    }

    const classId = userClass.classId;
    const currentDay = userClass.class.currentDay ?? 1;
    
    console.log("📌 Query params:", { classId, stockId, currentDay });

    const priceData = await db.query.classStockPrices.findMany({
      where: and(
        eq(classStockPrices.classId, classId),
        eq(classStockPrices.stockId, stockId),
        lte(classStockPrices.day, currentDay)
      ),
      orderBy: (prices, { asc }) => [asc(prices.day)]
    });

    console.log("📈 Price data found:", priceData.length, "records");

    if (priceData.length === 0) {
      console.log("❌ No price data found for this stock");
      return null;
    }

    // Stock 정보 별도 조회
    const stockInfo = await db.query.stocks.findFirst({
      where: (stocks, { eq }) => eq(stocks.id, stockId)
    });

    if (!stockInfo) {
      console.log("❌ Stock info not found");
      return null;
    }

    console.log("📊 Stock info:", stockInfo.name);

    const priceHistory: StockPricePoint[] = priceData.map((item, index) => {
      const price = parseFloat(item.price ?? "0");
      const prevPrice = index > 0 ? parseFloat(priceData[index - 1]?.price ?? "0") : price;
      const change = price - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

      return {
        day: item.day ?? 0,
        price,
        change,
        changePercent
      };
    });

    const relatedNewsData = await db.query.news.findMany({
      where: and(
        eq(news.classId, classId),
        lte(news.day, currentDay)
      ),
      orderBy: (newsTable, { asc }) => [asc(newsTable.day)]
    });

    const relatedNews: RelatedNews[] = relatedNewsData
      .filter(item => {
        const relatedIds = item.relatedStockIds as string[] | null;
        return relatedIds?.includes(stockId);
      })
      .map(item => ({
        id: item.id,
        day: item.day ?? 0,
        title: item.title ?? "",
        content: item.content ?? ""
      }));

    const lastPrice = priceData[priceData.length - 1];
    
    if (!lastPrice) return null;

    const result = {
      stockId,
      stockName: stockInfo.name,
      currentPrice: parseFloat(lastPrice.price ?? "0"),
      priceHistory,
      relatedNews
    };
    
    console.log("✅ Stock history loaded successfully:", {
      stockName: result.stockName,
      pricePoints: result.priceHistory.length,
      newsCount: result.relatedNews.length
    });
    
    return result;
  } catch (error) {
    console.error("❌ Failed to get stock history:", error);
    return null;
  }
}
