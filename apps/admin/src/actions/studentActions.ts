"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClientByServerSide } from "@/lib/supabase";
import type { CreateStudentData, UpdateStudentData } from "@/types/student";

// 자동 로그인 ID 생성 함수
async function generateLoginId(): Promise<string> {
  const supabase = await createClientByServerSide();

  // 현재 학생 수를 조회하여 다음 번호 결정
  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const nextNumber = (count || 0) + 1;
  return `user${nextNumber.toString().padStart(3, "0")}`; // user001, user002, ...
}

// 자동 비밀번호 생성 함수 (영문 + 숫자 4자리)
function generatePassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let password = "";
  // 영문 2자리
  for (let i = 0; i < 2; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 숫자 2자리
  for (let i = 0; i < 2; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // 섞기
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// 학생 데이터 검증 스키마 (ID와 비밀번호는 자동 생성되므로 제외)
const studentSchema = z.object({
  nickname: z.null(),
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().min(1, "전화번호는 필수입니다"),
  grade: z.number().min(1).max(12, "학년은 1-12 사이여야 합니다"),
  school_name: z.string().min(1, "학교명은 필수입니다"),
  client_id: z.string().uuid("올바른 클라이언트 ID가 아닙니다"),
  class_id: z.string().uuid("올바른 클래스 ID가 아닙니다"),
});

// CREATE: 새 학생 생성
export async function createStudent(
  data: Omit<CreateStudentData, "login_id" | "password">
) {
  const validation = studentSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // 자동으로 로그인 ID와 비밀번호 생성
    const login_id = await generateLoginId();
    const password = generatePassword();

    const supabase = await createClientByServerSide();

    const studentData = {
      ...validation.data,
      login_id,
      password,
    };

    const { error, data: createdStudent } = await supabase
      .from("students")
      .insert(studentData)
      .select(
        `
        *,
        clients!students_client_id_fkey (
          id,
          name
        ),
        classes!students_class_id_fkey (
          id,
          name
        )
      `
      )
      .single();

    if (error) {
      return { error: { _form: [error.message] } };
    }

    revalidatePath("/admin/students");
    return {
      message: `학생이 성공적으로 등록되었습니다.\n로그인 ID: ${login_id}\n비밀번호: ${password}`,
      data: createdStudent,
      credentials: { login_id, password }, // 생성된 계정 정보 반환
    };
  } catch (error) {
    return { error: { _form: ["학생 등록 중 오류가 발생했습니다."] } };
  }
}

// READ: 모든 학생 조회 (클라이언트, 클래스 정보 포함)
export async function getStudents() {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      clients!students_client_id_fkey (
        id,
        name
      ),
      classes!students_class_id_fkey (
        id,
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// READ: 특정 클래스의 학생들 조회
export async function getStudentsByClass(classId: string) {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      clients!students_client_id_fkey (
        id,
        name
      ),
      classes!students_class_id_fkey (
        id,
        name
      )
    `
    )
    .eq("class_id", classId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// UPDATE: 학생 정보 수정
export async function updateStudent(
  studentId: string,
  data: UpdateStudentData
) {
  const validation = studentSchema.partial().safeParse(data);

  if (!validation.success) {
    return {
      error: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClientByServerSide();

  const { error, data: studentData } = await supabase
    .from("students")
    .update(validation.data)
    .eq("id", studentId)
    .select(
      `
      *,
      clients!students_client_id_fkey (
        id,
        name
      ),
      classes!students_class_id_fkey (
        id,
        name
      )
    `
    )
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/students");
  return { message: "학생 정보가 수정되었습니다.", data: studentData };
}

// DELETE: 학생 삭제
export async function deleteStudent(studentId: string) {
  const supabase = await createClientByServerSide();

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/students");
  return { message: "학생이 삭제되었습니다." };
}

// 클라이언트별 클래스 목록 조회 (학생 등록 시 사용)
export async function getClassesByClient(clientId: string) {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("classes")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
