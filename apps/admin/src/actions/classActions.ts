"use server";

import { createAdminClient, createClientByServerSide } from "@/lib";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const classSchema = z.object({
  name: z.string().min(1, "수업명은 필수입니다."),
  start_date: z.string().min(1, "시작일은 필수입니다."),
  end_date: z.string().optional().or(z.literal("")),
  manager_id: z.string().min(1, "매니저 선택은 필수입니다."),
  client_id: z.string().min(1, "클라이언트 선택은 필수입니다."),
  current_day: z.number().min(1, "현재 Day는 1 이상이어야 합니다.").optional(),
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
  const rawData = {
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    manager_id: formData.get("manager_id"),
    client_id: formData.get("client_id"),
  };

  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const supabase = await createClientByServerSide();

  // end_date가 빈 문자열이면 null로 변환
  const classData = {
    ...validation.data,
    end_date: validation.data.end_date === "" ? null : validation.data.end_date,
  };

  const { error, data } = await supabase
    .from("classes")
    .insert(classData)
    .select(
      `
      *,
      clients!classes_client_id_fkey (
        id,
        name
      ),
      managers!classes_manager_id_fkey (
        id,
        name
      )
    `
    )
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/classes");
  return { message: "수업이 생성되었습니다.", data };
}

// READ: 특정 ID로 단일 클래스 조회
export async function getClassById(classId: string) {
  const supabase = await createAdminClient();

  // 먼저 클래스 기본 정보 조회
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      clients(id, name),
      managers(id, name)
    `
    )
    .eq("id", classId)
    .single();

  if (error) {
    console.error("클래스 조회 실패:", error);
    throw new Error(`클래스 조회 실패: ${error.message}`);
  }
  return {
    success: true,
    data,
  };
}

// READ: 모든 클래스 조회 (클라이언트, 매니저 정보 포함)
export async function getClasses() {
  const supabase = await createClientByServerSide();

  // 새로운 JOIN 방식 시도
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      clients(id, name),
      managers(id, name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`클래스 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

// UPDATE: 클래스 정보 수정
export async function updateClass(classId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    manager_id: formData.get("manager_id"),
    client_id: formData.get("client_id"),
  };

  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const supabase = await createClientByServerSide();

  // end_date가 빈 문자열이면 null로 변환
  const classData = {
    ...validation.data,
    end_date: validation.data.end_date === "" ? null : validation.data.end_date,
  };

  const { error, data } = await supabase
    .from("classes")
    .update(classData)
    .eq("id", classId)
    .select(
      `
      *,
      clients!classes_client_id_fkey (
        id,
        name
      ),
      managers!classes_manager_id_fkey (
        id,
        name
      )
    `
    )
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/classes");
  return { message: "수업 정보가 수정되었습니다.", data };
}

// DELETE: 클래스 삭제
export async function deleteClass(classId: string) {
  // 관리자 권한으로 실행 (RLS 우회)
  const supabase = await createAdminClient();
  // 1) 먼저 의존 데이터 삭제: 주식 가격 -> 뉴스 -> 클래스
  const { error: priceError } = await supabase
    .from("class_stock_prices")
    .delete()
    .eq("class_id", classId);

  if (priceError) {
    console.error("클래스 관련 주식 가격 삭제 실패:", priceError);
    return { error: { _form: [priceError.message] } };
  }

  const { error: newsError } = await supabase
    .from("news")
    .delete()
    .eq("class_id", classId);

  if (newsError) {
    console.error("클래스 관련 뉴스 삭제 실패:", newsError);
    return { error: { _form: [newsError.message] } };
  }

  // 2) 마지막으로 클래스 삭제
  const { error: classError } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId);

  if (classError) {
    console.error("클래스 삭제 실패:", classError);
    return { error: { _form: [classError.message] } };
  }

  // 관련 경로 재검증
  revalidatePath("/admin/classes");
  // 필요한 경우 게임 관리 화면도 재검증하세요.
  // revalidatePath("/game-management");
  return { message: "수업 및 관련 뉴스/주식 가격 정보가 삭제되었습니다." };
}

// 클라이언트와 매니저 목록 조회 (폼에서 사용)
export async function getClientsAndManagers() {
  const supabase = await createClientByServerSide();

  const [clientsResult, managersResult] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("managers").select("id, name, client_id").order("name"),
  ]);

  if (clientsResult.error || managersResult.error) {
    throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
  }

  return {
    clients: clientsResult.data,
    managers: managersResult.data,
  };
}

// 클래스의 current_day 업데이트
export async function updateClassCurrentDay(
  classId: string,
  currentDay: number
) {
  const supabase = await createClientByServerSide();

  const { error } = await supabase
    .from("classes")
    .update({ current_day: currentDay })
    .eq("id", classId);

  if (error) {
    throw new Error(`현재 Day 업데이트 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
  return { message: `현재 Day가 ${currentDay}로 업데이트되었습니다.` };
}
