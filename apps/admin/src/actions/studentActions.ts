"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClientByServerSide } from "@/lib/supabase";
import type { CreateStudentData, UpdateStudentData } from "@/types/student";

// 학생 데이터 검증 스키마
const studentSchema = z.object({
  password: z.string().min(1, "비밀번호는 필수입니다"),
  nickname: z.string().min(1, "닉네임은 필수입니다"),
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().min(1, "전화번호는 필수입니다"),
  grade: z.number().min(1).max(12, "학년은 1-12 사이여야 합니다"),
  school_name: z.string().min(1, "학교명은 필수입니다"),
  client_id: z.string().uuid("올바른 클라이언트 ID가 아닙니다"),
  class_id: z.string().uuid("올바른 클래스 ID가 아닙니다"),
});

// CREATE: 새 학생 생성
export async function createStudent(data: CreateStudentData) {
  const validation = studentSchema.safeParse(data);

  if (!validation.success) {
    return {
      error: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClientByServerSide();

  const { error, data: studentData } = await supabase
    .from("students")
    .insert(validation.data)
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
  return { message: "학생이 성공적으로 등록되었습니다.", data: studentData };
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
