"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { db, stocks } from "@repo/db";
import { eq, asc } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Stock = InferSelectModel<typeof stocks>;
export type CreateStockData = Omit<InferInsertModel<typeof stocks>, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type UpdateStockData = CreateStockData & { id: string };

// 주식 목록 조회
export async function getStocks(): Promise<Stock[]> {
  try {
    return await db.query.stocks.findMany({
      orderBy: [asc(stocks.name)],
    });
  } catch (error) {
    throw new Error(`주식 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 생성
export async function createStock(stockData: CreateStockData): Promise<Stock> {
  const user = await currentUser();
  if (!user) {
    throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
  }

  try {
    const [data] = await db.insert(stocks).values({ ...stockData, createdBy: user.id }).returning();
    if (!data) {
      throw new Error("주식 생성 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/stocks");
    return data;
  } catch (error) {
    throw new Error(`주식 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 수정
export async function updateStock(stockData: UpdateStockData): Promise<Stock> {
  try {
    const { id, ...updateData } = stockData;
    const [data] = await db
      .update(stocks)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(stocks.id, id))
      .returning();
    if (!data) {
      throw new Error("주식 수정 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/stocks");
    return data;
  } catch (error) {
    throw new Error(`주식 수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 주식 삭제
export async function deleteStock(stockId: string): Promise<void> {
  try {
    await db.delete(stocks).where(eq(stocks.id, stockId));
    revalidatePath("/stocks");
  } catch (error) {
    throw new Error(`주식 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
