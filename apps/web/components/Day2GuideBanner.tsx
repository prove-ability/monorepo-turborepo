"use client";

interface Day2GuideBannerProps {
  currentDay: number;
}

export default function Day2GuideBanner({ currentDay }: Day2GuideBannerProps) {
  // Day 2 미만이면 표시하지 않음
  if (currentDay < 2) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">오늘의 미션</h3>
        <p className="text-sm text-gray-600">어제 결과를 확인하고 새로운 전략을 세워보세요</p>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
          <span className="text-sm text-gray-700">어제 결과 확인하기</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
          <span className="text-sm text-gray-700">주식 더 사보기 (지원금 +10만원)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
          <span className="text-sm text-gray-700">떨어질 것 같은 주식 팔아보기</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-emerald-600 text-white rounded-lg w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">4</span>
          <div className="text-sm text-gray-900 font-bold">
            <span className="text-emerald-700">내일 오전 9시</span>에 결과와 랭킹 확인하기
          </div>
        </div>
      </div>
    </div>
  );
}
