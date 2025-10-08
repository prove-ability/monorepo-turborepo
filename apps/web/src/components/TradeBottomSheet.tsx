"use client";

import { useState } from "react";
import { buyStock, sellStock } from "@/actions/trades";
import { useToast } from "@/contexts/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import BottomSheet from "@/components/BottomSheet";

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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Trade mutation (optimistic update 제거 - 서버 응답 후 업데이트)
  const tradeMutation = useMutation({
    mutationFn: async ({
      type,
      stockId,
      qty,
      price,
    }: {
      type: "buy" | "sell";
      stockId: string;
      qty: number;
      price: string;
    }) => {
      return type === "buy"
        ? await buyStock(stockId, qty, price, currentDay)
        : await sellStock(stockId, qty, price, currentDay);
    },
    onSuccess: (result) => {
      if (result.success) {
        // 성공 시 최종 데이터 갱신
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });

        // 큰 성공 모달 표시
        setShowSuccess(true);

        // 2초 후 자동으로 닫기
        setTimeout(() => {
          setShowSuccess(false);
          onTradeSuccess();
          onClose();
        }, 2000);
      } else {
        // Day 불일치 에러 처리
        if (result.dayMismatch) {
          showToast(result.message + " 페이지를 새로고침합니다.", "warning");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setMessage({ type: "error", text: result.message });
        }
        // 실패 시에도 데이터 갱신 (서버 상태와 동기화)
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });

  if (!stock) return null;

  const totalPrice = stock.currentPrice * parseInt(quantity || "0");
  const canAfford = totalPrice <= balance;
  const canSell = (stock.holdingQuantity || 0) >= parseInt(quantity || "0");

  const handleTradeClick = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setMessage({ type: "error", text: "수량을 입력해주세요." });
      return;
    }

    if (tradeType === "buy" && !canAfford) {
      setMessage({
        type: "error",
        text: "돈이 부족해요. 남은 돈을 확인해주세요!",
      });
      return;
    }

    if (tradeType === "sell" && !canSell) {
      setMessage({
        type: "error",
        text: "주식이 부족해요. 가진 수량을 확인해주세요!",
      });
      return;
    }

    // 확인 화면 표시
    setShowConfirm(true);
  };

  const handleConfirmTrade = () => {
    const qty = parseInt(quantity);

    // Optimistic Updates 실행
    tradeMutation.mutate({
      type: tradeType,
      stockId: stock.id,
      qty,
      price: stock.currentPrice.toString(),
    });
    setShowConfirm(false);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const headerContent = (
    <div>
      <h3 className="font-bold text-lg text-white mb-2">{stock.name}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-white">
          {stock.currentPrice.toLocaleString()}원
        </span>
        <span
          className={`text-sm font-medium ${
            stock.changeRate === 0
              ? "text-emerald-200"
              : stock.changeRate > 0
                ? "text-red-300"
                : "text-blue-300"
          }`}
        >
          {stock.changeRate === 0 ? "-" : stock.changeRate > 0 ? "▲" : "▼"}{" "}
          {Math.abs(stock.change).toLocaleString()}원 (
          {stock.changeRate === 0
            ? "0.00"
            : Math.abs(stock.changeRate).toFixed(2)}
          %)
        </span>
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={!!stock}
      onClose={onClose}
      headerContent={headerContent}
      maxHeight="66.67vh"
    >
      <div className="px-0">
        {/* Buy/Sell Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTradeType("buy")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              tradeType === "buy"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            살래요
          </button>
          <button
            onClick={() => setTradeType("sell")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              tradeType === "sell"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            팔래요
          </button>
        </div>

        {/* Balance/Holdings Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          {tradeType === "buy" ? (
            <div className="flex justify-between">
              <span className="text-gray-600">지금 가진 돈</span>
              <span className="font-bold">{balance.toLocaleString()}원</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">내가 가진 주식</span>
              <span className="font-bold">{stock.holdingQuantity || 0}주</span>
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">
            {tradeType === "buy" ? "사고 싶은" : "팔고 싶은"} 수량
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="수량 입력"
          />
        </div>

        {/* Total Price */}
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">총 금액</span>
            <span className="font-bold text-lg text-gray-900">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
          {tradeType === "buy" && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>구매 후 잔액</span>
              <span
                className={
                  canAfford
                    ? "text-emerald-700 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {(balance - totalPrice).toLocaleString()}원
              </span>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Trade Button */}
        <button
          onClick={handleTradeClick}
          disabled={
            tradeMutation.isPending ||
            !quantity ||
            parseInt(quantity) <= 0 ||
            (tradeType === "buy" && !canAfford) ||
            (tradeType === "sell" && !canSell)
          }
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            tradeMutation.isPending ||
            !quantity ||
            parseInt(quantity) <= 0 ||
            (tradeType === "buy" && !canAfford) ||
            (tradeType === "sell" && !canSell)
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98]"
          }`}
        >
          {tradeMutation.isPending
            ? "처리 중..."
            : tradeType === "buy"
              ? "살래요!"
              : "팔래요!"}
        </button>

        {/* Confirmation Overlay */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {tradeType === "buy" ? "매수 확인" : "매도 확인"}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">종목</span>
                  <span className="font-bold text-gray-900">{stock.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">가격</span>
                  <span className="font-bold text-gray-900">
                    {stock.currentPrice.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">수량</span>
                  <span className="font-bold text-gray-900">{quantity}주</span>
                </div>
                <div className="flex justify-between py-3 bg-emerald-50 -mx-2 px-4 rounded-lg">
                  <span className="text-gray-900 font-medium">총 금액</span>
                  <span className="font-bold text-lg text-emerald-700">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                {tradeType === "buy"
                  ? "이 주식을 매수하시겠습니까?"
                  : "이 주식을 매도하시겠습니까?"}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmTrade}
                  className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
              <div className="flex flex-col items-center">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                {/* Success Message */}
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  {tradeType === "buy" ? "매수 완료!" : "매도 완료!"}
                </h3>

                <p className="text-lg text-gray-600 text-center mb-2">
                  {stock.name}
                </p>

                <p className="text-2xl font-bold text-emerald-600 mb-6">
                  {quantity}주 · {totalPrice.toLocaleString()}원
                </p>

                <div className="w-full p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-800 text-center font-medium">
                    거래가 성공적으로 완료되었어요! 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
