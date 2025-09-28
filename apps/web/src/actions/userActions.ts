"use server";

import { createWebClient } from "@/lib/supabase/server";
import { Holding, Ranking, User } from "@/types/ranking";
import { redirect } from "next/navigation";
import { db, users, classes, wallets, holdings, classStockPrices } from "@repo/db";
import { eq, or, like, and, desc, asc, ne, InferSelectModel } from "drizzle-orm";

export interface LoginResult {
  success: boolean;
  message: string;
  user?: {
    user_id: string;
    name: string;
    login_id: string;
    nickname: string | null;
    phone: string;
    grade: number | null;
    school_name: string;
    class_id: string;
  };
}

export async function loginStudent(
  loginId: string,
  password: string
): Promise<LoginResult> {
  try {
    const supabase = await createWebClient();

    // 관리자 계정 형식 차단 (일반 이메일 형식)
    if (loginId.includes("@") && !loginId.endsWith("@student.local")) {
      return {
        success: false,
        message: "관리자 계정으로는 학생 페이지에 접근할 수 없습니다.",
      };
    }

    // Supabase Auth로 직접 로그인 시도
    // 사용자의 login_id를 이메일 형식으로 변환
    const email = `${loginId}@student.local`;
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !authData.user) {
      return {
        success: false,
        message: "로그인 ID 또는 비밀번호가 올바르지 않습니다.",
      };
    }

    // users 테이블에서 사용자 정보 가져오기 (Drizzle 사용)
    const user = await db.query.users.findFirst({
      where: eq(users.id, authData.user.id),
    });

    if (!user) {
      // Supabase Auth에는 사용자가 있지만 DB에 없는 경우, 로그아웃 처리
      await supabase.auth.signOut();
      return {
        success: false,
        message: "사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.",
      };
    }

    // 기존 사용자 정보 반환
    return {
      success: true,
      message: "로그인 성공",
      user: {
        user_id: user.id,
        name: user.name,
        login_id: user.loginId,
        nickname: user.nickname,
        phone: user.phone,
        grade: user.grade ? parseInt(user.grade, 10) : null,
        school_name: user.schoolName,
        class_id: user.classId,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    };
  }
}

export interface UpdateNicknameResult {
  success: boolean;
  message: string;
  nickname?: string;
}

export async function updateNickname(
  nickname: string
): Promise<UpdateNicknameResult> {
  try {
    // TODO: 인증 시스템 교체 시, 사용자 인증 로직 수정 필요
    const supabase = await createWebClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      return { success: false, message: "닉네임을 입력해주세요." };
    }
    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
      return { success: false, message: "닉네임은 2-10자 사이로 입력해주세요." };
    }

    // 닉네임 중복 확인 (Drizzle 사용)
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.nickname, trimmedNickname),
        ne(users.id, authUser.id)
      ),
      columns: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.",
      };
    }

    // 닉네임 업데이트 (Drizzle 사용)
    await db.update(users)
      .set({ nickname: trimmedNickname })
      .where(eq(users.id, authUser.id));

    return {
      success: true,
      message: "닉네임이 성공적으로 설정되었습니다.",
      nickname: trimmedNickname,
    };
  } catch (error) {
    console.error("Update nickname error:", error);
    return {
      success: false,
      message: "닉네임 설정 중 오류가 발생했습니다.",
    };
  }
}

export async function getWallet(userId: string) {
  const supabase = await createWebClient();

  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("지갑 정보 조회 실패:", error);
    return null;
  }

  return wallet;
}

export async function getRankingByClass(classId: string) {
  try {
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      columns: { currentDay: true },
    });

    if (!classInfo) {
      console.error("클래스 정보를 찾을 수 없습니다.");
      return [];
    }

    const usersInClass = await db.query.users.findMany({
      where: eq(users.classId, classId),
      with: {
        wallet: true,
        holdings: {
          with: {
            stock: {
              with: {
                classStockPrices: {
                  where: eq(classStockPrices.day, classInfo.currentDay),
                  columns: { price: true },
                },
              },
            },
          },
        },
      },
    });

    type UserWithRelations = typeof usersInClass[number];

    const rankings = usersInClass.map((user: UserWithRelations) => {
      const walletBalance = user.wallet ? parseFloat(user.wallet.balance) : 0;
      const holdingsValue = user.holdings.reduce((acc: number, holding: UserWithRelations['holdings'][number]) => {
        const currentPrice = holding.stock.classStockPrices[0]?.price ? parseFloat(holding.stock.classStockPrices[0].price) : 0;
        return acc + currentPrice * holding.quantity;
      }, 0);

      const totalAsset = walletBalance + holdingsValue;

      return {
        nickname: user.nickname,
        totalAsset,
      };
    });

    type Ranking = typeof rankings[number];

    rankings.sort((a: Ranking, b: Ranking) => {
      if (b.totalAsset !== a.totalAsset) {
        return b.totalAsset - a.totalAsset;
      }
      const aHasNickname = !!a.nickname;
      const bHasNickname = !!b.nickname;
      if (aHasNickname && !bHasNickname) return -1;
      if (!aHasNickname && bHasNickname) return 1;
      return (a.nickname || "").localeCompare(b.nickname || "");
    });

    return rankings.map((r: Ranking, index: number) => ({ ...r, rank: index + 1 }));
  } catch (error) {
    console.error("랭킹 정보 조회 실패:", error);
    return [];
  }
}

export async function getHoldings() {
  // TODO: Next-Auth 또는 다른 인증 라이브러리로 교체 시, 사용자 인증 로직 수정 필요
  const supabase = await createWebClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    console.error("사용자 인증 실패");
    return [];
  }
  const userId = authUser.id;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { classId: true },
      with: {
        class: {
          columns: { currentDay: true },
        },
      },
    });

    if (!user || !user.class || !user.classId) {
      console.error("사용자 또는 클래스 정보를 찾을 수 없습니다.");
      return [];
    }

    const classId = user.classId;
    const currentDay = user.class.currentDay;

    const userHoldings = await db.query.holdings.findMany({
      where: eq(holdings.userId, userId),
      with: {
        stock: {
          with: {
            classStockPrices: {
              where: (prices: InferSelectModel<typeof classStockPrices>, { eq, and }: { eq: any, and: any }) =>
                and(
                  eq(prices.classId, classId),
                  eq(prices.day, currentDay)
                ),
              columns: {
                price: true,
              },
            },
          },
        },
      },
    });

    type HoldingWithRelations = typeof userHoldings[number];

    return userHoldings.map((h: HoldingWithRelations) => ({
      stock_id: h.stockId,
      quantity: h.quantity,
      average_purchase_price: h.averagePurchasePrice,
      name: h.stock.name,
      current_price: h.stock.classStockPrices[0]?.price || null,
    }));
  } catch (error) {
    console.error("보유 주식 정보 조회 실패:", error);
    return [];
  }
}

export async function logoutStudent() {
  const supabase = await createWebClient();
  await supabase.auth.signOut();
  redirect("/login");
}
