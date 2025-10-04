import { getCurrentDayNews } from "@/actions/news";
import { getSession } from "@/lib/session";
import { checkNeedsSetup } from "@/actions/profile";
import { redirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import NewsList from "@/src/components/NewsList";

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
        <NewsList news={allNews} currentDay={currentDay} />
      </main>
    </div>
  );
}
