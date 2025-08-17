"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface News {
  id: string;
  day: number;
  title: string;
  content: string;
  related_stock_ids?: string[];
  class_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsData {
  day: number;
  title: string;
  content: string;
  related_stock_ids?: string[];
  class_id: string;
}

export interface UpdateNewsData extends CreateNewsData {
  id: string;
}

// 뉴스 목록 조회 (특정 day 또는 전체)
export async function getNews(day?: number): Promise<News[]> {
  const supabase = await createAdminClient();

  let query = supabase.from("news").select("*");

  if (day !== undefined) {
    query = query.eq("day", day);
  }

  const { data, error } = await query.order("day", { ascending: false });

  if (error) {
    throw new Error(`뉴스 목록 조회 실패: ${error.message}`);
  }

  return data || [];
}

// 뉴스 생성
export async function createNews(newsData: CreateNewsData): Promise<News> {
  const supabase = await createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
  }

  const { data, error } = await supabase
    .from("news")
    .insert([{ ...newsData, created_by: user.id }])
    .select()
    .single();

  if (error) {
    throw new Error(`뉴스 생성 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
  return data;
}

// 뉴스 수정
export async function updateNews(newsData: UpdateNewsData): Promise<News> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("news")
    .update({
      day: newsData.day,
      title: newsData.title,
      content: newsData.content,
      related_stock_ids: newsData.related_stock_ids,
      class_id: newsData.class_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", newsData.id)
    .select()
    .single();

  if (error) {
    throw new Error(`뉴스 수정 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
  return data;
}

// 뉴스 삭제
export async function deleteNews(newsId: string): Promise<void> {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("news").delete().eq("id", newsId);

  if (error) {
    throw new Error(`뉴스 삭제 실패: ${error.message}`);
  }

  revalidatePath("/game-management");
}

// 특정 day의 뉴스 개수 조회
export async function getNewsCountByDay(day: number): Promise<number> {
  const supabase = await createAdminClient();

  const { count, error } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true })
    .eq("day", day);

  if (error) {
    throw new Error(`뉴스 개수 조회 실패: ${error.message}`);
  }

  return count || 0;
}

// 클래스별, Day별 뉴스 조회
export async function getNewsByClassAndDay(classId: string, day: number): Promise<News[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("class_id", classId)
    .eq("day", day)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`클래스별 뉴스 조회 실패: ${error.message}`);
  }

  return data || [];
}
