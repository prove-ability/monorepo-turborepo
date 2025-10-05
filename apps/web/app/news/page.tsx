"use client";

import { useEffect, useState } from "react";
import { getAllNews } from "@/actions/news";
import { Newspaper } from "lucide-react";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface NewsItem {
  id: string;
  day: number | null;
  title: string | null;
  content: string | null;
  relatedStockIds: unknown;
  createdAt: Date;
  relatedStocks: Array<{
    id: string;
    name: string;
  }>;
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await getAllNews();
      setAllNews(data);
    } catch (error) {
      console.error("Failed to load news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh 기능
  const { isRefreshing } = usePullToRefresh(async () => {
    await loadNews();
  });

  if (isLoading) {
    return <PageLoading />;
  }

  // Day별로 그룹화
  const newsByDay = allNews.reduce(
    (acc: Record<number, NewsItem[]>, newsItem) => {
      const day = newsItem.day || 0;
      if (!acc[day]) acc[day] = [];
      acc[day].push(newsItem);
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(newsByDay)
    .map(Number)
    .sort((a, b) => b - a); // 최신 Day 먼저

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh 인디케이터 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader
          title="뉴스"
          description={`총 ${allNews.length}개의 기사`}
          icon={<Newspaper className="h-7 w-7 text-blue-600" />}
        />
        {allNews.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="h-16 w-16" />}
            title="아직 뉴스가 없어요"
            description="첫 뉴스를 기다리고 있어요. 관리자가 뉴스를 등록하면 여기에 표시됩니다."
          />
        ) : (
          <div className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="px-3 py-1 bg-gray-700 text-white text-sm font-bold rounded-full">
                    Day {day}
                  </span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                {newsByDay[day]?.map((newsItem) => (
                  <div
                    key={newsItem.id}
                    className="bg-white rounded-lg p-4 shadow border border-gray-200"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newsItem.relatedStocks.map((stock) => (
                        <span
                          key={stock.id}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded"
                        >
                          {stock.name}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      {newsItem.title}
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {newsItem.content}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
