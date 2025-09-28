"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, users, classes, wallets } from "@repo/db";
import { eq, or, like, and, desc, asc } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

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

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  classId: z.string().uuid(),
});

export async function createUserWithClerk(formData: FormData) {
  try {
    const validatedData = createUserSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      classId: formData.get("classId"),
    });

    // 1. Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [validatedData.email],
      password: validatedData.password,
      firstName: validatedData.name,
    });

    // 2. Create user in our database
    await db.insert(users).values({
      clerkId: clerkUser.id,
      name: validatedData.name,
      classId: validatedData.classId,
    });

    revalidatePath("/classes");
    return { success: true, message: "학생 계정이 성공적으로 생성되었습니다." };

  } catch (e) {
    const error = e instanceof Error ? e : new Error("An unknown error occurred");
    if (error instanceof z.ZodError) {
      return { success: false, error: error.flatten().fieldErrors };
    }
    return { success: false, error: { _form: [`사용자 생성 중 오류 발생: ${error.message}`] } };
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
      conditions.push(or(like(users.name, searchPattern), like(users.phone, searchPattern), like(users.schoolName, searchPattern), like(users.clerkId, searchPattern))!);
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
