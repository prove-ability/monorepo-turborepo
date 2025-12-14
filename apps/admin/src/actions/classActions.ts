"use server";

import {
  db,
  dbWithTransaction,
  classes,
  clients,
  managers,
  classStockPrices,
  news,
  guests,
  wallets,
  transactions,
  holdings,
} from "@repo/db";
import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuth } from "@/lib/safe-action";
import { randomUUID } from "crypto";
import { Class, Manager, Client } from "@/types";

export interface ClassWithRelations extends Class {
  client: Client | null;
  manager: Manager | null;
}

const classSchema = z.object({
  name: z.string().min(1, "수업명은 필수입니다."),
  totalDays: z.coerce
    .number({
      invalid_type_error: "총 게임 일수는 숫자여야 합니다.",
    })
    .min(1, "총 게임 일수는 1 이상이어야 합니다.")
    .default(8),
  managerId: z.string().min(1, "매니저 선택은 필수입니다."),
  clientId: z.string().min(1, "클라이언트 선택은 필수입니다."),
  loginMethod: z.enum(["account", "qr"]).default("account"),
  currentDay: z.coerce
    .number()
    .min(1, "현재 Day는 1 이상이어야 합니다.")
    .optional(),
});

/**
 * 고유한 6자리 클래스 코드 생성
 */
async function generateUniqueClassCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    // 6자리 랜덤 코드 생성
    code = Array.from({ length: 6 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join("");

    // 중복 체크
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.code, code),
    });

    if (!existingClass) {
      isUnique = true;
    }
  }

  return code!;
}

// CREATE: 새로운 클래스 생성
export const createClass = withAuth(async (user, formData: FormData) => {
  const rawData = Object.fromEntries(formData.entries());
  const validation = classSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors };
  }

  try {
    // 고유한 클래스 코드 생성
    const classCode = await generateUniqueClassCode();

    const [newClass] = await db
      .insert(classes)
      .values({
        name: validation.data.name,
        code: classCode,
        totalDays: validation.data.totalDays,
        managerId: validation.data.managerId,
        clientId: validation.data.clientId,
        loginMethod: validation.data.loginMethod,
        currentDay: validation.data.currentDay,
        createdBy: user.id,
      })
      .returning({ id: classes.id, code: classes.code });

    if (!newClass) {
      throw new Error("클래스 생성 후 ID를 반환받지 못했습니다.");
    }

    const data = await db.query.classes.findFirst({
      where: eq(classes.id, newClass.id),
      with: {
        client: true,
        manager: true,
      },
    });

    revalidatePath("/admin/classes");
    return {
      message: `수업이 생성되었습니다.\n수업 코드: ${classCode}`,
      data: { ...data, code: classCode },
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return { error: { _form: [error.message] } };
  }
});

// UPDATE: 클래스 정보 수정
export const updateClass = withAuth(
  async (user, classId: string, formData: FormData) => {
    const rawData = Object.fromEntries(formData.entries());
    const validation = classSchema.safeParse(rawData);

    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors };
    }

    try {
      await db
        .update(classes)
        .set(validation.data)
        .where(eq(classes.id, classId));

      const data = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
        with: {
          client: true,
          manager: true,
        },
      });

      revalidatePath("/admin/classes");
      return { message: "수업 정보가 수정되었습니다.", data };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return { error: { _form: [error.message] } };
    }
  }
);

// DELETE: 클래스 삭제
export const deleteClass = withAuth(async (user, classId: string) => {
  try {
    await dbWithTransaction.transaction(async (tx) => {
      // 1. 해당 클래스의 모든 게스트 조회
      const classGuests = await tx.query.guests.findMany({
        where: eq(guests.classId, classId),
        with: {
          wallet: true,
        },
      });

      // 2. 각 게스트의 관련 데이터 삭제
      for (const guest of classGuests) {
        if (guest.wallet) {
          // 2-1. 거래 내역 삭제 (walletId 참조)
          await tx
            .delete(transactions)
            .where(eq(transactions.walletId, guest.wallet.id));

          // 2-2. 지갑 삭제 (guestId 참조)
          await tx.delete(wallets).where(eq(wallets.guestId, guest.id));
        }

        // 2-3. 보유 주식 삭제 (guestId 참조)
        await tx.delete(holdings).where(eq(holdings.guestId, guest.id));
      }

      // 3. 클래스 관련 데이터 삭제
      await tx
        .delete(classStockPrices)
        .where(eq(classStockPrices.classId, classId));
      await tx.delete(news).where(eq(news.classId, classId));

      // 4. 게스트 삭제
      await tx.delete(guests).where(eq(guests.classId, classId));

      // 5. 클래스 삭제
      await tx.delete(classes).where(eq(classes.id, classId));
    });

    revalidatePath("/admin/classes");
    return { message: "수업 및 관련 정보가 삭제되었습니다.", success: true };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 삭제 실패:", error);
    return { error: { _form: [error.message] }, success: false };
  }
});

