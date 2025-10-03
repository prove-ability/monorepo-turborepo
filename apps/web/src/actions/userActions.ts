"use server";

import { stackServerApp } from "@/stack/server";
import {
  db,
  guests,
  classes,
  wallets,
  holdings,
  classStockPrices,
} from "@repo/db";
import { eq, and, ne, InferSelectModel } from "drizzle-orm";

export interface UpdateNicknameResult {
  success: boolean;
  message: string;
  nickname?: string;
}

export async function updateNickname(
  nickname: string
): Promise<UpdateNicknameResult> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return { success: false, message: "로그인이 필요합니다." };
    }
    const userId = user.id;

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      return { success: false, message: "닉네임을 입력해주세요." };
    }
    if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
      return {
        success: false,
        message: "닉네임은 2-10자 사이로 입력해주세요.",
      };
    }

    // 닉네임 중복 확인 (Drizzle 사용)
    const existingUser = await db.query.guests.findFirst({
      where: and(eq(guests.nickname, trimmedNickname), ne(guests.id, userId)),
      columns: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.",
      };
    }

    // 닉네임 업데이트 (Drizzle 사용)
    await db
      .update(guests)
      .set({ nickname: trimmedNickname })
      .where(eq(guests.id, userId));

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
  try {
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
      columns: {
        balance: true,
      },
    });

    return wallet || null;
  } catch (error) {
    console.error("지갑 정보 조회 실패:", error);
    return null;
  }
}

export async function getRankingByClass(classId: string) {
  try {
    const classInfo = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      columns: { currentDay: true },
    });

    if (!classInfo || classInfo.currentDay === null) {
      console.error("클래스 정보 또는 현재 Day 정보를 찾을 수 없습니다.");
      return [];
    }

    const currentDay = classInfo.currentDay;

    const usersInClass = await db.query.guests.findMany({
      where: eq(guests.classId, classId),
      with: {
        wallet: true,
        holdings: {
          with: {
            stock: {
              with: {
                classStockPrices: {
                  where: eq(classStockPrices.day, currentDay),
                  columns: { price: true },
                },
              },
            },
          },
        },
      },
    });

    const rankings = usersInClass.map((user) => {
      const walletBalance = user.wallet
        ? parseFloat(user.wallet.balance || "0")
        : 0;

      const holdingsValue = user.holdings.reduce((acc, holding) => {
        if (!holding.stock || !holding.quantity) {
          return acc;
        }
        const priceInfo = holding.stock.classStockPrices[0] as
          | { price: string | null }
          | undefined;
        const currentPrice = priceInfo?.price ? parseFloat(priceInfo.price) : 0;
        return acc + currentPrice * holding.quantity;
      }, 0);

      const totalAsset = walletBalance + holdingsValue;

      return {
        nickname: user.nickname,
        totalAsset,
      };
    });

    rankings.sort((a, b) => {
      if (b.totalAsset !== a.totalAsset) {
        return b.totalAsset - a.totalAsset;
      }
      return (a.nickname || "").localeCompare(b.nickname || "");
    });

    return rankings.map((r, index) => ({ ...r, rank: index + 1 }));
  } catch (error) {
    console.error("랭킹 정보 조회 실패:", error);
    return [];
  }
}

export async function getHoldings() {
  const user = await stackServerApp.getUser();
  if (!user) {
    console.error("사용자 인증 실패");
    return [];
  }
  const userId = user.id;

  try {
    const userWithClass = await db.query.guests.findFirst({
      where: eq(guests.id, userId),
      columns: { classId: true },
      with: {
        class: {
          columns: { currentDay: true },
        },
      },
    });

    if (
      !userWithClass ||
      !userWithClass.class ||
      !userWithClass.classId ||
      userWithClass.class.currentDay === null
    ) {
      console.error("사용자 또는 클래스 정보를 찾을 수 없습니다.");
      return [];
    }

    const classId = userWithClass.classId;
    const currentDay = userWithClass.class.currentDay;

    const userHoldings = await db.query.holdings.findMany({
      where: eq(holdings.userId, userId),
      with: {
        stock: {
          with: {
            classStockPrices: {
              where: (
                prices: InferSelectModel<typeof classStockPrices>,
                { eq, and }: { eq: any; and: any }
              ) => and(eq(prices.classId, classId), eq(prices.day, currentDay)),
              columns: {
                price: true,
              },
            },
          },
        },
      },
    });

    return userHoldings.map((h) => ({
      stock_id: h.stockId,
      quantity: h.quantity,
      average_purchase_price: h.averagePurchasePrice,
      name: h.stock?.name || "N/A",
      current_price:
        (h.stock?.classStockPrices[0] as { price: string | null } | undefined)
          ?.price || null,
    }));
  } catch (error) {
    console.error("보유 주식 정보 조회 실패:", error);
    return [];
  }
}
