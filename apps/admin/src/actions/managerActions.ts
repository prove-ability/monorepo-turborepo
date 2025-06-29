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
  const { error } = await supabase.from("managers").insert({
    ...validation.data,
    client_id: clientId, // 어떤 고객사 소속인지 명시
  });

  if (error) {
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/admin/clients");
  return { data: "매니저가 추가되었습니다." };
}

// ... updateManager, deleteManager 등도 위와 유사한 패턴으로 생성 ...
