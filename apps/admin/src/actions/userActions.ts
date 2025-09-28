"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, users, classes, wallets } from "@repo/db";
import { eq, or, like, and, desc, asc } from "drizzle-orm";

// 타입 정의
interface CreateUserData {
  name: string;
  phone: string;
  grade: number;
  schoolName: string;
  clientId: string;
  classId: string;
}

interface UpdateUserData extends Partial<CreateUserData> {}

// 사용자 데이터 검증 스키마
const userSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().min(1, "전화번호는 필수입니다"),
  grade: z.number().min(1, "학년은 필수입니다.").max(12, "학년은 12를 넘을 수 없습니다."),
  schoolName: z.string().min(1, "학교명은 필수입니다"),
  clientId: z.string().min(1, "클라이언트 ID는 필수입니다"),
  classId: z.string().min(1, "클래스 ID는 필수입니다"),
});

// 자동 로그인 ID 생성
async function generateLoginId(): Promise<string> {
  const existingUsers = await db.select({ loginId: users.loginId }).from(users);
  const existingIds = new Set(existingUsers.map((u: { loginId: string | null }) => u.loginId).filter(Boolean) as string[]);

  let counter = 1;
  if (existingIds.size > 0) {
    counter = Math.max(...Array.from(existingIds).map((id) => {
        const match = id.match(/user(\d+)/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
      }), 0) + 1;
  }

  let newLoginId: string;
  do {
    newLoginId = `user${counter.toString().padStart(3, "0")}`;
    counter++;
  } while (existingIds.has(newLoginId));

  return newLoginId;
}

// 자동 비밀번호 생성
function generatePassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let password = "";
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return password;
}

// BULK CREATE: 여러 사용자 일괄 생성
export async function bulkCreateUsers(usersData: CreateUserData[]) {
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (const u of usersData) {
    try {
      const validatedData = userSchema.parse(u);
      const loginId = await generateLoginId();
      const password = generatePassword();

      const [newUser] = await db.insert(users).values({
        loginId,
        password, // TODO: 해싱 필요
        name: validatedData.name,
        phone: validatedData.phone,
        grade: String(validatedData.grade),
        schoolName: validatedData.schoolName,
        classId: validatedData.classId,
      }).returning({ id: users.id });

      const classData = await db.query.classes.findFirst({
        where: eq(classes.id, validatedData.classId),
        columns: { startingBalance: true },
      });

      if (!classData) {
        await db.delete(users).where(eq(users.id, newUser.id)); // 롤백
        throw new Error(`클래스 정보 조회 실패: ${validatedData.classId}`);
      }

      await db.insert(wallets).values({
        userId: newUser.id,
        balance: String(classData.startingBalance),
      });

      successCount++;
    } catch (e: any) {
      failureCount++;
      const error = e instanceof Error ? e : new Error("An unknown error occurred");
      errors.push(`${u.name}: ${error.message}`);
    }
  }

  revalidatePath("/classes");
  return { successCount, failureCount, errors };
}

// CREATE: 새 사용자 생성
export async function createUser(data: CreateUserData) {
  try {
    const validatedData = userSchema.parse(data);
    const loginId = await generateLoginId();
    const password = generatePassword();

    const [newUser] = await db.insert(users).values({
      loginId,
      password, // TODO: 해싱 필요
      name: validatedData.name,
      phone: validatedData.phone,
      grade: String(validatedData.grade),
      schoolName: validatedData.schoolName,
      classId: validatedData.classId,
    }).returning({ id: users.id });

    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, validatedData.classId),
      columns: { startingBalance: true },
    });

    if (!classData) {
      await db.delete(users).where(eq(users.id, newUser.id)); // 롤백
      return { error: { _form: ["클래스 정보 조회에 실패했습니다."] } };
    }

    await db.insert(wallets).values({
      userId: newUser.id,
      balance: String(classData.startingBalance),
    });

    revalidatePath("/classes");
    return {
      success: true,
      message: `사용자가 성공적으로 등록되었습니다!\n로그인 ID: ${loginId}\n비밀번호: ${password}`,
      data: { loginId, password },
    };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    if (error instanceof z.ZodError) {
      return { error: error.flatten().fieldErrors };
    }
    return { error: { _form: [`사용자 등록 중 오류가 발생했습니다: ${error.message}`] } };
  }
}

// READ: 모든 사용자 조회
export async function getUsers() {
  try {
    const data = await db.query.users.findMany({
      with: {
        class: { with: { client: true } },
      },
      orderBy: [desc(users.createdAt)],
    });
    return { success: true, data };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    return { success: false, error: `사용자 목록을 불러오는데 실패했습니다: ${error.message}` };
  }
}

// READ: 특정 클래스의 사용자들 조회 (검색 기능 포함)
export async function getUsersByClass(classId: string, searchTerm?: string) {
  try {
    const conditions = [eq(users.classId, classId)];
    if (searchTerm?.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      conditions.push(or(like(users.name, searchPattern), like(users.phone, searchPattern), like(users.schoolName, searchPattern), like(users.loginId, searchPattern))!);
    }

    const data = await db.query.users.findMany({
      where: and(...conditions.filter(Boolean)),
      orderBy: [asc(users.name)],
    });
    return { success: true, data: data || [] };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    throw new Error(`사용자 조회 실패: ${error.message}`);
  }
}

// UPDATE: 사용자 정보 수정
export async function updateUser(userId: string, data: UpdateUserData) {
  try {
    const updateData = {
      name: data.name,
      phone: data.phone,
      grade: data.grade ? String(data.grade) : undefined,
      schoolName: data.schoolName,
      classId: data.classId,
    };

    await db.update(users).set(updateData).where(eq(users.id, userId));
    revalidatePath("/classes");
    return { success: true, message: "사용자 정보가 성공적으로 수정되었습니다." };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    return { success: false, error: `사용자 정보 수정에 실패했습니다: ${error.message}` };
  }
}

// DELETE: 사용자 삭제
export async function deleteUser(userId: string) {
  try {
    await db.delete(wallets).where(eq(wallets.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/classes");
    return { success: true, message: "사용자가 성공적으로 삭제되었습니다." };
  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    return { success: false, error: `사용자 삭제에 실패했습니다: ${error.message}` };
  }
}

// LOGOUT: 사용자 로그아웃
export async function logoutUser() {
  // TODO: 인증 시스템 구현 후, 로그아웃 로직 추가 필요
  console.log("logoutUser function called. Auth system needed.");
  revalidatePath("/");
}
