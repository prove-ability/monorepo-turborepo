"use client";

import { Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

import { getNewsByDay } from "@/actions/newsActions";
import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface ClassData {
  id: string;
  current_day: number;
  // 다른 클래스 속성들...
}

interface NewsClientProps {
  classData: ClassData;
}

export default function NewsClient({ classData }: NewsClientProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const newsData = await getNewsByDay(
          classData.id,
          classData.current_day
        );
        setNews(newsData);
      } catch (error) {
        console.error("뉴스 조회 실패:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [classData]);

  if (loading) {
    return (
      <div className="w-full min-h-screen p-4">
        <header className="flex items-center justify-between mb-4">
          <div className="h-6 w-6 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-6 w-6" />
        </header>
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <main className="flex-grow space-y-5 pb-24">
        <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl flex items-center gap-3">
          <Newspaper className="h-6 w-6 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">오늘의 뉴스</h2>
            <p className="text-base text-indigo-600 mt-1">
              뉴스는 주식 가격에 영향을 줘요.
            </p>
          </div>
        </div>

        {news.length > 0 ? (
          news.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {item.tags.map((tag) => (
                  <div
                    key={tag}
                    className="text-sm rounded-full flex items-center overflow-hidden"
                  >
                    <span className="bg-indigo-200 text-indigo-800 px-3 py-1 font-semibold">
                      뉴스
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 font-medium">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {item.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <p className="text-lg text-gray-500">오늘의 뉴스가 아직 없어요.</p>
            <p className="text-gray-400 mt-2">내일 다시 확인해주세요!</p>
            <p className="text-gray-400 mt-2">
              주식 가격에 영향을 줄 수 있는 뉴스를 확인하세요.
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/invest")}
          className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-lg mt-6 shadow-lg transition-transform active:scale-95"
        >
          투자하러 가기
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
