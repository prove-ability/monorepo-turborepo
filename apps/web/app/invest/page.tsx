"use client";

import { useEffect, useState } from "react";
import { getStocksForInvest } from "@/actions/stocks";
import { getTransactionHistory, TransactionItem } from "@/actions/transactions";
import TradeBottomSheet from "@/components/TradeBottomSheet";

interface Stock {
  id: string;
  name: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  marketCountryCode: "KR" | "US" | "JP" | "CN";
  holdingQuantity: number;
  holdingValue: number;
  averagePurchasePrice: number;
}

export default function InvestPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "holdings" | "history">("all");
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalProfitRate, setTotalProfitRate] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [showHistoryGuide, setShowHistoryGuide] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getStocksForInvest();
      setStocks(data.stocks);
      setBalance(data.balance);
      setCurrentDay(data.currentDay);
      setTotalProfit(data.profit || 0);
      setTotalProfitRate(data.profitRate || 0);

      // 거래내역 탭일 때만 거래내역 로드
      if (activeTab === "history") {
        const txHistory = await getTransactionHistory();
        setTransactions(txHistory);
      }
    } catch (error) {
      console.error("Failed to load stocks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleTradeSuccess = () => {
    loadData();
  };

  const holdingStocks = stocks.filter((s) => s.holdingQuantity > 0);
  const totalHoldingValue = holdingStocks.reduce(
    (sum, s) => sum + s.holdingValue,
    0
  );

  const displayStocks = activeTab === "all" ? stocks : holdingStocks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">투자</h1>

        {/* Portfolio Summary */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="mb-4">
            <p className="text-sm opacity-90 mb-1">잔액</p>
            <p className="text-3xl font-bold">{balance.toLocaleString()}원</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-xs opacity-80 mb-1">보유 자산</p>
              <p className="text-lg font-semibold">
                {totalHoldingValue.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">평가손익</p>
              <p
                className={`text-lg font-semibold ${
                  totalProfit === 0
                    ? "text-gray-300"
                    : totalProfit > 0
                      ? "text-yellow-300"
                      : "text-red-300"
                }`}
              >
                {totalProfit === 0 ? "" : totalProfit > 0 ? "+" : ""}
                {totalProfit.toLocaleString()}원
              </p>
              <p
                className={`text-xs opacity-90 ${
                  totalProfit === 0
                    ? "text-gray-300"
                    : totalProfit > 0
                      ? "text-yellow-200"
                      : "text-red-200"
                }`}
              >
                {totalProfitRate === 0 ? "" : totalProfitRate > 0 ? "+" : ""}
                {totalProfitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          전체 종목
        </button>
        <button
          onClick={() => setActiveTab("holdings")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "holdings"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          보유 종목 ({holdingStocks.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          거래내역
        </button>
      </div>

      {/* Transaction History */}
      {activeTab === "history" ? (
        <>
          {/* 안내 메시지 */}
          {showHistoryGuide && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      수익률 계산 안내
                    </h4>
                    <p className="text-sm text-blue-800">
                      수익률은 <strong>매수/매도 거래</strong>만 반영됩니다.
                      <br />
                      <span className="text-blue-600">지원금</span>은 초기 자본이므로 수익률 계산에서 제외됩니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryGuide(false)}
                  className="text-blue-400 hover:text-blue-600 transition-colors ml-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">거래 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
            {transactions.map((tx) => {
              const isMoneyIn = tx.type === "deposit"; // 돈이 들어옴 (매도, 지원금)
              const isBenefit = tx.subType === "benefit";
              const totalAmount = isBenefit
                ? parseFloat(tx.price)
                : parseFloat(tx.price) * tx.quantity;
              
              return (
                <div
                  key={tx.id}
                  className={`rounded-lg p-4 shadow hover:shadow-md transition-shadow border-l-4 ${
                    isBenefit
                      ? "bg-gray-50 border-gray-300"
                      : "bg-white border-gray-200"
                  }`}
                  style={{
                    borderLeftColor: isBenefit
                      ? "#9ca3af"
                      : isMoneyIn
                        ? "#10b981"
                        : "#ef4444",
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-medium ${
                            isBenefit ? "text-gray-500" : "text-gray-600"
                          }`}
                        >
                          Day {tx.day}
                        </span>
                        <span
                          className={`text-xs ${
                            isBenefit ? "text-gray-400" : "text-gray-400"
                          }`}
                        >
                          |
                        </span>
                        <span
                          className={`text-xs ${
                            isBenefit ? "text-gray-500" : "text-gray-600"
                          }`}
                        >
                          {isBenefit ? "지원금" : tx.subType === "buy" ? "매수" : "매도"}
                        </span>
                        {isBenefit && (
                          <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded font-medium">
                            수익률 계산 제외
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-bold mb-1 ${
                          isBenefit ? "text-gray-600" : "text-gray-900"
                        }`}
                      >
                        {tx.stockName || "초기 지원금"}
                      </p>
                      {!isBenefit && (
                        <p className="text-sm text-gray-600">
                          {tx.quantity}주 @ {parseFloat(tx.price).toLocaleString()}원
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <span
                          className={`text-2xl font-bold ${
                            isBenefit
                              ? "text-gray-500"
                              : isMoneyIn
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          {isMoneyIn ? "+" : "-"}
                          {totalAmount.toLocaleString()}
                        </span>
                        <span
                          className={`text-sm ${
                            isBenefit ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          원
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isBenefit
                              ? "bg-gray-400"
                              : isMoneyIn
                                ? "bg-green-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            isBenefit ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {isMoneyIn ? "입금" : "출금"}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-2 ${
                          isBenefit ? "text-gray-400" : "text-gray-400"
                        }`}
                      >
                        {new Date(tx.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </>
      ) : displayStocks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">
            {activeTab === "holdings"
              ? "보유 중인 주식이 없습니다"
              : "거래 가능한 주식이 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayStocks.map((stock) => {
            const profitLoss =
              (stock.currentPrice - stock.averagePurchasePrice) *
              stock.holdingQuantity;
            const profitLossRate =
              stock.averagePurchasePrice > 0
                ? (profitLoss /
                    (stock.averagePurchasePrice * stock.holdingQuantity)) *
                  100
                : 0;

            return (
              <div
                key={stock.id}
                onClick={() => setSelectedStock(stock)}
                className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{stock.name}</h3>
                    <p className="text-xs text-gray-500">
                      {stock.marketCountryCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {stock.currentPrice.toLocaleString()}원
                    </p>
                    <p
                      className={`text-sm font-semibold ${
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
                      {stock.changeRate === 0
                        ? "0.00"
                        : Math.abs(stock.changeRate).toFixed(2)}
                      %)
                    </p>
                  </div>
                </div>

                {/* Holdings Info */}
                {stock.holdingQuantity > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-600">보유: </span>
                        <span className="font-semibold">
                          {stock.holdingQuantity}주
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">평가액: </span>
                        <span className="font-semibold">
                          {stock.holdingValue.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <div>
                        <span className="text-gray-600">평균단가: </span>
                        <span className="font-semibold">
                          {stock.averagePurchasePrice.toLocaleString()}원
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">손익: </span>
                        <span
                          className={`font-semibold ${
                            profitLoss === 0
                              ? "text-gray-500"
                              : profitLoss > 0
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {profitLoss === 0 ? "" : profitLoss > 0 ? "+" : ""}
                          {profitLoss.toLocaleString()}원 (
                          {profitLossRate === 0
                            ? ""
                            : profitLossRate > 0
                              ? "+"
                              : ""}
                          {profitLossRate.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trade Bottom Sheet */}
      {selectedStock && (
        <TradeBottomSheet
          stock={selectedStock}
          balance={balance}
          currentDay={currentDay}
          onClose={() => setSelectedStock(null)}
          onTradeSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}
