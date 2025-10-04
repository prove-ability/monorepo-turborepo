import { getCurrentDayNews } from "@/actions/news";
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

  const allNews = await getCurrentDayNews();
  
  // 현재 Day 추출 (모든 뉴스가 같은 Day)
  const currentDay = allNews[0]?.day || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">오늘의 뉴스</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Day {currentDay} · {allNews.length}개의 뉴스
          </p>
        </div>
      </header>

      <main className="px-4 py-6">
        {allNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">오늘의 뉴스가 아직 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allNews.map((news, index) => (
              <div
                key={news.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {news.content}
                    </p>
                    {news.relatedStocks && news.relatedStocks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {news.relatedStocks.map((stock) => (
                          <span
                            key={stock.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            📈 {stock.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
