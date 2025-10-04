import { db, guests } from "@repo/db";
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
    });

    if (!user) {
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
