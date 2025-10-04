"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@repo/db";
import { clients } from "@repo/db/schema";
import { desc, eq } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";

const clientSchema = z.object({
  name: z.string().min(1, { message: "고객사 이름은 필수 항목입니다." }),
  mobilePhone: z.string().optional(),
  email: z
    .string()
    .email({ message: "올바른 이메일 형식을 입력해주세요." })
    .optional()
    .or(z.literal("")),
});

export const createClientAction = withAuth(
  async (user, prevState: any, formData: FormData) => {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = clientSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: `입력 값에 오류가 있습니다.`,
        success: false,
      };
    }

    try {
      const dataToInsert = {
        name: validatedFields.data.name,
        mobilePhone: validatedFields.data.mobilePhone,
        email: validatedFields.data.email,
        createdBy: user.id,
      };
      const [newClient] = await db.insert(clients).values(dataToInsert).returning();
      revalidatePath("/admin/clients");
      return { 
        message: "고객사가 성공적으로 생성되었습니다.", 
        success: true,
        data: newClient 
      };
    } catch (error: any) {
      let errorMessage = "데이터베이스 오류";
      if (error.code === "23505") errorMessage = "이미 존재하는 고객사입니다.";
      return { message: errorMessage, success: false };
    }
  }
);

export const updateClientAction = withAuth(
  async (_user, id: string, prevState: any, formData: FormData) => {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = clientSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: `입력 값에 오류가 있습니다.`,
        success: false,
      };
    }

    try {
      await db
        .update(clients)
        .set(validatedFields.data)
        .where(eq(clients.id, id));
      revalidatePath("/admin/clients");
      return { message: "고객사가 성공적으로 수정되었습니다.", success: true };
    } catch (error) {
      return { message: "데이터베이스 오류", success: false };
    }
  }
);

export const deleteClientAction = withAuth(async (_user, id: string) => {
  try {
    await db.delete(clients).where(eq(clients.id, id));
    revalidatePath("/admin/clients");
    return { message: "고객사가 성공적으로 삭제되었습니다.", success: true };
  } catch (error) {
    console.error("데이터베이스 오류:", error);
    return { message: "데이터베이스 오류", success: false };
  }
});

export const getClients = withAuth(async (user) => {
  try {
    const clientData = await db.query.clients.findMany({
      where: eq(clients.createdBy, user.id),
      columns: {
        id: true,
        name: true,
        mobilePhone: true,
        email: true,
        createdAt: true,
        createdBy: true,
      },
      with: {
        managers: true,
      },
      orderBy: [desc(clients.createdAt)],
    });

    return { data: clientData, success: true };
  } catch (error) {
    console.error("클라이언트 조회 오류:", error);
    return {
      data: [],
      success: false,
      message: "클라이언트 목록을 불러오는 중 오류가 발생했습니다.",
    };
  }
});
