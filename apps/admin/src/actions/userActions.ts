"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, guests, wallets, transactions, holdings, stocks } from "@repo/db";
import { eq, or, like, and, desc, asc, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/safe-action";
import { INITIAL_WALLET_BALANCE } from "@/config/gameConfig";

// loginId 생성 헬퍼 함수 (중복 시 숫자 증가)
async function generateUniqueLoginId(
  name: string,
  classId: string
): Promise<string> {
  // 같은 클래스 내에서 같은 이름으로 시작하는 모든 loginId 조회
  const existingUsers = await db.query.guests.findMany({
    where: and(eq(guests.classId, classId), like(guests.loginId, `${name}%`)),
    columns: {
      loginId: true,
    },
  });

  // 중복이 없으면 그대로 반환
  if (existingUsers.length === 0) {
    return name;
  }

  // 기존 loginId들 확인
  const existingLoginIds = new Set(existingUsers.map((u) => u.loginId));

  // 중복이 없으면 그대로 사용
  if (!existingLoginIds.has(name)) {
    return name;
  }

  // 기존 사용자 수 + 1을 다음 번호로 사용
  // 예: "김철수", "김철수2"가 있으면 length=2, 다음은 "김철수3"
  return `${name}${existingUsers.length + 1}`;
}

// 타입 정의
interface CreateUserData {
  name: string;
  mobilePhone: string;
  grade: string;
  affiliation: string;
  classId: string;
  nickname?: string;
}

type UpdateUserData = Partial<CreateUserData>;

const createUserSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().min(10, "전화번호는 10자 이상이어야 합니다"),
  grade: z.string().min(1, "학년은 필수입니다"),
  school_name: z.string().min(1, "학교명은 필수입니다"),
  class_id: z.string().uuid("올바른 클래스 ID가 아닙니다"),
});

export const createUser = withAuth(async (user, formData: FormData) => {
  try {
    const validatedData = createUserSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      grade: formData.get("grade"),
      school_name: formData.get("school_name"),
      class_id: formData.get("class_id"),
    });

    const loginId = await generateUniqueLoginId(
      validatedData.name,
      validatedData.class_id
    );

    // 전화번호 정리 (하이픈 제거)
    const cleanPhone = validatedData.phone.replace(/[^0-9]/g, "");

    const [newGuest] = await db
      .insert(guests)
      .values({
        name: validatedData.name,
        classId: validatedData.class_id,
        mobilePhone: cleanPhone,
        affiliation: validatedData.school_name,
        grade: validatedData.grade,
        loginId: loginId,
        password: "pw1234", // 기본 비밀번호
      })
      .returning();

    if (!newGuest) {
      throw new Error("게스트 생성에 실패했습니다.");
    }

    // wallet 자동 생성
    const [newWallet] = await db
      .insert(wallets)
      .values({
        guestId: newGuest.id,
        balance: INITIAL_WALLET_BALANCE,
      })
      .returning();

    if (!newWallet) {
      throw new Error("지갑 생성에 실패했습니다.");
    }

    // 초기 자본 거래 내역 기록
    await db.insert(transactions).values({
      walletId: newWallet.id,
      type: "deposit",
      subType: "benefit",
      quantity: 0,
      price: INITIAL_WALLET_BALANCE,
      day: 1,
      classId: validatedData.class_id,
    });

    revalidatePath("/protected/classes");
    return {
      success: true,
      message: `학생 계정이 생성되었습니다.\n\n로그인 ID: ${loginId}\n비밀번호: pw1234`,
      error: undefined,
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.flatten().fieldErrors,
        message: undefined,
      };
    }
    return {
      success: false,
      error: { _form: [`사용자 생성 중 오류 발생: ${error.message}`] },
      message: undefined,
    };
  }
});

// READ: 모든 사용자 조회
export async function getUsers() {
  try {
    const data = await db.query.guests.findMany({
      with: {
        class: { with: { client: true } },
      },
      orderBy: [desc(guests.createdAt)],
    });
    return { success: true, data };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `사용자 목록을 불러오는데 실패했습니다: ${error.message}`,
    };
  }
}

