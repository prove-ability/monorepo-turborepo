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
import InfoBanner from "@/components/InfoBanner";
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
    data: newsData,
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

  const allNews = newsData?.news || [];

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
          description="시장 뉴스를 읽고 투자 결정을 내려보세요"
        />
        
        {/* 안내 배너 */}
        <InfoBanner
          icon="💡"
          title="기업명을 클릭하면 회사 정보를 볼 수 있어요"
          description="관심 있는 기업의 배경과 사업 내용을 확인해보세요!"
        />

        {allNews.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="h-16 w-16" />}
            title="아직 뉴스가 없어요"
            description="첫 뉴스를 기다리고 있어요. 관리자가 뉴스를 등록하면 여기에 표시됩니다."
          />
        ) : (
          <div id="news-list" className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-full">
                    Day {day}
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                {newsByDay[day]?.map((newsItem) => (
                  <div
                    key={newsItem.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newsItem.relatedStocks.map((stock) => (
                        <button
                          key={stock.id}
                          onClick={() =>
                            setSelectedStock({ id: stock.id, name: stock.name })
                          }
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{stock.name}</span>
                          <span className="text-emerald-500">›</span>
                        </button>
                      ))}
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-2">
                      {newsItem.title}
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
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
