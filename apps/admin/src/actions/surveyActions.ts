"use server";

import { db, surveys } from "@repo/db";
import { eq, desc } from "drizzle-orm";

/**
 * 클래스별 서베이 결과 조회
 */
export async function getSurveysByClass(classId: string) {
  try {
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
}

/**
 * 특정 학생의 서베이 조회
 */
export async function getSurveyByGuest(guestId: string) {
  try {
    const data = await db.query.surveys.findFirst({
      where: eq(surveys.guestId, guestId),
      with: {
        guest: true,
        class: true,
      },
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
      error: `서베이 조회 실패: ${error.message}`,
    };
  }
}