// 클라이언트와 매니저 목록 조회
export const getClientsAndManagers = withAuth(async (user) => {
  try {
    const clientsData = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.createdBy, user.id));

    const managersData = await db.query.managers.findMany({
      where: eq(managers.createdBy, user.id),
    });

    const formattedManagers = managersData.map((m) => ({
      id: m.id,
      name: m.name,
      clientId: m.clientId,
    }));

    return {
      clients: clientsData,
      managers: formattedManagers,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
    throw new Error(
      `데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`
    );
  }
});

// READ: 모든 클래스 조회
export const getClasses = withAuth(async (user) => {
  try {
    const classesData = await db.query.classes.findMany({
      where: eq(classes.createdBy, user.id),
      with: {
        client: true,
        manager: true,
      },
      orderBy: (classes, { desc }) => [desc(classes.createdAt)],
    });

    if (classesData.length === 0) {
      return {
        data: [],
        error: null,
        success: true,
      };
    }

    // 모든 클래스의 totalDays 일괄 조회 (N+1 쿼리 해결)
    const classIds = classesData.map((c) => c.id);

    // SQL로 각 클래스의 최대 Day 한 번에 조회
    const maxDaysResult = await db
      .select({
        classId: classStockPrices.classId,
        maxDay: sql<number>`MAX(${classStockPrices.day})`,
      })
      .from(classStockPrices)
      .where(inArray(classStockPrices.classId, classIds))
      .groupBy(classStockPrices.classId);

    // 맵으로 변환
    const maxDayMap = new Map(
      maxDaysResult.map((r) => [r.classId, r.maxDay || 0])
    );

    // 클래스 데이터에 totalDays 추가 (메모리에서 매칭)
    const classesWithTotalDays = classesData.map((classItem) => ({
      ...classItem,
      totalDays: maxDayMap.get(classItem.id) || 0,
    }));

    return {
      data: classesWithTotalDays,
      error: null,
      success: true,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 목록을 불러오는 중 오류가 발생했습니다:", error);
    return {
      data: null,
      error,
      success: false,
    };
  }
});

// READ: 특정 클래스 조회
export const getClassById = withAuth(async (user, classId: string) => {
  try {
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        client: true,
        manager: true,
      },
    });

    if (!classData || classData.createdBy !== user.id) {
      return {
        data: null,
        error: null,
        success: false,
      };
    }

    return {
      data: classData,
      error: null,
      success: true,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    console.error("클래스 정보를 불러오는 중 오류가 발생했습니다:", error);
    return {
      data: null,
      error,
      success: false,
    };
  }
});

// 클래스의 current_day 업데이트
export const updateClassCurrentDay = withAuth(
  async (user, classId: string, currentDay: number) => {
    try {
      await db
        .update(classes)
        .set({ currentDay })
        .where(eq(classes.id, classId));
      revalidatePath("/game-management");
      return { message: `현재 Day가 ${currentDay}로 업데이트되었습니다.` };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      throw new Error(`현재 Day 업데이트 실패: ${error.message}`);
    }
  }
);

