"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllNews } from "@/actions/news";
import { Newspaper } from "lucide-react";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import StockInfoModal from "@/components/StockInfoModal";
import { News, Stock } from "@/types";

interface NewsItem extends News {
  relatedStocks: Pick<Stock, "id" | "name">[];
}

export default function NewsPage() {
  const [selectedStock, setSelectedStock] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // React Query로 뉴스 데이터 가져오기
  const {
    data: allNews = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["news"],
    queryFn: getAllNews,
  });

  // Pull-to-refresh 기능
  const { isRefreshing } = usePullToRefresh(async () => {
    await refetch();
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
      {isRefreshing && <PageLoading />}
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
                        <button
                          key={stock.id}
                          onClick={() =>
                            setSelectedStock({ id: stock.id, name: stock.name })
                          }
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          {stock.name}
                        </button>
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

      {/* Stock Info Modal */}
      {selectedStock && (
        <StockInfoModal
          stockId={selectedStock.id}
          stockName={selectedStock.name}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
