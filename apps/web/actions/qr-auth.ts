"use server";

import { db, classes, guests } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { createSession } from "@/lib/session";

export type QRVerifyResult =
  | { success: true; classId: string; className: string }
  | { success: false; reason: "invalid_token" | "expired_token" | "class_not_active" | "invalid_class" };

/**
 * QR 토큰 검증
 */
export async function verifyQRToken(
  token: string,
  classId: string
): Promise<QRVerifyResult> {
  try {
    // 1. 클래스 조회
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return { success: false, reason: "invalid_class" };
    }

    // 2. 토큰 검증
    if (classData.qrToken !== token) {
      return { success: false, reason: "invalid_token" };
    }

    // 3. 만료 시간 확인
    if (!classData.qrExpiresAt || new Date() > new Date(classData.qrExpiresAt)) {
      return { success: false, reason: "expired_token" };
    }

    // 4. 클래스 상태 확인 (active만 허용)
    if (classData.status !== "active") {
      return { success: false, reason: "class_not_active" };
    }

    // 5. 로그인 방식 확인
    if (classData.loginMethod !== "qr") {
      return { success: false, reason: "invalid_token" };
    }

    return {
      success: true,
      classId: classData.id,
      className: classData.name,
    };
  } catch (error) {
    console.error("QR token verification error:", error);
    return { success: false, reason: "invalid_token" };
  }
}

/**
 * QR 로그인으로 임시 게스트 계정 생성 및 세션 생성
 */
export async function createQRGuestSession(
  classId: string,
  nickname: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 클래스 확인
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return { success: false, error: "클래스를 찾을 수 없습니다." };
    }

    // 2. 닉네임 중복 체크 (같은 클래스 내)
    const existingGuest = await db.query.guests.findFirst({
      where: and(
        eq(guests.classId, classId),
        eq(guests.nickname, nickname)
      ),
    });

    if (existingGuest) {
      return { success: false, error: "이미 사용 중인 닉네임입니다." };
    }

    // 3. 임시 게스트 계정 생성
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const loginId = `qr_${timestamp}_${randomSuffix}`;
    const password = Math.random().toString(36).substring(2, 15);

    const [newGuest] = await db
      .insert(guests)
      .values({
        name: nickname, // 이름을 닉네임으로 사용
        nickname: nickname,
        loginId: loginId,
        password: password,
        classId: classId,
        mobilePhone: "", // QR 로그인은 전화번호 불필요
        affiliation: "QR 로그인",
        grade: "",
      })
      .returning({
        id: guests.id,
        name: guests.name,
        loginId: guests.loginId,
        classId: guests.classId,
      });

    if (!newGuest) {
      return { success: false, error: "계정 생성에 실패했습니다." };
    }

    // 4. 세션 생성
    await createSession({
      id: newGuest.id,
      name: newGuest.name,
      loginId: newGuest.loginId,
      classId: newGuest.classId,
    });

    return { success: true };
  } catch (error) {
    console.error("QR guest session creation error:", error);
    return { success: false, error: "계정 생성 중 오류가 발생했습니다." };
  }
}
