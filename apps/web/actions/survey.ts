"use server";

import { db, surveys } from "@repo/db";
import { withAuth } from "@/lib/with-auth";

interface SubmitSurveyInput {
  rating: number;
  feedback: string;
}

export const submitSurvey = withAuth(async (user, input: SubmitSurveyInput) => {
  try {
    const { rating, feedback } = input;

    // 별점 유효성 검사 (1-10점)
    if (!rating || rating < 1 || rating > 10) {
      return {
        success: false,
        error: "별점을 1-10점 사이로 선택해주세요.",
      };
    }

    // 설문 저장
    await db.insert(surveys).values({
      guestId: user.id,
      classId: user.classId,
      rating,
      feedback: feedback.trim() || null,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Survey submission error:", error);
    return {
      success: false,
      error: "설문 제출 중 오류가 발생했습니다.",
    };
  }
});
