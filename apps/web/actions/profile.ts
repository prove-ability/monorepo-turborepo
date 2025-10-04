"use server";

import { db, guests } from "@repo/db";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";
import { getSession, createSession } from "@/lib/session";

export const updateNickname = withAuth(async (user, nickname: string) => {
  try {
    if (!nickname || nickname.trim().length === 0) {
      return { error: "닉네임을 입력해주세요." };
    }

    if (nickname.length > 20) {
      return { error: "닉네임은 20자 이내로 입력해주세요." };
    }

    await db
      .update(guests)
      .set({ nickname: nickname.trim() })
      .where(eq(guests.id, user.id));

    // 세션 업데이트
    const updatedUser = await db.query.guests.findFirst({
      where: eq(guests.id, user.id),
    });

    if (updatedUser) {
      await createSession({
        id: updatedUser.id,
        name: updatedUser.name,
        loginId: updatedUser.loginId,
        classId: updatedUser.classId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update nickname:", error);
    return { error: "닉네임 변경 중 오류가 발생했습니다." };
  }
});

export const updatePassword = withAuth(
  async (user, currentPassword: string, newPassword: string) => {
    try {
      if (!currentPassword || !newPassword) {
        return { error: "현재 비밀번호와 새 비밀번호를 입력해주세요." };
      }

      // 현재 비밀번호 확인
      const currentUser = await db.query.guests.findFirst({
        where: eq(guests.id, user.id),
      });

      if (!currentUser || currentUser.password !== currentPassword) {
        return { error: "현재 비밀번호가 올바르지 않습니다." };
      }

      if (newPassword.length < 4) {
        return { error: "새 비밀번호는 4자 이상이어야 합니다." };
      }

      if (currentPassword === newPassword) {
        return { error: "새 비밀번호는 현재 비밀번호와 달라야 합니다." };
      }

      await db
        .update(guests)
        .set({ password: newPassword })
        .where(eq(guests.id, user.id));

      return { success: true };
    } catch (error) {
      console.error("Failed to update password:", error);
      return { error: "비밀번호 변경 중 오류가 발생했습니다." };
    }
  }
);

export const checkNeedsSetup = withAuth(async (user) => {
  try {
    const currentUser = await db.query.guests.findFirst({
      where: eq(guests.id, user.id),
    });

    if (!currentUser) {
      return { needsSetup: true, reason: "user_not_found" };
    }

    // 닉네임이 없거나 기본 비밀번호를 사용 중인 경우
    const needsNickname = !currentUser.nickname || currentUser.nickname.trim() === "";
    const needsPasswordChange = currentUser.password === "youthfinlab1234";

    return {
      needsSetup: needsNickname || needsPasswordChange,
      needsNickname,
      needsPasswordChange,
    };
  } catch (error) {
    console.error("Failed to check setup status:", error);
    return { needsSetup: false };
  }
});
