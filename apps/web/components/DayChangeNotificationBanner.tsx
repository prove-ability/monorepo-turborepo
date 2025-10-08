"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface DayChangeNotificationBannerProps {
  currentDay: number;
}

export default function DayChangeNotificationBanner({
  currentDay,
}: DayChangeNotificationBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // localStorage에서 마지막으로 확인한 Day 가져오기
    const lastSeenDay = localStorage.getItem("lastSeenDay");
    const lastSeenDayNum = lastSeenDay ? parseInt(lastSeenDay, 10) : 0;

    // Day가 변경되었으면 배너 표시
    if (currentDay > lastSeenDayNum && lastSeenDayNum > 0) {
      setShowBanner(true);
    } else {
      // 현재 Day 저장
      localStorage.setItem("lastSeenDay", currentDay.toString());
    }
  }, [currentDay]);

  const handleConfirm = () => {
    localStorage.setItem("lastSeenDay", currentDay.toString());
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* 중앙 팝업 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform transition-all duration-300 scale-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Day {currentDay}가 시작되었어요! 🎉
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              투자 결과를 확인하고 새로운 투자를 시작하세요!
            </p>
            
            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all active:scale-95 shadow-lg"
            >
              확인하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
