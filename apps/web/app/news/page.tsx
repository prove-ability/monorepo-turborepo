import { getNewsByClass } from "@/actions/news";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Calendar, Newspaper } from "lucide-react";

export default async function NewsPage() {
  const user = await getSession();

  // 미들웨어에서 이미 검증했지만 타입 안정성을 위해 체크
  if (!user) {
    redirect("/login");
  }

  const allNews = await getNewsByClass();

  // Day별로 뉴스 그룹화
  const newsByDay = allNews.reduce(
    (acc, news) => {
      const day = news.day || 0;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(news);
      return acc;
    },
    {} as Record<number, typeof allNews>
  );

  const days = Object.keys(newsByDay)
    .map(Number)
    .sort((a, b) => b - a); // 최신 Day부터 표시

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">뉴스</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {user.name}님의 클래스 뉴스
          </p>
        </div>
      </header>

      <main className="px-4 py-6">
        {days.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">아직 등록된 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day} className="space-y-3">
                {/* Day 헤더 */}
                <div className="flex items-center gap-2 sticky top-16 bg-gray-50 py-2 z-5">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Day {day}</h2>
                  <span className="text-sm text-gray-500">
                    ({newsByDay[day]?.length || 0}개의 뉴스)
                  </span>
                </div>

                {/* 뉴스 카드들 */}
                <div className="space-y-3">
                  {newsByDay[day]?.map((news, index) => (
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
                          {news.relatedStocks &&
                            news.relatedStocks.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {news.relatedStocks.map((stock: any) => (
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
