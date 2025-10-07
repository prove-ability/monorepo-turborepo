"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useTour() {
  useEffect(() => {
    const tourCompleted = localStorage.getItem("tour_completed");
    const onboardingCompleted = localStorage.getItem("onboarding_completed");

    if (!tourCompleted && onboardingCompleted) {
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, []);

  const startTour = () => {
    let currentStep = 0;
    const totalSteps = 4;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "#wallet-balance",
          popover: {
            title: "💰 내 지갑",
            description: "현재 보유한 현금과 총 자산을 확인할 수 있어요. 매일 지원금을 받아 투자하세요!",
            side: "bottom",
            align: "center"
          }
        },
        {
          element: "#nav-invest",
          popover: {
            title: "📈 투자 탭",
            description: "여기서 주식을 사고 팔 수 있어요. 원하는 주식을 클릭하면 거래 화면이 열립니다.",
            side: "top",
            align: "center"
          }
        },
        {
          element: "#nav-news",
          popover: {
            title: "📰 뉴스 탭",
            description: "매일 새로운 뉴스가 발표돼요. 뉴스는 주식 가격에 영향을 주니 잘 읽어보세요!",
            side: "top",
            align: "center"
          }
        },
        {
          element: "#nav-ranking",
          popover: {
            title: "🏆 랭킹 탭",
            description: "친구들과 수익률을 비교해보세요. 상위 10명의 랭킹이 공개됩니다!",
            side: "top",
            align: "center"
          }
        }
      ],
      nextBtnText: "다음",
      prevBtnText: "이전",
      doneBtnText: "완료",
      onNextClick: () => {
        currentStep++;
        driverObj.moveNext();
      },
      onPrevClick: () => {
        currentStep--;
        driverObj.movePrevious();
      },
      onCloseClick: () => {
        driverObj.destroy();
      },
      onDestroyStarted: () => {
        if (currentStep >= totalSteps - 1) {
          localStorage.setItem("tour_completed", "true");
        }
      }
    });

    driverObj.drive();
  };

  return { startTour };
}
