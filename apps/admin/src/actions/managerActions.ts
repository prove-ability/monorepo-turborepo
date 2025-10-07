"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, managers } from "@repo/db";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";

const managerSchema = z.object({
  name: z.string().min(1, "매니저 이름은 필수입니다."),
  mobilePhone: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("유효한 이메일을 입력하세요.")
    .optional()
    .or(z.literal("")),
});

export const createManager = withAuth(
  async (user, clientId: string, formData: FormData) => {
    const rawData = {
      name: formData.get("name"),
      mobilePhone: formData.get("mobile_phone"),
      email: formData.get("email"),
    };

    const validation = managerSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, errors: validation.error.flatten().fieldErrors };
    }

    try {
      const [data] = await db
        .insert(managers)
        .values({
          ...validation.data,
          clientId: clientId,
          createdBy: user.id,
        })
        .returning();

      revalidatePath("/admin/clients");
      return { success: true, message: "매니저가 추가되었습니다.", data };
    } catch (error: unknown) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "매니저 추가 중 오류가 발생했습니다.",
      };
    }
  }
);

export const updateManager = withAuth(
  async (user, managerId: string, formData: FormData) => {
    const rawData = {
      name: formData.get("name"),
      mobilePhone: formData.get("mobile_phone"),
      email: formData.get("email"),
    };

    const validation = managerSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, errors: validation.error.flatten().fieldErrors };
    }

    try {
      const [data] = await db
        .update(managers)
        .set(validation.data)
        .where(eq(managers.id, managerId))
        .returning();
      revalidatePath("/admin/clients");
      return { success: true, message: "매니저 정보가 수정되었습니다.", data };
    } catch (error: unknown) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "매니저 정보 수정 중 오류가 발생했습니다.",
      };
    }
  }
);

export const deleteManager = withAuth(async (user, managerId: string) => {
  try {
    await db.delete(managers).where(eq(managers.id, managerId));
    revalidatePath("/admin/clients");
    return { success: true, message: "매니저가 삭제되었습니다." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "매니저 삭제 중 오류가 발생했습니다.",
    };
  }
});
