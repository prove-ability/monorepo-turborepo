import { getAllNews } from "@/actions/news";
import { getSession } from "@/lib/session";
import { checkNeedsSetup } from "@/actions/profile";
import { redirect } from "next/navigation";
import { Newspaper } from "lucide-react";

export default async function NewsPage() {
  const user = await getSession();

  // 미들웨어에서 이미 검증했지만 타입 안정성을 위해 체크
  if (!user) {
    redirect("/login");
  }

  // setup이 필요한지 확인
  const setupStatus = await checkNeedsSetup();
  if (setupStatus.needsSetup) {
    redirect("/setup");
  }

  const allNews = await getAllNews();

  // Day별로 그룹화
  const newsByDay = allNews.reduce(
    (acc: Record<number, typeof allNews>, newsItem) => {
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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">뉴스</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            전체 {allNews.length}개의 뉴스
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        {allNews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">뉴스가 없습니다</p>
          </div>
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
      </main>
    </div>
  );
}
