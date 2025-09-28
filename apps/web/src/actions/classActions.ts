"use server";

import { db, classes } from "@repo/db";
import { eq } from "drizzle-orm";

export async function getClassInfo(classId: string) {
  try {
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      columns: {
        currentDay: true,
      },
    });

    return classInfo || null;
  } catch (error) {
    console.error("클래스 정보 조회 실패:", error);
    return null;
  }
}
