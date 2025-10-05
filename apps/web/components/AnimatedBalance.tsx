"use client";

import { useEffect, useState } from "react";

interface AnimatedBalanceProps {
  balance: number;
  benefit: {
    amount: number;
    day: number;
    createdAt: Date;
  } | null;
}

export default function AnimatedBalance({
  balance,
  benefit,
}: AnimatedBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [showIncrease, setShowIncrease] = useState(false);

  useEffect(() => {
    if (!benefit) {
      setDisplayBalance(balance);
      return;
    }

    // localStorage에서 확인한 지원금 정보 가져오기
    const confirmedBenefits = JSON.parse(
      localStorage.getItem("confirmedBenefits") || "[]"
    );

    const benefitId = `${benefit.day}-${new Date(benefit.createdAt).getTime()}`;
    const isConfirmed = confirmedBenefits.includes(benefitId);

    // 아직 확인하지 않은 지원금이면 애니메이션 실행
    if (!isConfirmed) {
      const startBalance = balance - benefit.amount;
      const duration = 1500; // 1.5초
      const steps = 60;
      const increment = benefit.amount / steps;
      let currentStep = 0;

      setDisplayBalance(startBalance);
      setShowIncrease(true);

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayBalance(balance);
          clearInterval(timer);
          setTimeout(() => setShowIncrease(false), 2000);
        } else {
          setDisplayBalance(startBalance + increment * currentStep);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayBalance(balance);
    }
  }, [balance, benefit]);

  return (
    <div className="relative">
      <p className="text-lg font-semibold">
        {Math.round(displayBalance).toLocaleString()}원
      </p>
      {showIncrease && benefit && (
        <div className="absolute -top-6 right-0 text-yellow-300 font-bold text-sm animate-bounce">
          +{benefit.amount.toLocaleString()}원
        </div>
      )}
    </div>
  );
}
