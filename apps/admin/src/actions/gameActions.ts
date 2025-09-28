"use server";

import { revalidatePath } from "next/cache";
import { db, classStockPrices, news as newsSchema } from "@repo/db";
import { eq, and, desc, count, sql, lte } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type ClassStockPrice = InferSelectModel<typeof classStockPrices>;
export type CreateStockPriceData = InferInsertModel<typeof classStockPrices>;
export type UpdateStockPriceData = CreateStockPriceData & { id: string };

export interface GameData {
  classId: string;
  day: number;
  stocks: {
    stockId: string;
    price: number;
  }[];
  news: {
    title: string;
    content: string;
    relatedStockIds?: string[];
  }[];
}

// 클래스별 주식 가격 조회
export async function getClassStockPrices(
  classId?: string,
  day?: number
): Promise<ClassStockPrice[]> {
  try {
    const conditions = [];
    if (classId) {
      conditions.push(eq(classStockPrices.classId, classId));
    }
    if (day !== undefined) {
      conditions.push(eq(classStockPrices.day, day));
    }

    const data = await db.query.classStockPrices.findMany({
      where: and(...conditions),
      orderBy: [desc(classStockPrices.day)],
    });

    return data;
  } catch (error) {
    throw new Error(`주식 가격 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 가격 생성
export async function createStockPrice(
  priceData: CreateStockPriceData
): Promise<ClassStockPrice> {
  try {
    const [data] = await db.insert(classStockPrices).values(priceData).returning();
    if (!data) {
      throw new Error("주식 가격 생성 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/game-management");
    return data;
  } catch (error) {
    throw new Error(`주식 가격 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 가격 수정
export async function updateStockPrice(
  priceData: UpdateStockPriceData
): Promise<ClassStockPrice> {
  try {
    const { id, ...updateData } = priceData;
    const [data] = await db
      .update(classStockPrices)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(classStockPrices.id, id))
      .returning();
    if (!data) {
      throw new Error("주식 가격 수정 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/game-management");
    return data;
  } catch (error) {
    throw new Error(`주식 가격 수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 가격 삭제
export async function deleteStockPrice(priceId: string): Promise<void> {
  try {
    await db.delete(classStockPrices).where(eq(classStockPrices.id, priceId));
    revalidatePath("/game-management");
  } catch (error) {
    throw new Error(`주식 가격 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 클래스별 게임 데이터 일괄 생성
export async function createGameDay(
  gameData: GameData,
  userId: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // 1. 뉴스 생성
      const newsToInsert = gameData.news.map(news => ({
        day: gameData.day,
        title: news.title,
        content: news.content,
        relatedStockIds: news.relatedStockIds || [],
        classId: gameData.classId,
        createdBy: userId,
      }));

      let createdNews: InferSelectModel<typeof newsSchema>[] = [];
      if (newsToInsert.length > 0) {
        createdNews = await tx.insert(newsSchema).values(newsToInsert).returning();
      }

      // 2. 주식 가격 생성
      const pricesToInsert = gameData.stocks.map(stock => ({
        classId: gameData.classId,
        stockId: stock.stockId,
        day: gameData.day,
        price: String(stock.price),
        newsId: createdNews[0]?.id,
      }));

      if (pricesToInsert.length > 0) {
        await tx.insert(classStockPrices).values(pricesToInsert).onConflictDoUpdate({
          target: [classStockPrices.classId, classStockPrices.stockId, classStockPrices.day],
          set: { price: sql`excluded.price` }
        });
      }
    });

    revalidatePath("/game-management");
  } catch (error) {
    throw new Error(
      `게임 데이터 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

// 특정 클래스의 게임 진행 상황 조회
export async function getGameProgress(classId: string): Promise<{
  maxDay: number;
  totalNews: number;
  totalPrices: number;
}> {
  try {
    const maxDayResult = await db.select({ value: sql`max(${classStockPrices.day})`.mapWith(Number) })
      .from(classStockPrices)
      .where(eq(classStockPrices.classId, classId));
    
    const maxDay = maxDayResult[0]?.value || 0;

    const newsCountResult = await db.select({ value: count() })
      .from(newsSchema)
      .where(and(eq(newsSchema.classId, classId), lte(newsSchema.day, maxDay)));

    const priceCountResult = await db.select({ value: count() })
      .from(classStockPrices)
      .where(eq(classStockPrices.classId, classId));

    return {
      maxDay,
      totalNews: newsCountResult[0]?.value || 0,
      totalPrices: priceCountResult[0]?.value || 0,
    };
  } catch (error) {
    throw new Error(`게임 진행 상황 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
