"use server";

import { revalidatePath } from "next/cache";
import { stackServerApp } from "@/stack/server";
import { db, news } from "@repo/db";
import { eq, and, desc, count } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type News = InferSelectModel<typeof news>;
export type CreateNewsData = Omit<InferInsertModel<typeof news>, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type UpdateNewsData = CreateNewsData & { id: string };

// 뉴스 목록 조회 (특정 day 또는 전체)
export async function getNews(day?: number): Promise<News[]> {
  try {
    const data = await db.query.news.findMany({
      where: day !== undefined ? eq(news.day, day) : undefined,
      orderBy: [desc(news.day)],
    });
    return data;
  } catch (error) {
    throw new Error(`뉴스 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 뉴스 생성
export async function createNews(newsData: CreateNewsData): Promise<News> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
  }

  try {
    const [data] = await db.insert(news).values({ ...newsData, createdBy: user.id }).returning();
    if (!data) {
      throw new Error("뉴스 생성 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/game-management");
    return data;
  } catch (error) {
    throw new Error(`뉴스 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 뉴스 수정
export async function updateNews(newsData: UpdateNewsData): Promise<News> {
  try {
    const { id, ...updateData } = newsData;
    const [data] = await db
      .update(news)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    if (!data) {
      throw new Error("뉴스 수정 후 데이터 반환에 실패했습니다.");
    }
    revalidatePath("/game-management");
    return data;
  } catch (error) {
    throw new Error(`뉴스 수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 뉴스 삭제
export async function deleteNews(newsId: string): Promise<void> {
  try {
    await db.delete(news).where(eq(news.id, newsId));
    revalidatePath("/game-management");
  } catch (error) {
    throw new Error(`뉴스 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 특정 day의 뉴스 개수 조회
export async function getNewsCountByDay(day: number): Promise<number> {
  try {
    const result = await db.select({ value: count() }).from(news).where(eq(news.day, day));
    return result[0]?.value || 0;
  } catch (error) {
    throw new Error(`뉴스 개수 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 클래스별, Day별 뉴스 조회
export async function getNewsByClassAndDay(classId: string, day: number): Promise<News[]> {
  try {
    const data = await db.query.news.findMany({
      where: and(eq(news.classId, classId), eq(news.day, day)),
      orderBy: [desc(news.createdAt)],
    });
    return data;
  } catch (error) {
    throw new Error(`클래스별 뉴스 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
