"use server";

import { db, surveys, classes } from "@repo/db";
import { eq, desc, and } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";

/**
 * 클래스별 서베이 결과 조회 (관리자 권한 검증)
 */
export const getSurveysByClass = withAuth(async (user, classId: string) => {
  try {
    // 1. 클래스 소유권 검증
    const classData = await db.query.classes.findFirst({
      where: and(
        eq(classes.id, classId),
        eq(classes.createdBy, user.id)
      ),
    });

    if (!classData) {
      return {
        success: false,
        error: "해당 클래스에 대한 접근 권한이 없습니다.",
      };
    }

    // 2. 서베이 데이터 조회
    const data = await db.query.surveys.findMany({
      where: eq(surveys.classId, classId),
      with: {
        guest: {
          columns: {
            id: true,
            name: true,
            nickname: true,
          },
        },
      },
      orderBy: [desc(surveys.createdAt)],
    });

    // 통계 계산
    const totalSurveys = data.length;
    const averageRating =
      totalSurveys > 0
        ? data.reduce((sum, survey) => sum + survey.rating, 0) / totalSurveys
        : 0;

    // 평점 분포
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: data.filter((s) => s.rating === rating).length,
    }));

    return {
      success: true,
      data: {
        surveys: data,
        statistics: {
          total: totalSurveys,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
        },
      },
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `서베이 조회 실패: ${error.message}`,
    };
  }
});

/**
 * 특정 학생의 서베이 조회 (관리자 권한 검증)
 */
export const getSurveyByGuest = withAuth(async (user, guestId: string) => {
  try {
    const data = await db.query.surveys.findFirst({
      where: eq(surveys.guestId, guestId),
      with: {
        guest: true,
        class: true,
      },
    });

    // 클래스 소유권 검증
    if (data?.class && data.class.createdBy !== user.id) {
      return {
        success: false,
        error: "해당 서베이에 대한 접근 권한이 없습니다.",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `서베이 조회 실패: ${error.message}`,
    };
  }
});
