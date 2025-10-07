"use server";

import { revalidatePath } from "next/cache";
import { db, news } from "@repo/db";
import { eq, and, desc, count } from "drizzle-orm";
import { InferInsertModel } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";
import { News } from "@/types";

export type CreateNewsData = Omit<
  InferInsertModel<typeof news>,
  "id" | "createdAt" | "updatedAt" | "createdBy"
>;
export type UpdateNewsData = CreateNewsData & { id: string };

// 뉴스 목록 조회 (특정 day 또는 전체)
export async function getNews(day?: number): Promise<News[]> {
  // 현재 사용자 인증 확인
  const { stackServerApp } = await import("@/stack/server");
  const user = await stackServerApp.getUser();

  if (!user) {
    throw new Error("사용자 인증에 실패했습니다.");
  }

  try {
    // 먼저 사용자의 클래스만 조회
    const { classes } = await import("@repo/db");
    const { sql } = await import("drizzle-orm");
    const userClasses = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      columns: { id: true },
    });

    const userClassIds = userClasses.map((c) => c.id);

    if (userClassIds.length === 0) {
      return []; // 사용자의 클래스가 없으면 빈 배열 반환
    }

    const conditions = [sql`${news.classId} IN ${userClassIds}`];
    if (day !== undefined) {
      conditions.push(eq(news.day, day));
    }

    const data = await db.query.news.findMany({
      where: and(...conditions),
      orderBy: [desc(news.day)],
    });
    return data;
  } catch (error) {
    throw new Error(
      `뉴스 목록 조회 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

// 뉴스 생성
export const createNews = withAuth(
  async (user, newsData: CreateNewsData): Promise<News> => {
    try {
      const [data] = await db
        .insert(news)
        .values({ ...newsData, createdBy: user.id })
        .returning();
      if (!data) {
        throw new Error("뉴스 생성 후 데이터 반환에 실패했습니다.");
      }
      revalidatePath("/game-management");
      return data;
    } catch (error) {
      throw new Error(
        `뉴스 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    }
  }
);

// 뉴스 삭제
export const deleteNews = withAuth(
  async (user, newsId: string): Promise<void> => {
    try {
      await db.delete(news).where(eq(news.id, newsId));
      revalidatePath("/game-management");
    } catch (error) {
      throw new Error(
        `뉴스 삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    }
  }
);

// 특정 day의 뉴스 개수 조회
export async function getNewsCountByDay(day: number): Promise<number> {
  // 현재 사용자 인증 확인
  const { stackServerApp } = await import("@/stack/server");
  const user = await stackServerApp.getUser();

  if (!user) {
    throw new Error("사용자 인증에 실패했습니다.");
  }

  try {
    // 먼저 사용자의 클래스만 조회
    const { classes } = await import("@repo/db");
    const { sql } = await import("drizzle-orm");
    const userClasses = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      columns: { id: true },
    });

    const userClassIds = userClasses.map((c) => c.id);

    if (userClassIds.length === 0) {
      return 0; // 사용자의 클래스가 없으면 0 반환
    }

    const result = await db
      .select({ value: count() })
      .from(news)
      .where(and(eq(news.day, day), sql`${news.classId} IN ${userClassIds}`));
    return result[0]?.value || 0;
  } catch (error) {
    throw new Error(
      `뉴스 개수 조회 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

// 클래스별, Day별 뉴스 조회
export async function getNewsByClassAndDay(
  classId: string,
  day: number
): Promise<News[]> {
  // 현재 사용자 인증 확인
  const { stackServerApp } = await import("@/stack/server");
  const user = await stackServerApp.getUser();

  if (!user) {
    throw new Error("사용자 인증에 실패했습니다.");
  }

  try {
    // 먼저 해당 클래스가 사용자의 것인지 확인
    const { classes } = await import("@repo/db");
    const classData = await db.query.classes.findFirst({
      where: and(eq(classes.id, classId), eq(classes.createdBy, user.id)),
      columns: { id: true },
    });

    if (!classData) {
      throw new Error("권한이 없거나 존재하지 않는 클래스입니다.");
    }

    const data = await db.query.news.findMany({
      where: and(eq(news.classId, classId), eq(news.day, day)),
      orderBy: [desc(news.createdAt)],
    });
    return data;
  } catch (error) {
    throw new Error(
      `클래스별 뉴스 조회 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}
