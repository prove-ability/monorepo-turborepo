"use server";

import { db, classes, clients, managers, classStockPrices, news } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const classSchema = z.object({
  name: z.string().min(1, "수업명은 필수입니다."),
  startDate: z.string().min(1, "시작일은 필수입니다."),
  endDate: z.string().optional().or(z.literal("")),
  managerId: z.string().min(1, "매니저 선택은 필수입니다."),
  clientId: z.string().min(1, "클라이언트 선택은 필수입니다."),
  currentDay: z.number().min(1, "현재 Day는 1 이상이어야 합니다.").optional(),
  startingBalance: z
    .number()
    .min(0, "시작 금액은 0 이상이어야 합니다.")
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
export async function createClass(formData: FormData) {
  // Zod 스키마에 맞게 필드명 변경 (snake_case -> camelCase)
  const rawData = {
    name: formData.get("name"),
    startDate: formData.get("start_date"),
    endDate: formData.get("end_date"),
    managerId: formData.get("manager_id"),
    clientId: formData.get("client_id"),
    startingBalance: Number(formData.get("starting_balance") || 0),
  };

  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  try {
    // Supabase Auth 의존성 제거. created_by는 향후 인증 시스템 구현 후 추가 필요
    const [newClass] = await db
      .insert(classes)
      .values({
        ...validation.data,
        endDate: validation.data.endDate === "" ? null : validation.data.endDate,
      })
      .returning({ id: classes.id });

    // 관계형 데이터를 포함하여 방금 생성된 클래스 정보를 다시 조회
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
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 생성 실패:", error);
    return { error: { _form: [error.message] } };
  }
}

// READ: 특정 ID로 단일 클래스 조회
export async function getClassById(classId: string) {
  try {
    const data = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        client: {
          columns: {
            id: true,
            name: true,
          },
        },
        manager: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      throw new Error("클래스를 찾을 수 없습니다.");
    }

    return {
      success: true,
      data,
    };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 조회 실패:", error);
    throw new Error(`클래스 조회 실패: ${error.message}`);
  }
}

// READ: 모든 클래스 조회 (클라이언트, 매니저 정보 포함)
export async function getClasses() {
  try {
    const data = await db.query.classes.findMany({
      with: {
        client: {
          columns: {
            id: true,
            name: true,
          },
        },
        manager: {
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: (classes, { desc }) => [desc(classes.createdAt)],
    });
    return data || [];
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 목록 조회 실패:", error);
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
  }
}

// UPDATE: 클래스 정보 수정
export async function updateClass(classId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    startDate: formData.get("start_date"),
    endDate: formData.get("end_date"),
    managerId: formData.get("manager_id"),
    clientId: formData.get("client_id"),
    startingBalance: Number(formData.get("starting_balance") || 0),
  };

  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  try {
    const classData = {
      ...validation.data,
      endDate: validation.data.endDate === "" ? null : validation.data.endDate,
    };

    await db.update(classes).set(classData).where(eq(classes.id, classId));

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
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    return { error: { _form: [error.message] } };
  }
}

// DELETE: 클래스 삭제
export async function deleteClass(classId: string) {
  try {
    // 1) 먼저 의존 데이터 삭제: 주식 가격 -> 뉴스 -> 클래스
    await db.delete(classStockPrices).where(eq(classStockPrices.classId, classId));
    await db.delete(news).where(eq(news.classId, classId));
    
    // 2) 마지막으로 클래스 삭제
    await db.delete(classes).where(eq(classes.id, classId));

    revalidatePath("/admin/classes");
    return { message: "수업 및 관련 정보가 삭제되었습니다." };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 삭제 실패:", error);
    return { error: { _form: [error.message] } };
  }
}

// 클라이언트와 매니저 목록 조회 (폼에서 사용)
export async function getClientsAndManagers() {
  try {
    const clientsData = await db.select({ id: clients.id, name: clients.name }).from(clients);
    const managersData = await db.query.managers.findMany({
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    });

    type ManagerWithUser = typeof managersData[number];

    const formattedManagers = managersData.map((m: ManagerWithUser) => ({
      id: m.id,
      name: m.user?.name, // user relation을 통해 이름에 접근
      client_id: m.clientId,
    }));

    return {
      clients: clientsData,
      managers: formattedManagers,
    };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
    throw new Error(`데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 클래스의 current_day 업데이트
export async function updateClassCurrentDay(
  classId: string,
  currentDay: number
) {
  try {
    await db.update(classes).set({ currentDay }).where(eq(classes.id, classId));
    revalidatePath("/game-management");
    return { message: `현재 Day가 ${currentDay}로 업데이트되었습니다.` };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    throw new Error(`현재 Day 업데이트 실패: ${error.message}`);
  }
}