// READ: 특정 클래스의 사용자들 조회 (검색 기능 포함)
export async function getUsersByClass(classId: string, searchTerm?: string) {
  try {
    const conditions = [eq(guests.classId, classId)];
    if (searchTerm?.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      conditions.push(
        or(
          like(guests.name, searchPattern),
          like(guests.mobilePhone, searchPattern),
          like(guests.affiliation, searchPattern)
        )!
      );
    }

    const data = await db.query.guests.findMany({
      where: and(...conditions.filter(Boolean)),
      orderBy: [asc(guests.name)],
    });
    return { success: true, data: data || [] };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    throw new Error(`사용자 조회 실패: ${error.message}`);
  }
}

// UPDATE: 사용자 정보 수정
export const updateUser = withAuth(
  async (user, userId: string, data: UpdateUserData) => {
    try {
      const updateData = {
        name: data.name,
        mobilePhone: data.mobilePhone,
        grade: data.grade,
        affiliation: data.affiliation,
        classId: data.classId,
        nickname: data.nickname,
      };

      await db.update(guests).set(updateData).where(eq(guests.id, userId));
      revalidatePath("/classes");
      return {
        success: true,
        message: "사용자 정보가 성공적으로 수정되었습니다.",
      };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return {
        success: false,
        error: `사용자 정보 수정에 실패했습니다: ${error.message}`,
      };
    }
  }
);

// DELETE: 사용자 삭제
export const deleteUser = withAuth(async (user, userId: string) => {
  try {
    await db.delete(wallets).where(eq(wallets.guestId, userId));
    await db.delete(guests).where(eq(guests.id, userId));
    revalidatePath("/classes");
    return { success: true, message: "사용자가 성공적으로 삭제되었습니다." };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `사용자 삭제에 실패했습니다: ${error.message}`,
    };
  }
});

// BULK CREATE: 여러 사용자 한번에 생성
export const bulkCreateUsers = withAuth(
  async (
    user,
    usersData: Array<{
      name: string;
      mobilePhone: string;
      grade: string;
      affiliation: string;
      classId: string;
      nickname?: string;
    }>
  ) => {
    let successCount = 0;
    let failureCount = 0;

    try {
      // 각 사용자를 개별적으로 삽입 (일부 실패해도 나머지 진행)
      for (const userData of usersData) {
        try {
          const loginId = await generateUniqueLoginId(
            userData.name,
            userData.classId
          );

          const [newGuest] = await db
            .insert(guests)
            .values({
              name: userData.name,
              mobilePhone: userData.mobilePhone,
              grade: userData.grade,
              affiliation: userData.affiliation,
              classId: userData.classId,
              nickname: userData.nickname,
              loginId: loginId,
              password: "pw1234",
            })
            .returning();

          if (!newGuest) {
            throw new Error("게스트 생성에 실패했습니다.");
          }

          // wallet 자동 생성
          const [newWallet] = await db
            .insert(wallets)
            .values({
              guestId: newGuest.id,
              balance: INITIAL_WALLET_BALANCE,
            })
            .returning();

          if (!newWallet) {
            throw new Error("지갑 생성에 실패했습니다.");
          }

          // 초기 자본 거래 내역 기록
          await db.insert(transactions).values({
            walletId: newWallet.id,
            type: "deposit",
            subType: "benefit",
            quantity: 0,
            price: INITIAL_WALLET_BALANCE,
            day: 1,
            classId: userData.classId,
          });

          successCount++;
        } catch (err) {
          console.error("Failed to create user:", userData, err);
          failureCount++;
        }
      }

      revalidatePath("/protected/classes");
      return { successCount, failureCount };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return {
        error: {
          _form: [`일괄 등록 중 오류 발생: ${error.message}`],
        },
      };
    }
  }
);

