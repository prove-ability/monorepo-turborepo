"use server";

import { createClientByServerSide } from "@/lib";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const managerSchema = z.object({
  name: z.string().min(1, "매니저 이름은 필수입니다."),
  mobile_phone: z.string().optional(),
  email: z
    .string()
    .email("유효한 이메일을 입력하세요.")
    .optional()
    .or(z.literal("")),
});

// CREATE: 특정 고객사에 새로운 매니저 추가
export async function createManager(clientId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    mobile_phone: formData.get("mobile_phone"),
    email: formData.get("email"),
  };

  const validation = managerSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const supabase = await createClientByServerSide();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { _form: ["사용자 인증에 실패했습니다. 다시 로그인해주세요."] } };
  }

  const { error, data } = await supabase
    .from("managers")
    .insert({
      ...validation.data,
      client_id: clientId, // 어떤 고객사 소속인지 명시
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/clients");
  return { message: "매니저가 추가되었습니다.", data };
}

// UPDATE: 매니저 정보 수정
export async function updateManager(managerId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    mobile_phone: formData.get("mobile_phone"),
    email: formData.get("email"),
  };

  const validation = managerSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  const supabase = await createClientByServerSide();
  const { error, data } = await supabase
    .from("managers")
    .update(validation.data)
    .eq("id", managerId)
    .select("*")
    .single();

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/clients");
  return { message: "매니저 정보가 수정되었습니다.", data };
}

// DELETE: 매니저 삭제
export async function deleteManager(managerId: string) {
  const supabase = await createClientByServerSide();
  const { error } = await supabase
    .from("managers")
    .delete()
    .eq("id", managerId);

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/clients");
  return { message: "매니저가 삭제되었습니다." };
}
