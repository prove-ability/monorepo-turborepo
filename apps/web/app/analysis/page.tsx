"use client";

import { useEffect, useState } from "react";
import { getDashboardData, DashboardData } from "@/actions/dashboard";
import { getAllNews } from "@/actions/news";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";

interface RelatedStock {
  id: string;
  name: string;
}

interface NewsItem {
  id: string;
  title: string | null;
  content: string | null;
  relatedStockIds: string[] | null;
  relatedStocks: RelatedStock[];
  day: number | null;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [newsData, setNewsData] = useState<Record<string, NewsItem[]>>({});

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardData();
      setDashboardData(data);
      
      // 뉴스 데이터 불러오기
      const allNews = await getAllNews();
      
      // 어제(currentDay - 1) 뉴스를 주식별로 그룹화
      const yesterdayNews: Record<string, NewsItem[]> = {};
      allNews.forEach((newsItem) => {
        if (newsItem.day === data.currentDay - 1 && newsItem.relatedStockIds) {
          newsItem.relatedStockIds.forEach((stockId) => {
            if (!yesterdayNews[stockId]) {
              yesterdayNews[stockId] = [];
            }
            yesterdayNews[stockId].push(newsItem);
          });
        }
      });
      
      setNewsData(yesterdayNews);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !dashboardData) {
    return <PageLoading />;
  }

  // Day 2 미만이거나 보유 주식이 없으면 홈으로
  if (dashboardData.currentDay < 2 || dashboardData.holdingStocks.length === 0) {
    router.push("/");
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader
          title="투자 결과 분석"
          description="어제 뉴스가 내 투자에 어떤 영향을 줬는지 확인해보세요"
        />

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-700 px-1">
            📈 보유 주식 상세 분석
          </h2>

          {/* 뉴스 있는 종목 우선 정렬 */}
          {dashboardData.holdingStocks
            .sort((a, b) => {
              const aHasNews = newsData[a.stockId] && newsData[a.stockId].length > 0;
              const bHasNews = newsData[b.stockId] && newsData[b.stockId].length > 0;
              if (aHasNews && !bHasNews) return -1;
              if (!aHasNews && bHasNews) return 1;
              return 0;
            })
            .map((stock) => (
            <div
              key={stock.stockId}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
            >
              {/* 주식 정보 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {stock.stockName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stock.quantity}주 • {stock.holdingValue.toLocaleString()}원
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      stock.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {stock.profitLoss >= 0 ? "+" : ""}
                    {stock.profitLoss.toLocaleString()}원
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      stock.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {stock.profitLoss >= 0 ? "↑" : "↓"}{" "}
                    {stock.profitLoss >= 0 ? "+" : ""}
                    {((stock.profitLoss / (stock.holdingValue - stock.profitLoss)) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* 어제 뉴스 & 피드백 */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {newsData[stock.stockId] && newsData[stock.stockId].length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {newsData[stock.stockId].map((news, idx) => (
                      <div key={news.id} className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">📰</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">
                            어제 뉴스 {newsData[stock.stockId].length > 1 ? `${idx + 1}` : ""}
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {news.title || "제목 없음"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl flex-shrink-0">📰</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">어제 뉴스</p>
                      <p className="text-sm text-gray-600 italic">
                        어제 뉴스가 없어요
                      </p>
                    </div>
                  </div>
                )}

                {/* 뉴스가 있을 때만 피드백 표시 */}
                {newsData[stock.stockId] && newsData[stock.stockId].length > 0 && (
                  <div
                    className={`mt-3 pt-3 border-t border-gray-200 ${
                      stock.profitLoss >= 0
                        ? "bg-emerald-50 -mx-4 -mb-4 mt-3 p-4 rounded-b-2xl"
                        : "bg-amber-50 -mx-4 -mb-4 mt-3 p-4 rounded-b-2xl"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">
                        {stock.profitLoss >= 0 ? "✅" : "💭"}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-bold mb-1 ${
                            stock.profitLoss >= 0
                              ? "text-emerald-900"
                              : "text-amber-900"
                          }`}
                        >
                          {stock.profitLoss >= 0 ? "잘했어요!" : "다음 기회에!"}
                        </p>
                        <p
                          className={`text-xs ${
                            stock.profitLoss >= 0
                              ? "text-emerald-800"
                              : "text-amber-800"
                          }`}
                        >
                          {stock.profitLoss >= 0
                            ? "뉴스를 잘 읽고 좋은 투자를 했어요. 이런 분석을 계속해보세요!"
                            : "아쉽지만 괜찮아요. 다음엔 더 신중하게 분석해볼까요?"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 홈으로 돌아가기 */}
          <Link
            href="/"
            className="block bg-gray-100 text-gray-700 text-center py-3 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
