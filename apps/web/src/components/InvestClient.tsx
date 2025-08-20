"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { getStocks } from "@/actions/investActions";
import { getHoldings } from "@/actions/userActions";
import { InvestModal } from "./InvestModal";

export type Stock = {
  id: string;
  name: string;
  price: number;
  priceChange: number;
  changeRate: number;
  logo_url: string;
  market_country_code: string;
};

interface InvestClientProps {
  classInfo: any;
}

const InvestPageSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    {/* Top Banner Skeleton */}
    <div className="bg-gray-200 p-4 rounded-xl h-22"></div>

    {/* Stock List Skeleton */}
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4">
        <div className="h-7 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-8 bg-gray-100 rounded-md"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center py-4 space-x-2">
            <div className="w-2/5 h-5 bg-gray-200 rounded"></div>
            <div className="w-1/4 h-5 bg-gray-200 rounded ml-auto"></div>
            <div className="w-1/4 h-5 bg-gray-200 rounded"></div>
            <div className="w-1/5 h-5 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Another Stock List Skeleton */}
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4">
        <div className="h-7 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-8 bg-gray-100 rounded-md"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center py-4 space-x-2">
            <div className="w-2/5 h-5 bg-gray-200 rounded"></div>
            <div className="w-1/4 h-5 bg-gray-200 rounded ml-auto"></div>
            <div className="w-1/4 h-5 bg-gray-200 rounded"></div>
            <div className="w-1/5 h-5 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function InvestClient({ classInfo }: InvestClientProps) {
  const router = useRouter();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [krStocks, setKrStocks] = useState<Stock[]>([]);
  const [usStocks, setUsStocks] = useState<Stock[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stocksData, holdingsData] = await Promise.all([
          getStocks(classInfo.id, classInfo.current_day),
          getHoldings(),
        ]);
        setKrStocks(stocksData.filter((s) => s.market_country_code === "KR"));
        setUsStocks(stocksData.filter((s) => s.market_country_code === "US"));
        setHoldings(holdingsData);
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classInfo.id) {
      fetchData();
    }
  }, [classInfo]);

  const handleBuy = () => {
    if (!selectedStock) return;
    const price = selectedStock.price;
    router.push(
      `/invest/trade?stockId=${selectedStock.id}&stockName=${selectedStock.name}&price=${price}&action=buy`
    );
  };

  const handleSell = () => {
    if (!selectedStock) return;
    const price = selectedStock.price;
    router.push(
      `/invest/trade?stockId=${selectedStock.id}&stockName=${selectedStock.name}&price=${price}&action=sell`
    );
  };

  return (
    <div className="h-full">
      <main className="max-w-xl mx-auto space-y-5">
        {loading ? (
          <InvestPageSkeleton />
        ) : (
          <>
            {/* 상단 배너 */}
            <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl flex items-center gap-3">
              <TrendingUp className="h-6 w-6 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-lg">
                  어떤 종목에 투자해 볼까요?
                </h2>
                <p className="text-base text-indigo-600 mt-1">
                  뉴스를 읽고 신중히 투자해 주세요.
                </p>
              </div>
            </div>

            {/* 투자 종목 리스트 */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">국내주식</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center bg-indigo-100 rounded-md py-2 text-xs text-indigo-800 font-bold">
                  <div className="w-2/5 px-2">종목명</div>
                  <div className="w-1/4 text-right px-2">현재가</div>
                  <div className="w-1/4 text-right px-2">대비</div>
                  <div className="w-1/5 text-right px-2">등락률</div>
                </div>
                {krStocks.map((stock, index) => {
                  const colorClass =
                    stock.priceChange > 0
                      ? "text-red-500"
                      : stock.priceChange < 0
                        ? "text-blue-500"
                        : "text-gray-500";
                  const indicator =
                    stock.priceChange > 0
                      ? "▲"
                      : stock.priceChange < 0
                        ? "▼"
                        : "";

                  return (
                    <div
                      key={stock.id}
                      className="flex items-center py-4 cursor-pointer hover:bg-gray-50 text-sm"
                      onClick={() => setSelectedStock(stock)}
                    >
                      <div className="w-2/5 px-2 font-medium text-gray-800">
                        {stock.name}
                      </div>
                      <div
                        className={`w-1/4 text-right px-2 font-medium ${colorClass}`}
                      >
                        {stock.price.toLocaleString()}원
                      </div>
                      <div
                        className={`w-1/4 text-right px-2 font-medium ${colorClass}`}
                      >
                        {indicator}{" "}
                        {Math.abs(stock.priceChange).toLocaleString()}
                      </div>
                      <div
                        className={`w-1/5 text-right px-2 font-medium ${colorClass}`}
                      >
                        {stock.changeRate.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md mt-6">
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">해외주식</h3>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center bg-indigo-100 rounded-md py-2 text-xs text-indigo-800 font-bold">
                  <div className="w-2/5 px-2">종목명</div>
                  <div className="w-1/4 text-right px-2">현재가</div>
                  <div className="w-1/4 text-right px-2">대비</div>
                  <div className="w-1/5 text-right px-2">등락률</div>
                </div>
                {usStocks.map((stock, index) => {
                  const colorClass =
                    stock.priceChange > 0
                      ? "text-red-500"
                      : stock.priceChange < 0
                        ? "text-blue-500"
                        : "text-gray-500";
                  const indicator =
                    stock.priceChange > 0
                      ? "▲"
                      : stock.priceChange < 0
                        ? "▼"
                        : "";

                  return (
                    <div
                      key={stock.id}
                      className="flex items-center py-4 cursor-pointer hover:bg-gray-50 text-sm"
                      onClick={() => setSelectedStock(stock)}
                    >
                      <div className="w-2/5 px-2 font-medium text-gray-800">
                        {stock.name}
                      </div>
                      <div
                        className={`w-1/4 text-right px-2 font-medium ${colorClass}`}
                      >
                        {stock.price.toLocaleString()}원
                      </div>
                      <div
                        className={`w-1/4 text-right px-2 font-medium ${colorClass}`}
                      >
                        {indicator}{" "}
                        {Math.abs(stock.priceChange).toLocaleString()}
                      </div>
                      <div
                        className={`w-1/5 text-right px-2 font-medium ${colorClass}`}
                      >
                        {stock.changeRate.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                해외 주식은 편의를 위해 원화(KRW)로 표시됩니다. (적용 환율: $1 =
                1,300원)
              </span>
            </div>
          </>
        )}
      </main>

      <InvestModal
        stock={selectedStock}
        isOwned={holdings.some((h) => h.stock_id === selectedStock?.id)}
        onClose={() => setSelectedStock(null)}
        onBuy={handleBuy}
        onSell={handleSell}
      />

      <BottomNav />
    </div>
  );
}
