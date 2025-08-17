"use client";

import { Newspaper, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

import { NewsItem } from "@/types/news";
import { createWebClientByClientSide } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface NewsClientProps {
  classId: string;
}

export default function NewsClient({ classId }: NewsClientProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const supabase = createWebClientByClientSide();
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (newsError) {
        console.error("뉴스 조회 실패:", newsError);
        setNews([]);
        setLoading(false);
        return;
      }

      const newsWithTags = await Promise.all(
        newsData.map(async (item: any) => {
          let tags: string[] = [];
          if (item.related_stock_ids && item.related_stock_ids.length > 0) {
            const { data: stocks, error: stocksError } = await supabase
              .from("stocks")
              .select("name")
              .in("id", item.related_stock_ids);

            if (stocksError) {
              console.error("관련 주식 조회 실패:", stocksError);
            } else {
              tags = stocks.map((stock: any) => `#${stock.name}`);
            }
          }
          return { ...item, tags, id: item.id };
        })
      );

      setNews(newsWithTags);
      setLoading(false);
    };

    fetchNews();
  }, [classId]);

  if (loading) {
    return (
      <div className="w-full bg-white flex flex-col h-screen items-center justify-center">
        <p>뉴스를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white flex flex-col h-screen">
      <header className="flex items-center justify-between p-4">
        <button onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-grow overflow-y-auto p-4">
        <div className="bg-blue-900 text-white p-4 rounded-lg mb-4">
          <h2 className="font-bold text-lg flex items-center">
            <Newspaper className="h-5 w-5 mr-2" />
            오늘의 뉴스
          </h2>
          <p className="text-sm">뉴스는 주식 가격에 영향을 줘요.</p>
        </div>

        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 text-sm mb-2">{item.content}</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-blue-600 text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full bg-green-200 text-green-800 font-bold py-3 rounded-lg mt-6">
          투자하러 가기
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
