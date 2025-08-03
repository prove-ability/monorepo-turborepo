"use server";

import { createClientByServerSide } from "@/lib";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const classSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "수업명은 필수입니다."),
  start_date: z.string().min(1, "시작일은 필수입니다."),
  end_date: z.string().optional().or(z.literal("")),
  manager_id: z.string().min(1, "매니저 선택은 필수입니다."),
  client_id: z.string().min(1, "클라이언트 선택은 필수입니다."),
});

export type Class = z.infer<typeof classSchema>;

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

// READ: 모든 클래스 조회 (클라이언트, 매니저 정보 포함)
export async function getClasses() {
  const supabase = await createClientByServerSide();

  // 직접 SQL 쿼리를 사용하여 JOIN으로 데이터 조회
  const { data, error } = await supabase.rpc("get_classes_with_relations");

  if (error) {
    console.error("Database error:", error);
    // fallback: 기본 쿼리 시도
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("classes")
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
      .order("created_at", { ascending: false });

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    return fallbackData;
  }

  return data;
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
  const supabase = await createClientByServerSide();

  const { error } = await supabase.from("classes").delete().eq("id", classId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/classes");
  return { message: "수업이 삭제되었습니다." };
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
