import { db, guests, classes } from "@repo/db";
import { eq, and } from "drizzle-orm";

export interface User {
  id: string;
  name: string;
  loginId: string;
  classId: string;
}

export async function verifyCredentials(
  loginId: string,
  password: string
): Promise<User | null> {
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
      return null;
    }

    // 클래스가 종료된 경우 로그인 불가
    if (user.class?.status === "ended") {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      classId: user.classId,
    };
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}
