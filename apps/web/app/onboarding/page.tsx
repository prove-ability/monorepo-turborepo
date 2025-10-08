"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "투자 게임에 오신 걸 환영해요! 🎉",
    description: "이 게임을 하면서 이런 능력을 키울 수 있어요",
    details: [
      { text: "뉴스를 읽고 핵심 정보를 파악하는 힘이 생겨요", highlight: ["핵심 정보"] },
      { text: "경제 용어와 분산투자 개념을 이해하게 돼요", highlight: ["경제 용어", "분산투자"] },
      { text: "실전처럼 투자를 연습하며 감각을 키워요", highlight: ["실전", "감각"] }
    ]
  },
  {
    title: "게임은 이렇게 진행돼요",
    description: "매일 새로운 뉴스와 함께 투자 기회가 찾아와요",
    details: [
      { text: "게임 시작하면 200만원 + 매일 10만원을 받아요", highlight: ["200만원", "매일 10만원"] },
      { text: "뉴스를 읽고 주식을 사거나 팔아요", highlight: ["뉴스"] },
      { text: "투자 결과는 다음날 오전 9시에 확인해요", highlight: ["다음날 오전 9시"] },
      { text: "랭킹에서 친구들과 겨뤄봐요", highlight: ["랭킹"] }
    ]
  },
  {
    title: "준비되셨나요?",
    description: "지금부터 투자 세계로 떠나봐요!",
    details: [
      { text: "실제 화면을 보면서 하나씩 배울 수 있어요", highlight: [] },
      { text: "어려우면 언제든 도움말을 확인하세요", highlight: [] },
      { text: "준비되면 시작하기를 눌러주세요", highlight: [] }
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
    console.log("Onboarding completed, localStorage set:", localStorage.getItem("onboarding_completed"));
    router.push("/");
  };


  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 flex flex-col">
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
              {/* 제목 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {slide.title}
              </h1>

              {/* 설명 */}
              <p className="text-base text-gray-600 mb-8">
                {slide.description}
              </p>

              {/* 상세 정보 */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-4">
                <ul className="space-y-4 text-left">
                  {slide.details.map((detail, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-700 text-sm font-semibold">{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-700">
                        {typeof detail === 'string' ? detail : (
                          <>
                            {detail.text.split(new RegExp(`(${detail.highlight.join('|')})`)).map((part, i) => 
                              detail.highlight.includes(part) ? (
                                <strong key={i} className="text-emerald-700 font-semibold">{part}</strong>
                              ) : part
                            )}
                          </>
                        )}
                      </span>
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
                  index === currentSlide ? "w-8 bg-emerald-600" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-emerald-200 text-gray-700 font-semibold hover:bg-emerald-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
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
