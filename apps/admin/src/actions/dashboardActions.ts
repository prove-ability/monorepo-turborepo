"use server";

import { db, clients, classes, guests, surveys, transactions } from "@repo/db";
import { desc, count, sql, eq } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";

/**
 * 대시보드 전체 통계 조회 (관리자별)
 */
export const getDashboardStats = withAuth(async (user) => {
  try {
    const adminId = user.id;

    // 1. 기본 카운트 통계 (관리자별 필터링)
    const [clientCount] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.createdBy, adminId));

    const [classCount] = await db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.createdBy, adminId));

    // guests는 class를 통해 필터링
    const adminClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.createdBy, adminId));
    const classIds = adminClasses.map((c) => c.id);

    const [guestCount] = classIds.length > 0
      ? await db
          .select({ count: count() })
          .from(guests)
          .where(sql`${guests.classId} = ANY(${classIds})`)
      : [{ count: 0 }];
    const [surveyCount] = classIds.length > 0
      ? await db
          .select({ count: count() })
          .from(surveys)
          .where(sql`${surveys.classId} = ANY(${classIds})`)
      : [{ count: 0 }];

    const [transactionCount] = classIds.length > 0
      ? await db
          .select({ count: count() })
          .from(transactions)
          .where(sql`${transactions.classId} = ANY(${classIds})`)
      : [{ count: 0 }];

    // 2. 활성 게임 수 (currentDay >= 1인 클래스, 관리자별)
    const activeGames = await db
      .select({ count: count() })
      .from(classes)
      .where(sql`${classes.createdBy} = ${adminId} AND ${classes.currentDay} >= 1`);

    // 3. 평균 서베이 평점 (관리자 클래스에 속한 서베이만)
    const avgRating = classIds.length > 0
      ? await db
          .select({
            avg: sql<number>`COALESCE(AVG(${surveys.rating}), 0)`,
          })
          .from(surveys)
          .where(sql`${surveys.classId} = ANY(${classIds})`)
      : [{ avg: 0 }];

    // 4. 최근 7일간 신규 클래스 수 (관리자별)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentClasses = await db
      .select({ count: count() })
      .from(classes)
      .where(
        sql`${classes.createdBy} = ${adminId} AND ${classes.createdAt} >= ${sevenDaysAgo}`
      );

    return {
      success: true,
      data: {
        totalClients: clientCount?.count || 0,
        totalClasses: classCount?.count || 0,
        totalGuests: guestCount?.count || 0,
        totalSurveys: surveyCount?.count || 0,
        totalTransactions: transactionCount?.count || 0,
        activeGames: activeGames[0]?.count || 0,
        averageRating: Math.round(Number(avgRating[0]?.avg || 0) * 10) / 10,
        recentClassesCount: recentClasses[0]?.count || 0,
      },
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `대시보드 통계 조회 실패: ${error.message}`,
    };
  }
});

/**
 * 최근 생성된 클래스 조회 (관리자별)
 */
export const getRecentClasses = withAuth(async (user, limit: number = 5) => {
  try {
    const data = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      with: {
        client: {
          columns: {
            name: true,
          },
        },
        manager: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [desc(classes.createdAt)],
      limit,
    });

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `최근 클래스 조회 실패: ${error.message}`,
    };
  }
});

/**
 * 최근 등록된 학생 조회 (관리자별)
 */
export const getRecentGuests = withAuth(async (user, limit: number = 10) => {
  try {
    // 관리자의 클래스 ID들을 먼저 조회
    const adminClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.createdBy, user.id));
    const classIds = adminClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const data = await db.query.guests.findMany({
      where: sql`${guests.classId} = ANY(${classIds})`,
      with: {
        class: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [desc(guests.createdAt)],
      limit,
    });

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `최근 학생 조회 실패: ${error.message}`,
    };
  }
});

/**
 * 클래스별 진행 상황 조회 (관리자별)
 */
export const getClassProgress = withAuth(async (user) => {
  try {
    const data = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      with: {
        client: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [desc(classes.currentDay)],
      limit: 10,
    });

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `클래스 진행 상황 조회 실패: ${error.message}`,
    };
  }
});

/**
 * 최근 서베이 응답 조회 (관리자별)
 */
export const getRecentSurveys = withAuth(async (user, limit: number = 5) => {
  try {
    // 관리자의 클래스 ID들을 먼저 조회
    const adminClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.createdBy, user.id));
    const classIds = adminClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const data = await db.query.surveys.findMany({
      where: sql`${surveys.classId} = ANY(${classIds})`,
      with: {
        guest: {
          columns: {
            name: true,
            nickname: true,
          },
        },
        class: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [desc(surveys.createdAt)],
      limit,
    });

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `최근 서베이 조회 실패: ${error.message}`,
    };
  }
});
