"use server";

import { createWebClient } from "@/lib/supabase/server";

export async function getNewsByDay(classId: string, day: number) {
  const supabase = await createWebClient();

  const { data: newsData, error: newsError } = await supabase
    .from("news")
    .select("id, title, content, related_stock_ids")
    .eq("class_id", classId)
    .eq("day", day)
    .order("created_at", { ascending: false });

  if (newsError) {
    console.error("뉴스 조회 실패:", newsError);
    return [];
  }

  const newsWithTags = await Promise.all(
    newsData.map(async (item) => {
      let tags: string[] = [];
      if (item.related_stock_ids && item.related_stock_ids.length > 0) {
        const { data: stocks, error: stocksError } = await supabase
          .from("stocks")
          .select("name")
          .in("id", item.related_stock_ids);

        if (stocksError) {
          console.error("관련 주식 조회 실패:", stocksError);
        } else {
          tags = stocks.map((stock) => stock.name);
        }
      }
      return { ...item, tags };
    })
  );

  return newsWithTags;
}
