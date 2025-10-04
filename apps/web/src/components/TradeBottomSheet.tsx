"use client";

import { useState, useTransition } from "react";
import { buyStock, sellStock } from "@/actions/trades";

interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  changeRate: number;
  change: number;
  marketCountryCode: "KR" | "US" | "JP" | "CN";
  holdingQuantity?: number;
}

interface TradeBottomSheetProps {
  stock: Stock | null;
  balance: number;
  currentDay: number;
  onClose: () => void;
  onTradeSuccess: () => void;
}

export default function TradeBottomSheet({
  stock,
  balance,
  currentDay,
  onClose,
  onTradeSuccess,
}: TradeBottomSheetProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<string>("1");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!stock) return null;

  const totalPrice = stock.currentPrice * parseInt(quantity || "0");
  const canAfford = totalPrice <= balance;
  const canSell = (stock.holdingQuantity || 0) >= parseInt(quantity || "0");

  const handleTrade = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setMessage({ type: "error", text: "수량을 입력해주세요." });
      return;
    }

    if (tradeType === "buy" && !canAfford) {
      setMessage({ type: "error", text: "잔액이 부족합니다." });
      return;
    }

    if (tradeType === "sell" && !canSell) {
      setMessage({ type: "error", text: "보유 수량이 부족합니다." });
      return;
    }

    startTransition(async () => {
      const result =
        tradeType === "buy"
          ? await buyStock(stock.id, qty, stock.currentPrice.toString(), currentDay)
          : await sellStock(stock.id, qty, stock.currentPrice.toString(), currentDay);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setTimeout(() => {
          onTradeSuccess();
          onClose();
        }, 1500);
      } else {
        // Day 불일치 에러 처리
        if (result.dayMismatch) {
          setMessage({ type: "error", text: result.message });
          // 2초 후 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setMessage({ type: "error", text: result.message });
        }
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{stock.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Current Price */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">현재가</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {stock.currentPrice.toLocaleString()}원
              </span>
              <span
                className={`text-sm ${
                  stock.changeRate === 0
                    ? "text-gray-500"
                    : stock.changeRate > 0
                      ? "text-red-600"
                      : "text-blue-600"
                }`}
              >
                {stock.changeRate === 0
                  ? "-"
                  : stock.changeRate > 0
                    ? "▲"
                    : "▼"}{" "}
                {Math.abs(stock.change).toLocaleString()}원 (
                {stock.changeRate === 0 ? "0.00" : Math.abs(stock.changeRate).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Buy/Sell Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTradeType("buy")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                tradeType === "buy"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              매수
            </button>
            <button
              onClick={() => setTradeType("sell")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                tradeType === "sell"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              매도
            </button>
          </div>

          {/* Balance/Holdings Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            {tradeType === "buy" ? (
              <div className="flex justify-between">
                <span className="text-gray-600">잔액</span>
                <span className="font-semibold">
                  {balance.toLocaleString()}원
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">보유 수량</span>
                <span className="font-semibold">
                  {stock.holdingQuantity || 0}주
                </span>
              </div>
            )}
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {tradeType === "buy" ? "매수" : "매도"} 수량
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="수량 입력"
            />
          </div>

          {/* Total Price */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                총 {tradeType === "buy" ? "매수" : "매도"} 금액
              </span>
              <span className="font-bold text-lg">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
            {tradeType === "buy" && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>잔액 - 매수금액</span>
                <span className={canAfford ? "text-green-600" : "text-red-600"}>
                  {(balance - totalPrice).toLocaleString()}원
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Trade Button */}
          <button
            onClick={handleTrade}
            disabled={
              isPending ||
              !quantity ||
              parseInt(quantity) <= 0 ||
              (tradeType === "buy" && !canAfford) ||
              (tradeType === "sell" && !canSell)
            }
            className={`w-full py-4 rounded-lg font-bold text-white transition-colors ${
              isPending ||
              !quantity ||
              parseInt(quantity) <= 0 ||
              (tradeType === "buy" && !canAfford) ||
              (tradeType === "sell" && !canSell)
                ? "bg-gray-300 cursor-not-allowed"
                : tradeType === "buy"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isPending ? "처리 중..." : tradeType === "buy" ? "매수" : "매도"}
          </button>
        </div>
      </div>
    </>
  );
}
