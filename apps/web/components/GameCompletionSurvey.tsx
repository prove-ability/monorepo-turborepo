"use client";

import { useState, useEffect } from "react";
import { Award, Star } from "lucide-react";
import { submitSurvey } from "@/actions/survey";
import { useRouter } from "next/navigation";

interface GameCompletionSurveyProps {
  currentDay: number;
  totalDays: number;
}

export default function GameCompletionSurvey({
  currentDay,
  totalDays,
}: GameCompletionSurveyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const surveyCompleted = localStorage.getItem("surveyCompleted");
    const gameEndModalShown = localStorage.getItem("gameEndModalShown");
    
    // 게임 완료 모달을 본 후 설문 표시
    if (currentDay >= totalDays && totalDays > 0 && gameEndModalShown && !surveyCompleted) {
      setIsOpen(true);
    }
  }, [currentDay, totalDays]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("별점을 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await submitSurvey({ rating, feedback });
      
      if (result.success) {
        localStorage.setItem("surveyCompleted", "true");
        setIsOpen(false);
        router.push("/ranking");
      } else {
        setError(result.error || "제출 실패");
      }
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("surveyCompleted", "true");
    setIsOpen(false);
    router.push("/ranking");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* 중앙 팝업 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              게임 완료! 🎉
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              게임이 어땠나요? 짧은 설문에 참여해주세요
            </p>
            
            {/* 별점 (1-10점, 별 5개) */}
            <div className="mb-6 w-full">
              <p className="text-sm font-medium text-gray-700 mb-3">
                게임 만족도 (10점 만점)
              </p>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <div key={starIndex} className="relative w-12 h-12">
                    {/* 왼쪽 반 (홀수 점수) */}
                    <button
                      type="button"
                      className="absolute left-0 w-6 h-12 z-10"
                      onClick={() => setRating(starIndex * 2 - 1)}
                      onMouseEnter={() => setHoverRating(starIndex * 2 - 1)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                    {/* 오른쪽 반 (짝수 점수) */}
                    <button
                      type="button"
                      className="absolute right-0 w-6 h-12 z-10"
                      onClick={() => setRating(starIndex * 2)}
                      onMouseEnter={() => setHoverRating(starIndex * 2)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                    
                    {/* 별 아이콘 */}
                    <Star
                      className={`w-12 h-12 absolute inset-0 transition-colors ${
                        (hoverRating || rating) >= starIndex * 2
                          ? "fill-yellow-400 text-yellow-400"
                          : (hoverRating || rating) >= starIndex * 2 - 1
                            ? "fill-yellow-400 text-gray-300"
                            : "text-gray-300"
                      }`}
                      style={{
                        clipPath: (hoverRating || rating) >= starIndex * 2 - 1 && (hoverRating || rating) < starIndex * 2
                          ? "inset(0 50% 0 0)"
                          : "none"
                      }}
                    />
                    {/* 반쪽 별 백그라운드 */}
                    {(hoverRating || rating) >= starIndex * 2 - 1 && (hoverRating || rating) < starIndex * 2 && (
                      <Star className="w-12 h-12 absolute inset-0 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {rating > 0 ? `${rating}점` : "별을 클릭해주세요"}
              </p>
            </div>
            
            {/* 한 줄 소감 */}
            <div className="mb-6 w-full">
              <p className="text-sm font-medium text-gray-700 mb-2 text-left">
                한 줄 소감 (선택)
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="게임에 대한 소감을 자유롭게 적어주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {feedback.length}/200
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}
            
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "제출 중..." : "제출하고 랭킹 보기"}
              </button>
              
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
