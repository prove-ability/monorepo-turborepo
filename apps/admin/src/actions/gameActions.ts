"use server";

import { createClientByServerSide } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export interface ClassStockPrice {
  id: string;
  class_id?: string;
  stock_id?: string;
  day: number;
  price: number;
  news_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStockPriceData {
  class_id?: string;
  stock_id: string;
  day: number;
  price: number;
  news_id?: string;
}

export interface UpdateStockPriceData extends CreateStockPriceData {
  id: string;
}

export interface GameData {
  class_id: string;
  day: number;
  stocks: {
    stock_id: string;
    price: number;
  }[];
  news: {
    title: string;
    content: string;
    related_stock_ids?: string[];
  }[];
}

// 클래스별 주식 가격 조회
export async function getClassStockPrices(
  classId?: string,
  day?: number
): Promise<ClassStockPrice[]> {
  const supabase = await createClientByServerSide();

  let query = supabase.from("class_stock_prices").select("*");

  if (classId) {
    query = query.eq("class_id", classId);
  }

  if (day !== undefined) {
    query = query.eq("day", day);
  }

  const { data, error } = await query.order("day", { ascending: false });

  if (error) {
    throw new Error(`주식 가격 조회 실패: ${error.message}`);
  }

  return data || [];
}

// 주식 가격 생성
export async function createStockPrice(
  priceData: CreateStockPriceData
): Promise<ClassStockPrice> {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("class_stock_prices")
    .insert([priceData])
    .select()
    .single();

  if (error) {
    throw new Error(`주식 가격 생성 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
  return data;
}

// 주식 가격 수정
export async function updateStockPrice(
  priceData: UpdateStockPriceData
): Promise<ClassStockPrice> {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("class_stock_prices")
    .update({
      class_id: priceData.class_id,
      stock_id: priceData.stock_id,
      day: priceData.day,
      price: priceData.price,
      news_id: priceData.news_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", priceData.id)
    .select()
    .single();

  if (error) {
    throw new Error(`주식 가격 수정 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
  return data;
}

// 주식 가격 삭제
export async function deleteStockPrice(priceId: string): Promise<void> {
  const supabase = await createClientByServerSide();

  const { error } = await supabase
    .from("class_stock_prices")
    .delete()
    .eq("id", priceId);

  if (error) {
    throw new Error(`주식 가격 삭제 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
}

// 클래스별 게임 데이터 일괄 생성
export async function createGameDay(gameData: GameData): Promise<void> {
  const supabase = await createClientByServerSide();

  try {
    // 1. 뉴스 생성
    const newsPromises = gameData.news.map(async (news) => {
      const newsData = {
        day: gameData.day,
        title: news.title,
        content: news.content,
        related_stock_ids: news.related_stock_ids || [],
        class_id: gameData.class_id,
      };

      console.log("뉴스 삽입 데이터:", newsData);

      const { data, error } = await supabase
        .from("news")
        .insert([newsData])
        .select()
        .single();

      if (error) {
        console.error("뉴스 삽입 에러:", error);
        throw error;
      }
      return data;
    });

    const createdNews = await Promise.all(newsPromises);
    console.log("생성된 뉴스:", createdNews);

    // 2. 주식 가격 생성
    const pricePromises = gameData.stocks.map(async (stock) => {
      const priceData = {
        class_id: gameData.class_id,
        stock_id: stock.stock_id,
        day: gameData.day,
        price: stock.price,
        news_id: createdNews[0]?.id, // 첫 번째 뉴스와 연결
      };

      console.log("주식 가격 삽입 데이터:", priceData);

      const { error } = await supabase
        .from("class_stock_prices")
        .insert([priceData]);

      if (error) {
        console.error("주식 가격 삽입 에러:", error);
        throw error;
      }
    });

    await Promise.all(pricePromises);

    revalidatePath("/game-management");
  } catch (error) {
    throw new Error(
      `게임 데이터 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}

// 특정 클래스의 게임 진행 상황 조회
export async function getGameProgress(classId: string): Promise<{
  maxDay: number;
  totalNews: number;
  totalPrices: number;
}> {
  const supabase = await createClientByServerSide();

  // 최대 day 조회
  const { data: maxDayData, error: maxDayError } = await supabase
    .from("class_stock_prices")
    .select("day")
    .eq("class_id", classId)
    .order("day", { ascending: false })
    .limit(1);

  if (maxDayError) {
    throw new Error(`게임 진행 상황 조회 실패: ${maxDayError.message}`);
  }

  const maxDay = maxDayData?.[0]?.day || 0;

  // 뉴스 개수 조회
  const { count: newsCount, error: newsError } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true })
    .lte("day", maxDay);

  if (newsError) {
    throw new Error(`뉴스 개수 조회 실패: ${newsError.message}`);
  }

  // 가격 데이터 개수 조회
  const { count: priceCount, error: priceError } = await supabase
    .from("class_stock_prices")
    .select("*", { count: "exact", head: true })
    .eq("class_id", classId);

  if (priceError) {
    throw new Error(`가격 데이터 개수 조회 실패: ${priceError.message}`);
  }

  return {
    maxDay,
    totalNews: newsCount || 0,
    totalPrices: priceCount || 0,
  };
}