// 클래스 상태 변경 (설정 -> 진행, 진행 -> 종료)
export const updateClassStatus = withAuth(
  async (user, classId: string, newStatus: "active" | "ended") => {
    try {
      // 현재 상태 확인
      const currentClass = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
      });

      if (!currentClass) {
        return { success: false, error: "클래스를 찾을 수 없습니다." };
      }

      if (currentClass.createdBy !== user.id) {
        return { success: false, error: "권한이 없습니다." };
      }

      // 상태 변경 유효성 검사
      if (currentClass.status === "setting" && newStatus !== "active") {
        return {
          success: false,
          error: "설정 중인 클래스는 진행 상태로만 변경할 수 있습니다.",
        };
      }

      if (currentClass.status === "active" && newStatus !== "ended") {
        return {
          success: false,
          error: "진행 중인 클래스는 종료 상태로만 변경할 수 있습니다.",
        };
      }

      if (currentClass.status === "ended") {
        return {
          success: false,
          error: "이미 종료된 클래스는 상태를 변경할 수 없습니다.",
        };
      }

      // 상태 업데이트
      await db
        .update(classes)
        .set({ status: newStatus })
        .where(eq(classes.id, classId));

      revalidatePath("/admin/classes");

      const statusText = newStatus === "active" ? "진행 중" : "종료";
      return {
        success: true,
        message: `클래스 상태가 '${statusText}'로 변경되었습니다.`,
      };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      console.error("클래스 상태 변경 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Day 증가 + 모든 게스트에게 지원금 지급
export const incrementDayAndPayAllowance = withAuth(
  async (user, classId: string) => {
    try {
      return await dbWithTransaction.transaction(async (tx) => {
        // 1. 클래스 정보 조회
        const classInfo = await tx.query.classes.findFirst({
          where: eq(classes.id, classId),
          columns: { currentDay: true },
        });

        if (!classInfo) {
          throw new Error("클래스 정보를 찾을 수 없습니다.");
        }

        const newDay = (classInfo.currentDay || 0) + 1;

        // 2. 클래스의 currentDay +1
        await tx
          .update(classes)
          .set({ currentDay: newDay })
          .where(eq(classes.id, classId));

        // 3. 해당 클래스의 모든 게스트 ID 조회
        const classGuests = await tx.query.guests.findMany({
          where: eq(guests.classId, classId),
          columns: {
            id: true,
          },
        });

        if (classGuests.length === 0) {
          return {
            success: true,
            message: `Day ${newDay}로 증가했습니다. (학생 없음)`,
            newDay,
            paidCount: 0,
          };
        }

        const guestIds = classGuests.map((g) => g.id);

        // 4. 모든 지갑 일괄 조회 (N+1 쿼리 해결)
        const allWallets = await tx.query.wallets.findMany({
          where: inArray(wallets.guestId, guestIds),
        });

        if (allWallets.length === 0) {
          console.warn("지갑을 찾을 수 없습니다.");
          return {
            success: true,
            message: `Day ${newDay}로 증가했습니다. (지갑 없음)`,
            newDay,
            paidCount: 0,
          };
        }

        // 5. SQL로 모든 지갑 잔액 일괄 업데이트 (100,000원 추가, 소수점 2자리로 제한)
        const allowanceAmount = 100000;
        await tx
          .update(wallets)
          .set({
            balance: sql`ROUND(CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${allowanceAmount}, 2)`,
          })
          .where(inArray(wallets.guestId, guestIds));

        // 6. 거래내역 일괄 삽입
        const transactionValues = allWallets.map((wallet) => ({
          walletId: wallet.id,
          stockId: null,
          type: "deposit",
          subType: "benefit",
          quantity: 0,
          price: allowanceAmount.toString(),
          day: newDay,
          classId: classId,
        })) satisfies Array<typeof transactions.$inferInsert>;

        await tx.insert(transactions).values(transactionValues);

        const paidCount = allWallets.length;

        return {
          success: true,
          message: `Day ${newDay}로 증가하고 ${paidCount}명에게 10만원을 지급했습니다.`,
          newDay,
          paidCount,
        };
      });
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      console.error("Day 증가 및 지원금 지급 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      revalidatePath("/game-management");
    }
  }
);

// QR 코드 토큰 생성
export const generateQRToken = withAuth(async (user, classId: string) => {
  try {
    // 클래스 조회
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return { error: "클래스를 찾을 수 없습니다." };
    }

    // QR 로그인 방식이 아닌 경우
    if (classData.loginMethod !== "qr") {
      return { error: "이 클래스는 QR 로그인 방식이 아닙니다." };
    }

    // 새로운 토큰 생성 (UUID)
    const qrToken = randomUUID();

    // 만료 시간 설정 (12시간)
    const qrExpiresAt = new Date();
    qrExpiresAt.setHours(qrExpiresAt.getHours() + 12);

    // DB 업데이트
    await db
      .update(classes)
      .set({
        qrToken,
        qrExpiresAt,
      })
      .where(eq(classes.id, classId));

    revalidatePath(`/admin/classes/${classId}`);

    return {
      success: true,
      qrToken,
      qrExpiresAt: qrExpiresAt.toISOString(),
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return { error: error.message };
  }
});
