import "server-only";
import { db, guests } from "@repo/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession, deleteSession } from "./session";

/**
 * 현재 사용자의 클래스 상태를 확인하고, 종료된 경우 로그아웃 처리
 */
export async function checkClassStatus() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  try {
    const guestWithClass = await db.query.guests.findFirst({
      where: eq(guests.id, session.id),
      with: {
        class: true,
      },
    });

    // 게스트 정보가 없거나 클래스가 종료된 경우
    if (!guestWithClass || guestWithClass.class?.status === "ended") {
      await deleteSession();
      redirect("/login");
    }

    return {
      guest: guestWithClass,
      classStatus: guestWithClass.class?.status || "setting",
    };
  } catch (error) {
    console.error("Class status check error:", error);
    await deleteSession();
    redirect("/login");
  }
}
