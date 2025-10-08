"use client";

import { useState, useEffect } from "react";
import { Award } from "lucide-react";

interface GameCompletionSurveyProps {
  currentDay: number;
  maxDay: number;
}

export default function GameCompletionSurvey({
  currentDay,
  maxDay,
}: GameCompletionSurveyProps) {
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    // 게임이 완료되었는지 확인
    const surveyCompleted = localStorage.getItem("surveyCompleted");
    
    // 게임이 완료되고 아직 설문조사를 완료하지 않았으면 표시
    if (currentDay >= maxDay && !surveyCompleted) {
      setShowSurvey(true);
    }
  }, [currentDay, maxDay]);

  const handleOpenSurvey = () => {
    // 설문조사 링크 열기 (실제 설문조사 URL로 변경 필요)
    window.open("https://forms.google.com/your-survey-link", "_blank");
    localStorage.setItem("surveyCompleted", "true");
    setShowSurvey(false);
  };

  const handleCloseSurvey = () => {
    localStorage.setItem("surveyCompleted", "true");
    setShowSurvey(false);
  };

  if (!showSurvey) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* 중앙 팝업 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform transition-all duration-300 scale-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              게임을 완료했어요! 🎉
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              투자 게임에 참여해주셔서 감사합니다!<br />
              짧은 설문조사에 참여해주시겠어요?
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleOpenSurvey}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-700 hover:to-orange-800 transition-all active:scale-95 shadow-lg"
              >
                설문조사 참여하기
              </button>
              
              <button
                onClick={handleCloseSurvey}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                다음에 하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
