"use server";

import {
  db,
  classes,
  clients,
  managers,
  classStockPrices,
  news,
} from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuth } from "@/lib/safe-action";

const classSchema = z.object({
  name: z.string().min(1, "수업명은 필수입니다."),
  managerId: z.string().min(1, "매니저 선택은 필수입니다."),
  clientId: z.string().min(1, "클라이언트 선택은 필수입니다."),
  day: z.coerce.number().min(0, "Day는 0 이상이어야 합니다.").optional(),
  currentDay: z.coerce
    .number()
    .min(1, "현재 Day는 1 이상이어야 합니다.")
    .optional(),
});

export type Class = z.infer<typeof classSchema>;

// 데이터베이스에서 조회된 클래스 타입 (id 포함)
export type ClassWithId = Class & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

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
        day: validation.data.day,
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
        manager: {
          with: {
            user: true,
          },
        },
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
          manager: {
            with: {
              user: true,
            },
          },
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
    // 1) 먼저 의존 데이터 삭제: 주식 가격 -> 뉴스 -> 클래스
    await db
      .delete(classStockPrices)
      .where(eq(classStockPrices.classId, classId));
    await db.delete(news).where(eq(news.classId, classId));

    // 2) 마지막으로 클래스 삭제
    await db.delete(classes).where(eq(classes.id, classId));

    revalidatePath("/admin/classes");
    return { message: "수업 및 관련 정보가 삭제되었습니다." };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 삭제 실패:", error);
    return { error: { _form: [error.message] } };
  }
});

// 클라이언트와 매니저 목록 조회 (폼에서 사용)
export async function getClientsAndManagers() {
  try {
    const clientsData = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients);
    const managersData = await db.query.managers.findMany({
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    });

    type ManagerWithUser = (typeof managersData)[number];

    const formattedManagers = managersData.map((m: ManagerWithUser) => ({
      id: m.id,
      name: m.user?.name, // user relation을 통해 이름에 접근
      clientId: m.client_id,
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
}

// READ: 모든 클래스 조회
export async function getClasses() {
  try {
    const rawData = await db.query.classes.findMany({
      with: {
        client: true,
        manager: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (classes, { desc }) => [desc(classes.createdAt)],
    });

    // Transform data to match component expectations
    const data = rawData.map((cls) => ({
      id: cls.id,
      name: cls.name || "",
      start_date: cls.createdAt?.toISOString() || "",
      end_date: cls.updatedAt?.toISOString(),
      manager_id: cls.managerId || "",
      client_id: cls.clientId || "",
      current_day: cls.currentDay || 1,
      created_at: cls.createdAt?.toISOString() || "",
      updated_at: cls.updatedAt?.toISOString() || "",
      clients: cls.client
        ? { id: cls.client.id, name: cls.client.name || "" }
        : null,
      managers: cls.manager?.user
        ? { id: cls.manager.id, name: cls.manager.user.name || "" }
        : null,
    }));

    return data;
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 목록을 불러오는 중 오류가 발생했습니다:", error);
    throw new Error(
      `클래스 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`
    );
  }
}

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
