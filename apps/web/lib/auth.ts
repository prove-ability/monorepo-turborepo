import { db, guests, classes } from "@repo/db";
import { eq, and } from "drizzle-orm";

export interface User {
  id: string;
  name: string;
  loginId: string;
  classId: string;
}

export type VerifyResult =
  | { success: true; user: User }
  | { success: false; reason: "invalid_credentials" | "class_not_active" | "invalid_class_code" };

export async function verifyCredentials(
  loginId: string,
  password: string,
  classCode: string
): Promise<VerifyResult> {
  try {
    // 1. 클래스 코드로 클래스 찾기
    const classData = await db.query.classes.findFirst({
      where: eq(classes.code, classCode.toUpperCase()),
    });

    if (!classData) {
      return { success: false, reason: "invalid_class_code" };
    }

    // 2. 클래스가 진행 중(active)이 아닌 경우 로그인 불가
    if (classData.status !== "active") {
      console.log("Login blocked: Class is not active", classData.status);
      return { success: false, reason: "class_not_active" };
    }

    // 3. 해당 클래스 내에서 loginId와 password로 사용자 찾기
    const user = await db.query.guests.findFirst({
      where: and(
        eq(guests.classId, classData.id),
        eq(guests.loginId, loginId),
        eq(guests.password, password)
      ),
      with: {
        class: true,
      },
    });

    if (!user) {
      return { success: false, reason: "invalid_credentials" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        loginId: user.loginId,
        classId: user.classId,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, reason: "invalid_credentials" };
  }
}
