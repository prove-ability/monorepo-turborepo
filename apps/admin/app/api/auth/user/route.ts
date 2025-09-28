import { stackServerApp } from "@/stack/server";
import { type NextRequest, NextResponse } from "next/server";
import { db, admins } from "@repo/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Authentication error: User not logged in." },
        { status: 401 }
      );
    }

    // Drizzle을 사용하여 'admins' 테이블에서 사용자 역할 조회
    const adminResult = await db
      .select({
        id: admins.id,
        email: admins.email,
        role: admins.role,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .where(eq(admins.id, userId))
      .limit(1);

    const admin = adminResult[0];

    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden: User is not an admin." },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: admin }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
