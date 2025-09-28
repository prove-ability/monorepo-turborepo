/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { db, clients } from "@repo/db";
import { eq } from "drizzle-orm";

const clientSchema = z.object({
  name: z.string().min(1, { message: "고객사 이름은 필수 항목입니다." }),
  mobilePhone: z.string().optional(),
  email: z.string().email({ message: "올바른 이메일 형식을 입력해주세요." }).optional().or(z.literal("")),
});

export async function createClientAction(_prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = clientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ");

    return {
      errors: fieldErrors,
      message: `입력 값에 오류가 있습니다: ${errorMessages}`,
      success: false,
    };
  }

  try {
    const user = await currentUser();
    if (!user) {
      return {
        message: "사용자 인증에 실패했습니다. 다시 로그인해주세요.",
        errors: null,
        success: false,
      };
    }

    const dataToInsert = {
      ...validatedFields.data,
      createdBy: user.id,
    };

    await db.insert(clients).values(dataToInsert);

    revalidatePath("/admin/clients");

    return {
      message: "고객사가 성공적으로 추가되었습니다.",
      errors: null,
      success: true,
    };
  } catch (error: any) {
    console.error("Database Error:", error);
    let errorMessage = "데이터베이스 작업 중 오류가 발생했습니다.";
    if (error.code === '23505') {
      errorMessage = "이미 존재하는 고객사입니다.";
    }
    return {
      message: errorMessage,
      errors: null,
      success: false,
    };
  }
}

export async function updateClientAction(
  id: string,
  prevState: any,
  formData: FormData
) {
  if (!id) return { message: "고객사 ID가 필요합니다.", success: false };

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = clientSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
      .join("; ");

    return {
      errors: fieldErrors,
      message: `입력 값에 오류가 있습니다: ${errorMessages}`,
      success: false,
    };
  }

  try {
    await db.update(clients).set(validatedFields.data).where(eq(clients.id, id));

    revalidatePath("/admin/clients");
    return {
      message: "고객사 정보가 성공적으로 수정되었습니다.",
      errors: null,
      success: true,
    };
  } catch (error: any) {
    console.error("Database Error:", error);
    return {
      message: error.message || "데이터베이스 작업 중 오류가 발생했습니다.",
      errors: null,
      success: false,
    };
  }
}

export async function deleteClientAction(id: string) {
  if (!id) return { message: "고객사 ID가 필요합니다.", success: false };

  try {
    await db.delete(clients).where(eq(clients.id, id));

    revalidatePath("/admin/clients");
    return {
      message: "고객사가 성공적으로 삭제되었습니다.",
      success: true,
    };
  } catch (error: any) {
    console.error("Database Error:", error);
    return {
      message: error.message || "데이터베이스 작업 중 오류가 발생했습니다.",
      success: false,
    };
  }
}
