"use server";

import {
  db,
  dbWithTransaction,
  classes,
  clients,
  managers,
  classStockPrices,
  news,
  guests,
} from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuth } from "@/lib/safe-action";
import { Class, Manager, Client } from "@/types";

export interface ClassWithRelations extends Class {
  client: Client | null;
  manager: Manager | null;
}

const classSchema = z.object({
  name: z.string().min(1, "수업명은 필수입니다."),
  managerId: z.string().min(1, "매니저 선택은 필수입니다."),
  clientId: z.string().min(1, "클라이언트 선택은 필수입니다."),
  totalDays: z.coerce
    .number()
    .min(0, "총 수업일은 0 이상이어야 합니다.")
    .optional(),
  currentDay: z.coerce
    .number()
    .min(1, "현재 Day는 1 이상이어야 합니다.")
    .optional(),
});

// CREATE: 새로운 클래스 생성
export const createClass = withAuth(async (user, formData: FormData) => {
  const rawData = Object.fromEntries(formData.entries());
  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  try {
    const [newClass] = await db
      .insert(classes)
      .values({
        name: validation.data.name,
        managerId: validation.data.managerId,
        clientId: validation.data.clientId,
        totalDays: validation.data.totalDays,
        currentDay: validation.data.currentDay,
        createdBy: user.id,
      })
      .returning({ id: classes.id });

    if (!newClass) {
      throw new Error("클래스 생성 후 ID를 반환받지 못했습니다.");
    }

    const data = await db.query.classes.findFirst({
      where: eq(classes.id, newClass.id),
      with: {
        client: true,
        manager: true,
      },
    });

    revalidatePath("/admin/classes");
    return { message: "수업이 생성되었습니다.", data };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return { error: { _form: [error.message] } };
  }
});

// UPDATE: 클래스 정보 수정
export const updateClass = withAuth(
  async (user, classId: string, formData: FormData) => {
    const rawData = Object.fromEntries(formData.entries());
    const validation = classSchema.safeParse(rawData);

    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors };
    }

    try {
      await db
        .update(classes)
        .set(validation.data)
        .where(eq(classes.id, classId));

      const data = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
        with: {
          client: true,
          manager: true,
        },
      });

      revalidatePath("/admin/classes");
      return { message: "수업 정보가 수정되었습니다.", data };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return { error: { _form: [error.message] } };
    }
  }
);

// DELETE: 클래스 삭제
export const deleteClass = withAuth(async (user, classId: string) => {
  try {
    // 트랜잭션을 사용하여 모든 삭제 작업을 원자적으로 처리
    await dbWithTransaction.transaction(async (tx) => {
      // 1) 먼저 의존 데이터 삭제: 주식 가격 -> 뉴스 -> guests -> 클래스
      await tx
        .delete(classStockPrices)
        .where(eq(classStockPrices.classId, classId));
      await tx.delete(news).where(eq(news.classId, classId));
      await tx.delete(guests).where(eq(guests.classId, classId));

      // 2) 마지막으로 클래스 삭제
      await tx.delete(classes).where(eq(classes.id, classId));
    });

    revalidatePath("/admin/classes");
    return { message: "수업 및 관련 정보가 삭제되었습니다.", success: true };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 삭제 실패:", error);
    return { error: { _form: [error.message] }, success: false };
  }
});

// 클라이언트와 매니저 목록 조회 (폼에서 사용)
export const getClientsAndManagers = withAuth(async (user) => {
  try {
    const clientsData = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.createdBy, user.id));

    const managersData = await db.query.managers.findMany({
      where: eq(managers.createdBy, user.id),
    });

    const formattedManagers = managersData.map((m) => ({
      id: m.id,
      name: m.name, // managers 테이블에 직접 name 필드가 있음
      clientId: m.clientId,
    }));

    return {
      clients: clientsData,
      managers: formattedManagers,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
    throw new Error(
      `데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`
    );
  }
});

// READ: 모든 클래스 조회
export const getClasses = withAuth(async (user) => {
  try {
    const classesData = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      with: {
        client: true,
        manager: true,
      },
      orderBy: (classes, { desc }) => [desc(classes.createdAt)],
    });

    return {
      data: classesData,
      error: null,
      success: true,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 목록을 불러오는 중 오류가 발생했습니다:", error);
    return {
      data: null,
      error,
      success: false,
    };
  }
});

// READ: 특정 클래스 조회 (ID로)
export const getClassById = withAuth(async (user, classId: string) => {
  try {
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        client: true,
        manager: true,
      },
    });

    // 클래스가 없거나 현재 사용자가 생성한 클래스가 아닌 경우
    if (!classData || classData.createdBy !== user.id) {
      return {
        data: null,
        error: null,
        success: false,
      };
    }

    return {
      data: classData,
      error: null,
      success: true,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 정보를 불러오는 중 오류가 발생했습니다:", error);
    return {
      data: null,
      error,
      success: false,
    };
  }
});

// 클래스의 current_day 업데이스트
export const updateClassCurrentDay = withAuth(
  async (user, classId: string, currentDay: number) => {
    try {
      await db
        .update(classes)
        .set({ currentDay })
        .where(eq(classes.id, classId));
      revalidatePath("/game-management");
      return { message: `현재 Day가 ${currentDay}로 업데이스트되었습니다.` };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      throw new Error(`현재 Day 업데이스트 실패: ${error.message}`);
    }
  }
);
