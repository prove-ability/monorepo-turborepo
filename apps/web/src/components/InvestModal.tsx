"use client";

import { Stock } from "./InvestClient";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

interface InvestModalProps {
  stock: Stock | null;
  isOwned: boolean;
  onClose: () => void;
  onBuy: () => void;
  onSell: () => void;
}

export function InvestModal({
  stock,
  isOwned,
  onClose,
  onBuy,
  onSell,
}: InvestModalProps) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useDrag(
    ({
      down,
      movement: [, my],
    }: {
      down: boolean;
      movement: [number, number];
    }) => {
      if (!down && my > 100) {
        onClose();
      } else {
        api.start({ y: down ? my : 0, immediate: down });
      }
    },
    {
      axis: "y",
      from: () => [0, y.get()],
      bounds: { top: 0 },
      rubberband: true,
    }
  );

  if (!stock) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <animated.div
        {...bind()}
        style={{ y }}
        className="bg-white w-full p-4 rounded-t-lg touch-none pb-screen max-w-xl mx-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-4">{stock.name}, 어떻게 할까요?</h3>
        <div className={`grid ${isOwned ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
          <button
            onClick={onBuy}
            className="w-full bg-red-500 text-white p-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
          >
            살래요 (매수)
          </button>
          {isOwned && (
            <button
              onClick={onSell}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
            >
              팔래요 (매도)
            </button>
          )}
        </div>
      </animated.div>
    </div>
  );
}