// 학생 일괄 삭제 (설문 테이블 제외)
export const deleteGuests = withAuth(
  async (user, guestIds: string[], classId: string) => {
    try {
      if (!guestIds || guestIds.length === 0) {
        throw new Error("삭제할 학생을 선택해주세요");
      }

      // 1. 해당 클래스의 학생들인지 확인
      const guestsToDelete = await db.query.guests.findMany({
        where: and(inArray(guests.id, guestIds), eq(guests.classId, classId)),
        with: {
          wallet: true,
        },
      });

      if (guestsToDelete.length === 0) {
        throw new Error("삭제할 학생을 찾을 수 없습니다");
      }

      if (guestsToDelete.length !== guestIds.length) {
        throw new Error("일부 학생이 해당 클래스에 속하지 않습니다");
      }

      let deletedCount = 0;

      // 2. 각 학생별로 관련 데이터 삭제
      for (const guest of guestsToDelete) {
        try {
          // 2-1. 거래내역 삭제 (wallet이 있는 경우)
          if (guest.wallet?.id) {
            await db
              .delete(transactions)
              .where(eq(transactions.walletId, guest.wallet.id));
          }

          // 2-2. 보유 주식 삭제
          await db.delete(holdings).where(eq(holdings.guestId, guest.id));

          // 2-3. 지갑 삭제
          if (guest.wallet?.id) {
            await db.delete(wallets).where(eq(wallets.id, guest.wallet.id));
          }

          // 2-4. 학생 삭제 (surveys는 ON DELETE CASCADE로 자동 보존됨)
          await db.delete(guests).where(eq(guests.id, guest.id));

          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete guest ${guest.id}:`, err);
          // 개별 학생 삭제 실패 시 계속 진행
        }
      }

      revalidatePath(`/protected/classes/${classId}`);
      revalidatePath("/protected/classes");

      return {
        success: true,
        message: `${deletedCount}명의 학생이 삭제되었습니다`,
        deletedCount,
      };
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error("An unknown error occurred");
      return {
        error: {
          _form: [`학생 삭제 중 오류 발생: ${error.message}`],
        },
      };
    }
  }
);

// 학생 게임 참여 이력 조회
export async function getStudentGameHistory(guestId: string) {
  try {
    // 학생 정보 조회
    const guest = await db.query.guests.findFirst({
      where: eq(guests.id, guestId),
      with: {
        class: true,
        wallet: true,
      },
    });

    if (!guest) {
      throw new Error("학생을 찾을 수 없습니다");
    }

    // 거래 내역 조회 (주식 정보 포함)
    const transactionsList = await db.query.transactions.findMany({
      where: guest.wallet?.id
        ? eq(transactions.walletId, guest.wallet.id)
        : undefined,
      orderBy: [desc(transactions.day), desc(transactions.createdAt)],
    });

    // 주식 정보 조회
    const stockIds = transactionsList
      .filter((t) => t.stockId)
      .map((t) => t.stockId!);
    const uniqueStockIds = [...new Set(stockIds)];

    const stocksData =
      uniqueStockIds.length > 0
        ? await db.query.stocks.findMany({
            where: inArray(stocks.id, uniqueStockIds),
          })
        : [];

    const stockMap = new Map(stocksData.map((s) => [s.id, s]));

    // 거래 내역에 주식 정보 추가
    const transactionsWithStock = transactionsList.map((t) => ({
      ...t,
      stock: t.stockId ? stockMap.get(t.stockId) : null,
    }));

    // 보유 주식 조회
    const holdingsList = await db.query.holdings.findMany({
      where: eq(holdings.guestId, guestId),
    });

    // 보유 주식에 주식 정보 추가
    const holdingsWithStock = await Promise.all(
      holdingsList.map(async (holding) => {
        const stock = await db.query.stocks.findFirst({
          where: eq(stocks.id, holding.stockId!),
        });
        return {
          ...holding,
          stock,
        };
      })
    );

    return {
      success: true,
      data: {
        guest,
        transactions: transactionsWithStock,
        holdings: holdingsWithStock,
        currentDay: guest.class?.currentDay || 1,
      },
    };
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("An unknown error occurred");
    return {
      success: false,
      error: `게임 이력 조회 실패: ${error.message}`,
    };
  }
}
