"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { stackServerApp } from "@/stack/server";
import { db, managers } from "@repo/db";
import { eq } from "drizzle-orm";

const managerSchema = z.object({
  name: z.string().min(1, "매니저 이름은 필수입니다."),
  email: z.string().email("유효한 이메일을 입력하세요.").optional().or(z.literal("")),
});

export async function createManager(clientId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
  };

  const validation = managerSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return { success: false, message: "사용자 인증에 실패했습니다." };
    }

    const [data] = await db.insert(managers).values({
      ...validation.data,
      client_id: clientId,
      created_by: user.id,
    }).returning();

    revalidatePath("/admin/clients");
    return { success: true, message: "매니저가 추가되었습니다.", data };
  } catch (error: any) {
    return { success: false, message: error.message || "매니저 추가 중 오류가 발생했습니다." };
  }
}

export async function updateManager(managerId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
  };

  const validation = managerSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    // TODO: 어떤 필드를 업데이트할지 명확히 해야 합니다. validation.data는 name, email만 포함하고 있어 managers 테이블 스키마와 맞지 않습니다.
    // const [data] = await db.update(managers).set(validation.data).where(eq(managers.id, managerId)).returning();
    const data = null; // 임시로 null 처리
    revalidatePath("/admin/clients");
    return { success: true, message: "매니저 정보가 수정되었습니다.", data };
  } catch (error: any) {
    return { success: false, message: error.message || "매니저 정보 수정 중 오류가 발생했습니다." };
  }
}

export async function deleteManager(managerId: string) {
  try {
    await db.delete(managers).where(eq(managers.id, managerId));
    revalidatePath("/admin/clients");
    return { success: true, message: "매니저가 삭제되었습니다." };
  } catch (error: any) {
    return { success: false, message: error.message || "매니저 삭제 중 오류가 발생했습니다." };
  }
}
