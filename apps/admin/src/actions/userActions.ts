"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, guests, wallets } from "@repo/db";
import { eq, or, like, and, desc, asc } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";
import { INITIAL_WALLET_BALANCE } from "@/config/gameConfig";

// loginId 생성 헬퍼 함수 (중복 시 숫자 증가)
async function generateUniqueLoginId(
  name: string,
  classId: string
): Promise<string> {
  // 같은 클래스 내에서 같은 이름으로 시작하는 모든 loginId 조회
  const existingUsers = await db.query.guests.findMany({
    where: and(eq(guests.classId, classId), like(guests.loginId, `${name}%`)),
    columns: {
      loginId: true,
    },
  });

  // 중복이 없으면 그대로 반환
  if (existingUsers.length === 0) {
    return name;
  }

  // 기존 loginId들 확인
  const existingLoginIds = new Set(existingUsers.map((u) => u.loginId));

  // 중복이 없으면 그대로 사용
  if (!existingLoginIds.has(name)) {
    return name;
  }

  // 기존 사용자 수 + 1을 다음 번호로 사용
  // 예: "김철수", "김철수2"가 있으면 length=2, 다음은 "김철수3"
  return `${name}${existingUsers.length + 1}`;
}

// 타입 정의
interface CreateUserData {
  name: string;
  mobilePhone: string;
  grade: string;
  affiliation: string;
  classId: string;
  nickname?: string;
}

interface UpdateUserData extends Partial<CreateUserData> {}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  classId: z.string().uuid(),
});

export const createUser = withAuth(async (user, formData: FormData) => {
  try {
    const validatedData = createUserSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      classId: formData.get("classId"),
    });

    const loginId = await generateUniqueLoginId(
      validatedData.name,
      validatedData.classId
    );

    const [newGuest] = await db
      .insert(guests)
      .values({
        name: validatedData.name,
        classId: validatedData.classId,
        mobilePhone: validatedData.email, // 임시로 email 사용
        affiliation: "미정", // 기본값
        grade: "미정", // 기본값
        loginId: loginId,
        password: "youthfinlab1234",
      })
      .returning();

    if (!newGuest) {
      throw new Error("게스트 생성에 실패했습니다.");
    }

    // wallet 자동 생성
    await db.insert(wallets).values({
      guestId: newGuest.id,
      balance: INITIAL_WALLET_BALANCE,
    });

    revalidatePath("/protected/classes");
    return {
      success: true,
      message: "학생 계정이 성공적으로 생성되었습니다.",
      error: undefined,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.flatten().fieldErrors,
        message: undefined,
      };
    }
    return {
      success: false,
      error: { _form: [`사용자 생성 중 오류 발생: ${error.message}`] },
      message: undefined,
    };
  }
});

// READ: 모든 사용자 조회
export async function getUsers() {
  try {
    const data = await db.query.guests.findMany({
      with: {
        class: { with: { client: true } },
      },
      orderBy: [desc(guests.createdAt)],
    });
    return { success: true, data };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `사용자 목록을 불러오는데 실패했습니다: ${error.message}`,
    };
  }
}

// READ: 특정 클래스의 사용자들 조회 (검색 기능 포함)
export async function getUsersByClass(classId: string, searchTerm?: string) {
  try {
    const conditions = [eq(guests.classId, classId)];
    if (searchTerm?.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      conditions.push(
        or(
          like(guests.name, searchPattern),
          like(guests.mobilePhone, searchPattern),
          like(guests.affiliation, searchPattern)
        )!
      );
    }

    const data = await db.query.guests.findMany({
      where: and(...conditions.filter(Boolean)),
      orderBy: [asc(guests.name)],
    });
    return { success: true, data: data || [] };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    throw new Error(`사용자 조회 실패: ${error.message}`);
  }
}

// UPDATE: 사용자 정보 수정
export const updateUser = withAuth(
  async (user, userId: string, data: UpdateUserData) => {
    try {
      const updateData = {
        name: data.name,
        mobilePhone: data.mobilePhone,
        grade: data.grade,
        affiliation: data.affiliation,
        classId: data.classId,
        nickname: data.nickname,
      };

      await db.update(guests).set(updateData).where(eq(guests.id, userId));
      revalidatePath("/classes");
      return {
        success: true,
        message: "사용자 정보가 성공적으로 수정되었습니다.",
      };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return {
        success: false,
        error: `사용자 정보 수정에 실패했습니다: ${error.message}`,
      };
    }
  }
);

// DELETE: 사용자 삭제
export const deleteUser = withAuth(async (user, userId: string) => {
  try {
    await db.delete(wallets).where(eq(wallets.guestId, userId));
    await db.delete(guests).where(eq(guests.id, userId));
    revalidatePath("/classes");
    return { success: true, message: "사용자가 성공적으로 삭제되었습니다." };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `사용자 삭제에 실패했습니다: ${error.message}`,
    };
  }
});

// BULK CREATE: 여러 사용자 한번에 생성
export const bulkCreateUsers = withAuth(
  async (
    user,
    usersData: Array<{
      name: string;
      mobilePhone: string;
      grade: string;
      affiliation: string;
      classId: string;
      nickname?: string;
    }>
  ) => {
    let successCount = 0;
    let failureCount = 0;

    try {
      // 각 사용자를 개별적으로 삽입 (일부 실패해도 나머지 진행)
      for (const userData of usersData) {
        try {
          const loginId = await generateUniqueLoginId(
            userData.name,
            userData.classId
          );

          const [newGuest] = await db
            .insert(guests)
            .values({
              name: userData.name,
              mobilePhone: userData.mobilePhone,
              grade: userData.grade,
              affiliation: userData.affiliation,
              classId: userData.classId,
              nickname: userData.nickname,
              loginId: loginId,
              password: "youthfinlab1234",
            })
            .returning();

          if (!newGuest) {
            throw new Error("게스트 생성에 실패했습니다.");
          }

          // wallet 자동 생성
          await db.insert(wallets).values({
            guestId: newGuest.id,
            balance: INITIAL_WALLET_BALANCE,
          });

          successCount++;
        } catch (err) {
          console.error("Failed to create user:", userData, err);
          failureCount++;
        }
      }

      revalidatePath("/protected/classes");
      return { successCount, failureCount };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return {
        error: {
          _form: [`일괄 등록 중 오류 발생: ${error.message}`],
        },
      };
    }
  }
);
