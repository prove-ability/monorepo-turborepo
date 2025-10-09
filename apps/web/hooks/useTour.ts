"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// 커스텀 스타일 추가
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .driver-popover {
      border-radius: 1.5rem !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      border: 1px solid #d1fae5 !important;
    }
    
    .driver-popover-title {
      font-size: 1.125rem !important;
      font-weight: 700 !important;
      color: #111827 !important;
      margin-bottom: 0.75rem !important;
    }
    
    .driver-popover-description {
      font-size: 0.875rem !important;
      line-height: 1.5 !important;
      color: #4b5563 !important;
    }
    
    .driver-popover-next-btn,
    .driver-popover-prev-btn {
      background-color: #059669 !important;
      color: white !important;
      border-radius: 0.75rem !important;
      padding: 0.625rem 1.25rem !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      border: none !important;
      transition: all 0.2s !important;
      text-shadow: none !important;
    }
    
    .driver-popover-next-btn:hover,
    .driver-popover-prev-btn:hover {
      background-color: #047857 !important;
      transform: scale(0.98) !important;
    }
    
    .driver-popover-prev-btn {
      background-color: transparent !important;
      color: #6b7280 !important;
      border: 2px solid #d1fae5 !important;
    }
    
    .driver-popover-prev-btn:hover {
      background-color: #d1fae5 !important;
      color: #047857 !important;
    }
    
    .driver-popover-close-btn {
      color: #6b7280 !important;
      font-size: 1.5rem !important;
    }
    
    .driver-popover-close-btn:hover {
      color: #059669 !important;
    }
    
    .driver-popover-progress-text {
      color: #059669 !important;
      font-weight: 600 !important;
      font-size: 0.75rem !important;
    }
  `;

  if (!document.getElementById("driver-custom-styles")) {
    style.id = "driver-custom-styles";
    document.head.appendChild(style);
  }
}

export function useTour(isReady: boolean = false) {
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const tourCompleted = localStorage.getItem("tour_completed");
    const onboardingCompleted = localStorage.getItem("onboarding_completed");

    // 온보딩 완료 후 투어를 1회만 보여줌
    if (!tourCompleted && onboardingCompleted) {
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, [isReady]);

  const startTour = () => {
    let currentStep = 0;
    const totalSteps = 7;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous"],
      allowClose: false, // 닫기 버튼 제거
      disableActiveInteraction: true, // 하이라이트된 요소와 상호작용 방지
      steps: [
        {
          element: "#wallet-balance",
          popover: {
            title: "💰 내 지갑",
            description:
              "현재 보유한 현금과 총 자산을 확인할 수 있어요. 매일 지원금을 받아 투자하세요!",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#nav-news",
          popover: {
            title: "📰 뉴스 탭",
            description:
              "매일 새로운 뉴스가 발표돼요. 뉴스를 먼저 확인하고 투자 전략을 세우세요!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#nav-invest",
          popover: {
            title: "📈 투자 탭",
            description: "여기를 눌러서 주식을 사고팔 수 있어요!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#stock-list",
          popover: {
            title: "📊 종목 목록",
            description:
              "여기서 다양한 주식을 확인할 수 있어요. 📰 뉴스가 있는 주식은 가격이 크게 변동됩니다!",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#first-stock-card",
          popover: {
            title: "🛒 종목 카드",
            description:
              "종목 카드를 눌러볼게요. 살래요/팔래요 화면이 나타납니다!",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#trade-modal",
          popover: {
            title: "💰 살래요 / 팔래요",
            description:
              "살래요를 누르면 주식을 사고, 팔래요를 누르면 주식을 팔 수 있어요. 수량을 입력하고 버튼을 누르면 완료!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#nav-ranking",
          popover: {
            title: "🏆 랭킹 탭",
            description:
              "친구들과 수익률을 비교해보세요. 상위 10명의 랭킹이 공개됩니다!",
            side: "top",
            align: "center",
          },
        },
      ],
      nextBtnText: "다음",
      prevBtnText: "이전",
      doneBtnText: "완료",
      onNextClick: () => {
        currentStep++;
        if (currentStep >= totalSteps) {
          localStorage.setItem("tour_completed", "true");
          localStorage.removeItem("tour_step");
          driverObj.destroy();
          // 투어 완료 후 홈으로 이동
          window.location.href = "/";
        } else if (currentStep === 2) {
          // Step 2: 투자 탭 클릭 후 이동
          localStorage.setItem("tour_step", currentStep.toString());
          driverObj.destroy();
          window.location.href = "/invest";
        } else if (currentStep === 5) {
          // Step 5: 모달 단계로 가기 전에 종목 카드 자동 클릭
          const firstCard = document.querySelector(
            "#first-stock-card"
          ) as HTMLElement;
          if (firstCard) {
            firstCard.click();
            // 모달이 열릴 때까지 대기 후 다음 단계로
            setTimeout(() => {
              driverObj.moveNext();
            }, 600);
          } else {
            driverObj.moveNext();
          }
        } else if (currentStep === 6) {
          // Step 6: 모달 하이라이트 후 → 랭킹 탭으로 가기 전에 모달 닫기
          // 모달의 닫기 버튼 찾아서 클릭 (rounded-full을 가진 button)
          const tradeModal = document.querySelector("#trade-modal");
          if (tradeModal) {
            const closeButton = tradeModal.querySelector(
              "button.rounded-full"
            ) as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          }

          // 모달이 닫힐 때까지 대기 후 다음 단계로
          setTimeout(() => {
            driverObj.moveNext();
          }, 400);
        } else {
          driverObj.moveNext();
        }
      },
      onPrevClick: () => {
        // /invest 페이지에서 Step 3 이하일 때 이전을 누르면 홈으로 돌아가기
        if (currentStep <= 3 && window.location.pathname === "/invest") {
          currentStep--;
          localStorage.setItem("tour_step", currentStep.toString());
          driverObj.destroy();
          window.location.href = "/";
        } else {
          currentStep--;
          driverObj.movePrevious();
        }
      },
    });

    // 저장된 단계가 있으면 해당 단계부터 시작
    const savedStep = localStorage.getItem("tour_step");
    if (savedStep) {
      const stepNum = parseInt(savedStep, 10);
      currentStep = stepNum;
      localStorage.removeItem("tour_step");

      // 페이지 로드 대기 후 투어 시작
      setTimeout(() => {
        driverObj.drive(stepNum);
      }, 500);
    } else {
      driverObj.drive();
    }
  };

  return { startTour };
}
