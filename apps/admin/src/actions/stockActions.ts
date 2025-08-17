"use server";

import { createClientByServerSide } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export interface Stock {
  id: string;
  name: string;
  industry_sector?: string;
  remarks?: string;
  market_country_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStockData {
  name: string;
  industry_sector?: string;
  remarks?: string;
  market_country_code: string;
}

export interface UpdateStockData extends CreateStockData {
  id: string;
}

// 주식 목록 조회
export async function getStocks(): Promise<Stock[]> {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`주식 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

// 주식 생성
export async function createStock(stockData: CreateStockData): Promise<Stock> {
  const supabase = await createClientByServerSide();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
  }

  const { data, error } = await supabase
    .from("stocks")
    .insert([{ ...stockData, created_by: user.id }])
    .select()
    .single();

  if (error) {
    throw new Error(`주식 생성 실패: ${error.message}`);
  }

  revalidatePath("/stocks");
  return data;
}

// 주식 수정
export async function updateStock(stockData: UpdateStockData): Promise<Stock> {
  const supabase = await createClientByServerSide();

  const { data, error } = await supabase
    .from("stocks")
    .update({
      name: stockData.name,
      industry_sector: stockData.industry_sector,
      remarks: stockData.remarks,
      market_country_code: stockData.market_country_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockData.id)
    .select()
    .single();

  if (error) {
    throw new Error(`주식 수정 실패: ${error.message}`);
  }

  revalidatePath("/stocks");
  return data;
}

// 주식 삭제
export async function deleteStock(stockId: string): Promise<void> {
  const supabase = await createClientByServerSide();

  const { error } = await supabase.from("stocks").delete().eq("id", stockId);

  if (error) {
    throw new Error(`주식 삭제 실패: ${error.message}`);
  }

  revalidatePath("/stocks");
}
