"use server";

import { db, dbWithTransaction, classes, guests, wallets, transactions } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { createSession } from "@/lib/session";

// 초기 지갑 잔액 (200만원)
const INITIAL_WALLET_BALANCE = "2000000";

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

    // 3. 트랜잭션으로 계정, 지갑, 초기 지원금 생성
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const loginId = `qr_${timestamp}_${randomSuffix}`;
    const password = Math.random().toString(36).substring(2, 15);

    const result = await dbWithTransaction.transaction(async (tx) => {
      // 3-1. 게스트 계정 생성
      const [newGuest] = await tx
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
        throw new Error("계정 생성에 실패했습니다.");
      }

      // 3-2. 지갑 생성 (초기 잔액 200만원)
      const [newWallet] = await tx
        .insert(wallets)
        .values({
          guestId: newGuest.id,
          balance: INITIAL_WALLET_BALANCE,
        })
        .returning();

      if (!newWallet) {
        throw new Error("지갑 생성에 실패했습니다.");
      }

      // 3-3. 초기 지원금 거래 내역 기록
      await tx.insert(transactions).values({
        walletId: newWallet.id,
        type: "deposit",
        subType: "benefit",
        quantity: 0,
        price: INITIAL_WALLET_BALANCE,
        day: 1,
        classId: classId,
      });

      return newGuest;
    });

    // 4. 세션 생성
    await createSession({
      id: result.id,
      name: result.name,
      loginId: result.loginId,
      classId: result.classId,
    });

    return { success: true };
  } catch (error) {
    console.error("QR guest session creation error:", error);
    return { success: false, error: "계정 생성 중 오류가 발생했습니다." };
  }
}
