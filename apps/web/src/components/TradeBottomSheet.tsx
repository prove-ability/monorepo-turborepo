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
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Optimistic Updates를 위한 mutation
  const tradeMutation = useMutation({
    mutationFn: async ({ type, stockId, qty, price }: { type: 'buy' | 'sell', stockId: string, qty: number, price: string }) => {
      return type === 'buy'
        ? await buyStock(stockId, qty, price, currentDay)
        : await sellStock(stockId, qty, price, currentDay);
    },
    onMutate: async ({ type, qty, price }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: ['stocks'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // 이전 데이터 백업
      const previousStocks = queryClient.getQueryData(['stocks']);
      const previousDashboard = queryClient.getQueryData(['dashboard']);

      const totalValue = parseFloat(price) * qty;

      // UI 즉시 업데이트
      queryClient.setQueryData(['stocks'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { balance: number };
        return {
          ...data,
          balance: type === 'buy' ? data.balance - totalValue : data.balance + totalValue,
        };
      });

      queryClient.setQueryData(['dashboard'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { balance: number };
        return {
          ...data,
          balance: type === 'buy' ? data.balance - totalValue : data.balance + totalValue,
        };
      });

      return { previousStocks, previousDashboard };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousStocks) {
        queryClient.setQueryData(['stocks'], context.previousStocks);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        // 성공 시 최종 데이터 갱신
        queryClient.invalidateQueries({ queryKey: ['stocks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        showToast(result.message, "success");
        onTradeSuccess();
        onClose();
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
        queryClient.invalidateQueries({ queryKey: ['stocks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });

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
      setMessage({ type: "error", text: "돈이 부족해요. 남은 돈을 확인해주세요!" });
      return;
    }

    if (tradeType === "sell" && !canSell) {
      setMessage({ type: "error", text: "주식이 부족해요. 가진 수량을 확인해주세요!" });
      return;
    }

    // Optimistic Updates 실행
    tradeMutation.mutate({
      type: tradeType,
      stockId: stock.id,
      qty,
      price: stock.currentPrice.toString(),
    });
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
          {stock.changeRate === 0
            ? "-"
            : stock.changeRate > 0
              ? "▲"
              : "▼"}{" "}
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
                <span className="text-gray-600">남은 돈</span>
                <span className="font-bold">
                  {balance.toLocaleString()}원
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">내가 가진 주식</span>
                <span className="font-bold">
                  {stock.holdingQuantity || 0}주
                </span>
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
              <span className="text-gray-600">
                총 금액
              </span>
              <span className="font-bold text-lg text-gray-900">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
            {tradeType === "buy" && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>남은 돈</span>
                <span className={canAfford ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
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
            onClick={handleTrade}
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
            {tradeMutation.isPending ? "처리 중..." : tradeType === "buy" ? "살래요!" : "팔래요!"}
          </button>
      </div>
    </BottomSheet>
  );
}
