"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStocksForInvest } from "@/actions/stocks";
import { getTransactionHistory, TransactionItem } from "@/actions/transactions";
import TradeBottomSheet from "@/components/TradeBottomSheet";
import StockNewsSheet from "@/components/StockNewsSheet";
import StockListSkeleton from "@/components/StockListSkeleton";
import TransactionListSkeleton from "@/components/TransactionListSkeleton";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTour } from "@/hooks/useTour";
import { ShoppingCart, Receipt } from "lucide-react";

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
  newsCount: number;
}

// 국가 코드 매핑
const COUNTRY_NAMES: Record<string, string> = {
  KR: "대한민국",
  US: "미국",
  JP: "일본",
  CN: "중국",
};

export default function InvestPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"stocks" | "history">("stocks");
  const [showOnlyHoldings, setShowOnlyHoldings] = useState(
    filterParam === "holdings"
  );
  const [showOnlyNews, setShowOnlyNews] = useState(false);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [totalProfitRate, setTotalProfitRate] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [showHistoryGuide, setShowHistoryGuide] = useState(true);
  const [showStockGuide, setShowStockGuide] = useState(true);
  const [newsStock, setNewsStock] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 투어 훅 추가
  useTour(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

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
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
    
    // 가이드 표시 여부 확인
    const hideStockGuide = localStorage.getItem("hideStockGuide");
    if (hideStockGuide === "true") {
      setShowStockGuide(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      loadData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTradeSuccess = () => {
    loadData(false);
  };

  // Pull-to-refresh 기능
  const { isRefreshing: isPulling } = usePullToRefresh(async () => {
    await loadData(false);
  });

  const holdingStocks = stocks.filter((s) => s.holdingQuantity > 0);
  const newsStocks = stocks.filter((s) => s.newsCount > 0);
  const totalHoldingValue = holdingStocks.reduce(
    (sum, s) => sum + s.holdingValue,
    0
  );

  let displayStocks = stocks;
  if (showOnlyHoldings && showOnlyNews) {
    // 둘 다 체크: 보유 중이면서 뉴스가 있는 종목
    displayStocks = stocks.filter(
      (s) => s.holdingQuantity > 0 && s.newsCount > 0
    );
  } else if (showOnlyHoldings) {
    displayStocks = holdingStocks;
  } else if (showOnlyNews) {
    displayStocks = newsStocks;
  }

  if (isInitialLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh 인디케이터 */}
      {isPulling && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-emerald-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader
          title="투자"
          description="뉴스를 읽고 주식을 사고팔아보세요"
        />

        {/* 종목 클릭 안내 */}
        {showStockGuide && stocks.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">👆</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900 mb-1">
                  종목 카드를 눌러보세요!
                </p>
                <p className="text-xs text-emerald-800">
                  종목을 클릭하면 주식을 사고 팔 수 있어요. 뉴스를 확인하고 투자해보세요!
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStockGuide(false);
                  localStorage.setItem("hideStockGuide", "true");
                }}
                className="text-emerald-600 hover:text-emerald-800 text-xl flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        <div className="mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1.5">남은 현금</p>
              <p className="text-xl font-bold text-gray-900">{balance.toLocaleString()}원</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-600 mb-1.5">내 주식</p>
                <p className="text-base font-bold text-gray-900">
                  {totalHoldingValue.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5">투자 결과</p>
                <p
                  className={`text-base font-bold ${
                    totalProfit === 0
                      ? "text-gray-500"
                      : totalProfit > 0
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {totalProfit === 0 ? "" : totalProfit > 0 ? "+" : ""}
                  {totalProfit.toLocaleString()}원
                </p>
                <p
                  className={`text-xs font-medium ${
                    totalProfit === 0
                      ? "text-gray-500"
                      : totalProfit > 0
                        ? "text-red-600"
                        : "text-blue-600"
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
            onClick={() => setActiveTab("stocks")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === "stocks"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            투자 종목
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === "history"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            거래내역
          </button>
        </div>

        {/* Filter Toggle - 투자 종목 탭에서만 표시 */}
        {activeTab === "stocks" && (
          <>
            <div className="mb-4 bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyHoldings}
                    onChange={(e) => setShowOnlyHoldings(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    내가 가진 주식
                  </span>
                  {showOnlyHoldings && (
                    <span className="text-xs text-gray-500">
                      ({holdingStocks.length}개)
                    </span>
                  )}
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyNews}
                    onChange={(e) => setShowOnlyNews(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ⚡ 오늘 주목할 주식
                  </span>
                  {showOnlyNews && (
                    <span className="text-xs text-gray-500">
                      ({newsStocks.length}개)
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Day 1 안내 배너 */}
            {currentDay === 1 && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">
                    🎉
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">
                      첫날입니다!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      뉴스를 읽고 주식을 사보세요. 내일 결과를 확인할 수 있어요!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Transaction History */}
        {activeTab === "history" ? (
          <>
            {/* 안내 메시지 */}
            {showHistoryGuide && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-xl">
                      💡
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-emerald-900 mb-1">
                        수익률 계산 안내
                      </h4>
                      <p className="text-xs text-emerald-800">
                        수익률은 <strong>사고 팔기 거래</strong>만 반영됩니다.
                        <br />
                        <span className="font-bold">지원금</span>은 초기
                        자본이므로 수익률 계산에서 제외됩니다.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryGuide(false)}
                    className="text-emerald-400 hover:text-emerald-600 transition-colors ml-2"
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

            {isRefreshing ? (
              <TransactionListSkeleton />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<Receipt className="h-16 w-16" />}
                title="아직 거래 내역이 없어요"
                description="첫 거래를 시작해보세요! 투자 종목 탭에서 주식을 선택하면 거래할 수 있습니다."
              />
            ) : (
              <div className="space-y-4">
                {(() => {
                  // Day별로 그룹화
                  const txByDay: Record<number, typeof transactions> =
                    transactions.reduce(
                      (acc: Record<number, typeof transactions>, tx) => {
                        if (!acc[tx.day]) {
                          acc[tx.day] = [];
                        }
                        acc[tx.day]!.push(tx);
                        return acc;
                      },
                      {}
                    );

                  // 각 Day 내에서 지원금을 맨 아래, 나머지는 시간순으로 정렬
                  Object.keys(txByDay).forEach((day) => {
                    const dayNum = Number(day);
                    if (txByDay[dayNum]) {
                      txByDay[dayNum].sort((a, b) => {
                        // 지원금을 맨 아래로
                        if (a.subType === "benefit" && b.subType !== "benefit")
                          return 1;
                        if (a.subType !== "benefit" && b.subType === "benefit")
                          return -1;
                        // 같은 타입이면 최신순
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        );
                      });
                    }
                  });

                  const sortedDays = Object.keys(txByDay)
                    .map(Number)
                    .sort((a, b) => b - a); // 최신 Day 먼저

                  return sortedDays.map((day) => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-full">
                          Day {day}
                        </span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                      {txByDay[day]?.map((tx) => {
                        const isMoneyIn = tx.type === "deposit";
                        const isBenefit = tx.subType === "benefit";
                        const totalAmount = isBenefit
                          ? parseFloat(tx.price)
                          : parseFloat(tx.price) * tx.quantity;

                        // 현재 Day의 지원금인지 확인
                        const isNew = isBenefit && tx.day === currentDay;

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
                                  {isNew && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded animate-pulse">
                                      NEW
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs ${
                                      isBenefit
                                        ? "text-gray-500"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {isBenefit
                                      ? "지원금"
                                      : tx.subType === "buy"
                                        ? "구매"
                                        : "판매"}
                                  </span>
                                  {isBenefit && (
                                    <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded font-medium">
                                      수익률 계산 제외
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`font-bold mb-1 ${
                                    isBenefit
                                      ? "text-gray-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {tx.stockName || "지원금"}
                                </p>
                                {!isBenefit && (
                                  <p className="text-sm text-gray-600">
                                    {tx.quantity}주 • 주당{" "}
                                    {parseFloat(tx.price).toLocaleString()}원
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
                                      isBenefit
                                        ? "text-gray-400"
                                        : "text-gray-500"
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
                                      isBenefit
                                        ? "text-gray-500"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {isMoneyIn ? "입금" : "출금"}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs mt-2 ${
                                    isBenefit
                                      ? "text-gray-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {new Date(tx.createdAt).toLocaleDateString(
                                    "ko-KR",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}
          </>
        ) : isRefreshing ? (
          <StockListSkeleton />
        ) : displayStocks.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-16 w-16" />}
            title={
              showOnlyHoldings && showOnlyNews
                ? "조건에 맞는 주식이 없어요"
                : showOnlyHoldings
                  ? "아직 산 주식이 없어요"
                  : showOnlyNews
                    ? "오늘 주목할 주식이 없어요"
                    : "투자 가능한 주식이 없어요"
            }
            description={
              showOnlyHoldings && showOnlyNews
                ? "내가 가진 주식 중 오늘 뉴스가 있는 종목이 없어요."
                : showOnlyHoldings
                  ? "아직 투자한 주식이 없습니다. 주식을 사서 포트폴리오를 만들어보세요!"
                  : showOnlyNews
                    ? "오늘은 뉴스가 발표된 주식이 없습니다. 내일을 기대해주세요!"
                    : "관리자가 주식을 등록하면 여기에 표시됩니다."
            }
          />
        ) : (
          <div id="stock-list" className="space-y-3">
            {displayStocks.map((stock, index) => {
              const profitLoss =
                (stock.currentPrice - stock.averagePurchasePrice) *
                stock.holdingQuantity;
              const profitLossRate =
                stock.averagePurchasePrice > 0
                  ? (profitLoss /
                      (stock.averagePurchasePrice * stock.holdingQuantity)) *
                    100
                  : 0;
              const isHolding = stock.holdingQuantity > 0;

              return (
                <div
                  key={stock.id}
                  id={index === 0 ? "first-stock-card" : undefined}
                  onClick={() => setSelectedStock(stock)}
                  className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 cursor-pointer border border-gray-100 relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{stock.name}</h3>
                        {isHolding && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-md">
                            보유중
                          </span>
                        )}
                        {stock.newsCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewsStock({
                                id: stock.id,
                                name: stock.name,
                              });
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all"
                          >
                            <span>뉴스 {stock.newsCount}</span>
                            <span className="text-emerald-500">›</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {COUNTRY_NAMES[stock.marketCountryCode] ||
                          stock.marketCountryCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium text-gray-900">
                        {stock.currentPrice.toLocaleString()}원
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          stock.changeRate === 0
                            ? "text-gray-400"
                            : stock.changeRate > 0
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        <span className="text-xs opacity-70 mr-1">오늘</span>
                        {stock.changeRate > 0 ? "+" : ""}
                        {stock.changeRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Holdings Info */}
                  {isHolding && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            {stock.holdingQuantity}주
                          </span>
                          <span className="text-gray-400 mx-1.5">·</span>
                          <span className="text-xs">
                            평균 {stock.averagePurchasePrice.toLocaleString()}원
                          </span>
                        </div>
                        {profitLoss !== 0 && (
                          <div
                            className={`text-sm font-medium ${
                              profitLoss > 0
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            <span className="text-xs opacity-70 mr-1">내 수익</span>
                            {profitLoss > 0 ? "+" : ""}
                            {profitLoss.toLocaleString()}원
                            <span className="text-xs ml-1 opacity-70">
                              ({profitLossRate > 0 ? "+" : ""}
                              {profitLossRate.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trade Bottom Sheet */}
        <TradeBottomSheet
          stock={selectedStock}
          balance={balance}
          currentDay={currentDay}
          onClose={() => setSelectedStock(null)}
          onTradeSuccess={handleTradeSuccess}
        />

        {/* Stock News Sheet */}
        {newsStock && (
          <StockNewsSheet
            stockId={newsStock.id}
            stockName={newsStock.name}
            isOpen={!!newsStock}
            onClose={() => setNewsStock(null)}
          />
        )}
      </div>
    </div>
  );
}
