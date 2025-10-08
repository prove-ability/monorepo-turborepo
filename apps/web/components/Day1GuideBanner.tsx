"use client";

import Link from "next/link";

interface Day1GuideBannerProps {
  currentDay: number;
}

export default function Day1GuideBanner({ currentDay }: Day1GuideBannerProps) {
  // Day 1이 아니면 표시하지 않음
  if (currentDay !== 1) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">오늘의 미션</h3>
        <p className="text-sm text-gray-600">200만원 지원금으로 투자를 시작해보세요</p>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
          <span className="text-sm text-gray-700">뉴스 읽고 투자 종목 골라보기</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
          <span className="text-sm text-gray-700">마음에 드는 주식 사보기</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
          <div className="text-sm text-gray-900 font-bold">
            <span className="text-emerald-700">내일 오전 9시</span>에 결과와 랭킹 확인하기
          </div>
        </div>
      </div>
      
      <Link
        href="/news"
        className="inline-block bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-800 active:scale-95 transition-all w-full text-center"
      >
        뉴스 보러가기 →
      </Link>
    </div>
  );
}
