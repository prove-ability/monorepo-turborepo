"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameEndModalProps {
  currentDay: number;
  totalDays: number;
}

export default function GameEndModal({
  currentDay,
  totalDays,
}: GameEndModalProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 게임이 종료되었는지 확인
    const modalShown = localStorage.getItem("gameEndModalShown");

    // 게임이 완료되고 아직 모달을 보지 않았으면 표시
    if (currentDay > totalDays && !modalShown) {
      setShowModal(true);
    }
  }, [currentDay, totalDays]);

  const handleConfirm = () => {
    localStorage.setItem("gameEndModalShown", "true");
    setShowModal(false);
    // 랭킹 페이지로 이동
    router.push("/ranking");
  };

  const handleLater = () => {
    localStorage.setItem("gameEndModalShown", "true");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />

      {/* 중앙 팝업 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              투자 게임 종료
            </h2>

            <div className="space-y-4 mb-6 text-left w-full bg-emerald-50 rounded-2xl p-5">
              <p className="text-lg text-emerald-900 font-bold">
                🎉 {totalDays}일간의 투자 끝!
              </p>

              <p className="text-sm text-emerald-800 leading-relaxed">
                뉴스 읽는 법, 주가 흐름, 위험 관리까지 배웠어요!
              </p>

              <p className="text-sm text-emerald-800 leading-relaxed">
                투자는 단순히 돈 버는 게 아니라 정보를 읽고 판단하는 거예요.
              </p>

              <p className="text-base text-emerald-900 font-bold">
                많이 배웠죠? 친구들과 내 실력을 비교해봐요!
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleConfirm}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all active:scale-95 shadow-lg"
              >
                랭킹 확인하기
              </button>

              <button
                onClick={handleLater}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                다음에
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
