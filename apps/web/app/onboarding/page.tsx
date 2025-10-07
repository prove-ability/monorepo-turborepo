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
    ],
    preview: "💰 지갑에서 잔액 확인 → 📈 투자 탭에서 거래 → 📰 뉴스로 시장 파악 → 🏆 랭킹에서 경쟁"
  },
  {
    icon: <TrendingUp className="w-16 h-16 text-green-600" />,
    title: "이제 시작해볼까요?",
    description: "실제 화면을 보면서 하나씩 배워봐요!",
    details: [
      "각 기능을 직접 사용하면서 배울 수 있어요",
      "언제든 건너뛸 수 있어요",
      "준비되면 시작하기를 눌러주세요"
    ],
    preview: "✨ 다음 화면에서 상세한 가이드를 시작합니다"
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
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
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
                
                {/* 프리뷰 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-4 border-t border-gray-100"
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {slide.preview}
                  </p>
                </motion.div>
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
