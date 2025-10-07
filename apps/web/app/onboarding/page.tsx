"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp, Newspaper, Trophy, Wallet, X } from "lucide-react";

const slides = [
  {
    icon: <Wallet className="w-16 h-16 text-blue-600" />,
    title: "주식 투자 게임에 오신 것을 환영합니다!",
    description: "가상의 돈으로 실제 주식 시장처럼 투자를 경험해보세요.",
    details: [
      "매일 지원금을 받아 투자할 수 있어요",
      "실제 주식처럼 사고팔 수 있어요",
      "친구들과 수익률을 경쟁해보세요"
    ]
  },
  {
    icon: <TrendingUp className="w-16 h-16 text-green-600" />,
    title: "주식 거래하기",
    description: "투자 탭에서 원하는 주식을 사고팔 수 있습니다.",
    details: [
      "주식 목록에서 원하는 종목 선택",
      "수량을 입력하고 매수/매도 버튼 클릭",
      "내 보유 주식은 '보유 주식만' 필터로 확인"
    ]
  },
  {
    icon: <Newspaper className="w-16 h-16 text-orange-600" />,
    title: "뉴스로 시장 읽기",
    description: "매일 발표되는 뉴스를 확인하고 투자 전략을 세우세요.",
    details: [
      "뉴스는 주식 가격에 영향을 줘요",
      "관련 주식을 클릭하면 거래 화면으로 이동",
      "뉴스를 잘 읽고 투자하면 수익률이 올라가요"
    ]
  },
  {
    icon: <Trophy className="w-16 h-16 text-yellow-600" />,
    title: "랭킹에서 경쟁하기",
    description: "수익률을 기준으로 친구들과 경쟁해보세요!",
    details: [
      "상위 10명의 랭킹이 공개돼요",
      "내 순위와 수익률을 확인할 수 있어요",
      "최고 수익률을 목표로 도전해보세요"
    ]
  }
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const router = useRouter();
  const slide = slides[currentSlide]!;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/");
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/");
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Skip 버튼 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-white/50"
        >
          건너뛰기 <X className="w-4 h-4" />
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center"
            >
              {/* 아이콘 */}
              <motion.div
                className="flex justify-center mb-8"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {slide.icon}
              </motion.div>

              {/* 제목 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {slide.title}
              </h1>

              {/* 설명 */}
              <p className="text-gray-600 mb-8">
                {slide.description}
              </p>

              {/* 상세 정보 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <ul className="space-y-4 text-left">
                  {slide.details.map((detail, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6">
        <div className="max-w-md mx-auto">
          {/* 인디케이터 */}
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-blue-600" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {currentSlide === slides.length - 1 ? "시작하기" : "다음"}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
