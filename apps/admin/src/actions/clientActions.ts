/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"; // 이 파일의 모든 함수는 서버에서만 실행되는 서버 액션임을 명시합니다.

import { createClientByServerSide } from "@/lib";
import { revalidatePath } from "next/cache"; // 데이터 변경 후 캐시를 무효화하여 UI를 갱신
import { z } from "zod"; // 데이터 유효성 검사를 위한 라이브러리

// 고객사 데이터의 유효성 검사를 위한 Zod 스키마 정의
// 테이블 설계에 맞춰 필드를 정의합니다.
const clientSchema = z.object({
  name: z.string().min(1, { message: "고객사 이름은 필수 항목입니다." }),
  phone: z.string().optional(),
  fax: z.string().optional(),
  // 이메일 형식이 아니거나, 비어있지 않으면 에러 발생
  email: z
    .string()
    .email({ message: "올바른 이메일 형식을 입력해주세요." })
    .optional()
    .or(z.literal("")),
  // URL 형식이 아니거나, 비어있지 않으면 에러 발생
  website: z
    .string()
    .url({ message: "올바른 웹사이트 URL을 입력해주세요." })
    .optional()
    .or(z.literal("")),
});

/**
 * CREATE: 새로운 고객사를 생성하는 서버 액션
 * @param _prevState - useFormState 훅에서 사용하는 이전 상태 값 (현재는 사용하지 않음)
 * @param formData - 클라이언트의 form으로부터 전달된 데이터
 * @returns 성공 또는 에러 메시지를 포함한 객체
 */
export async function createClientAction(_prevState: any, formData: FormData) {
  console.log("_prevState", _prevState);
  console.log("formData", formData);

  // FormData를 일반 객체로 변환
  const rawData = Object.fromEntries(formData.entries());

  // Zod 스키마로 데이터 유효성 검사
  const validatedFields = clientSchema.safeParse(rawData);

  // 유효성 검사 실패 시, 에러 메시지를 반환
  if (!validatedFields.success) {
    console.error(
      "Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "입력 값에 오류가 있습니다.",
    };
  }

  try {
    const supabase = await createClientByServerSide();
    // 유효성 검사를 통과한 데이터를 Supabase에 삽입
    const { error } = await supabase
      .from("clients")
      .insert(validatedFields.data);

    if (error) throw error;

    // 데이터가 성공적으로 추가되면, 관련 경로의 캐시를 무효화하여 화면을 갱신
    revalidatePath("/admin/clients");

    return { message: "고객사가 성공적으로 추가되었습니다.", errors: null };
  } catch (error: any) {
    return {
      message: error.message || "데이터베이스 작업 중 오류가 발생했습니다.",
      errors: null,
    };
  }
}

/**
 * UPDATE: 기존 고객사 정보를 수정하는 서버 액션
 * @param id - 수정할 고객사의 UUID
 * @param prevState - useFormState 훅의 이전 상태
 * @param formData - 수정할 데이터가 담긴 FormData
 */
export async function updateClientAction(
  id: string,
  prevState: any,
  formData: FormData
) {
  if (!id) return { message: "고객사 ID가 필요합니다." };

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = clientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "입력 값에 오류가 있습니다.",
    };
  }

  try {
    const supabase = await createClientByServerSide();
    const { error } = await supabase
      .from("clients")
      .update(validatedFields.data)
      .eq("id", id); // 특정 id를 가진 행만 수정

    if (error) throw error;

    revalidatePath("/admin/clients");
    return {
      message: "고객사 정보가 성공적으로 수정되었습니다.",
      errors: null,
    };
  } catch (error: any) {
    return {
      message: error.message || "데이터베이스 작업 중 오류가 발생했습니다.",
      errors: null,
    };
  }
}

/**
 * DELETE: 고객사를 삭제하는 서버 액션
 * @param id - 삭제할 고객사의 UUID
 */
export async function deleteClientAction(id: string) {
  if (!id) return { message: "고객사 ID가 필요합니다." };

  try {
    const supabase = await createClientByServerSide();
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/clients");
    return { message: "고객사가 성공적으로 삭제되었습니다." };
  } catch (error: any) {
    return {
      message: error.message || "데이터베이스 작업 중 오류가 발생했습니다.",
    };
  }
}
