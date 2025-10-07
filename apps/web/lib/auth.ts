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
  | { success: false; reason: "invalid_credentials" | "class_ended" };

export async function verifyCredentials(
  loginId: string,
  password: string
): Promise<VerifyResult> {
  try {
    const user = await db.query.guests.findFirst({
      where: and(
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

    // 클래스가 종료된 경우 로그인 불가
    if (user.class?.status === "ended") {
      console.log("Login blocked: Class has ended");
      return { success: false, reason: "class_ended" };
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
