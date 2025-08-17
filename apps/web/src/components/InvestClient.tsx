"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import {
  getStocks,
  getClassPortfolio,
  PortfolioItem,
} from "@/actions/investActions";

// TODO: 정확한 타입 정의 필요
export type Stock = any;

interface InvestClientProps {
  classInfo: any;
}

export default function InvestClient({ classInfo }: InvestClientProps) {
  const router = useRouter();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stocksData, portfolioData] = await Promise.all([
          getStocks(classInfo.id, classInfo.current_day),
          getClassPortfolio(classInfo.id, classInfo.current_day),
        ]);
        setStocks(stocksData);
        setPortfolio(portfolioData);
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

  const krStocks = stocks.filter((s) => s.market_country_code === "KR");
  const usStocks = stocks.filter((s) => s.market_country_code === "US");

  return (
    <div className="w-full bg-white flex flex-col h-screen">
      <main className="flex-grow overflow-y-auto p-4">
        <div className="bg-green-100 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-green-800 mb-2">My Portfolio</h3>
          <div className="space-y-2">
            {portfolio.map((item) => {
              const stock = item.stocks;
              if (!stock) return null;

              const price = stock.class_stock_prices?.[0]?.price ?? 0;
              const totalValue = price * item.quantity;

              return (
                <div
                  key={stock.id}
                  className="flex justify-between items-center"
                >
                  <span className="font-semibold">
                    {stock.name} ({item.quantity}주)
                  </span>
                  <span className="text-gray-800">
                    {totalValue.toLocaleString()}원
                  </span>
                </div>
              );
            })}
            {portfolio.length === 0 && (
              <p className="text-gray-500">보유한 주식이 없습니다.</p>
            )}
          </div>
        </div>
        <div className="bg-blue-900 text-white p-4 rounded-lg mb-6 text-center">
          <h2 className="font-bold">어떤 종목에 투자해 볼까요?</h2>
          <p className="text-sm">뉴스를 읽고 신중히 투자해 주세요.</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-500 mb-2">KR 국내주식</h3>
            <div className="bg-gray-50 rounded-lg">
              {krStocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex justify-between items-center p-4 border-b last:border-b-0 cursor-pointer"
                  onClick={() => setSelectedStock(stock)}
                >
                  <span className="font-semibold">{stock.name}</span>
                  <span className="text-gray-800">
                    {stock.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-500 mb-2">US 해외주식</h3>
            <div className="bg-gray-50 rounded-lg">
              {usStocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex justify-between items-center p-4 border-b last:border-b-0 cursor-pointer"
                  onClick={() => setSelectedStock(stock)}
                >
                  <span className="font-semibold">{stock.name}</span>
                  <span className="text-gray-800">
                    {stock.price.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              *모든 종목은 원화로 표시됩니다. (1$={1300}원)
            </p>
          </div>
        </div>
      </main>

      {/* TODO: 매수/매도 모달 구현 */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">
              {selectedStock.name}, 어떻게 할까요?
            </h3>
            <div className="flex justify-between items-center my-4">
              <span>현재가</span>
              <span>{selectedStock.price.toLocaleString()}원</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!selectedStock) return;
                  const price = selectedStock.price;
                  router.push(
                    `/invest/trade?stockId=${selectedStock.id}&stockName=${selectedStock.name}&price=${price}&action=buy`
                  );
                }}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg"
              >
                매수하기
              </button>
              <button
                onClick={() => {
                  if (!selectedStock) return;
                  const price = selectedStock.price;
                  router.push(
                    `/invest/trade?stockId=${selectedStock.id}&stockName=${selectedStock.name}&price=${price}&action=sell`
                  );
                }}
                className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg"
              >
                매도하기
              </button>
            </div>
            <button
              onClick={() => setSelectedStock(null)}
              className="w-full mt-2 text-center text-gray-500"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
