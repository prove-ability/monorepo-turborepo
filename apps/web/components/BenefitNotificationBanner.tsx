"use client";

import { useState, useEffect } from "react";

interface BenefitNotificationBannerProps {
  benefit: {
    amount: number;
    day: number;
    createdAt: Date;
  } | null;
}

export default function BenefitNotificationBanner({
  benefit,
}: BenefitNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!benefit) return;

    // localStorage에서 확인한 지원금 정보 가져오기
    const confirmedBenefits = JSON.parse(
      localStorage.getItem("confirmedBenefits") || "[]"
    );

    // 이미 확인한 지원금인지 체크 (Day + 시간으로 고유 식별)
    const benefitId = `${benefit.day}-${new Date(benefit.createdAt).getTime()}`;
    const isConfirmed = confirmedBenefits.includes(benefitId);

    if (!isConfirmed) {
      setIsVisible(true);
    }
  }, [benefit]);

  const handleConfirm = () => {
    if (!benefit) return;

    const benefitId = `${benefit.day}-${new Date(benefit.createdAt).getTime()}`;
    const confirmedBenefits = JSON.parse(
      localStorage.getItem("confirmedBenefits") || "[]"
    );
    
    // 확인한 지원금 목록에 추가
    confirmedBenefits.push(benefitId);
    localStorage.setItem("confirmedBenefits", JSON.stringify(confirmedBenefits));
    
    setIsVisible(false);
  };

  // Day 1이거나 benefit이 없거나 보이지 않으면 표시하지 않음
  if (!benefit || !isVisible || benefit.day === 1) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-md animate-slide-down">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h3 className="font-bold text-green-900 text-lg">
              Day {benefit.day} 지원금 지급!
            </h3>
            <p className="text-green-700 text-sm">
              <span className="font-bold text-xl">
                {benefit.amount.toLocaleString()}원
              </span>
              이 잔액에 자동 입금되었습니다
            </p>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
        >
          확인
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
