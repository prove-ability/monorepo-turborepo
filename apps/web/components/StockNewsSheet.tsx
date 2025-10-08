"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import BottomSheet from "./BottomSheet";
import {
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { getStockHistory, StockHistoryData } from "@/actions/stockHistory";

interface StockNewsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stockId: string;
  stockName: string;
}

export default function StockNewsSheet({
  isOpen,
  onClose,
  stockId,
  stockName,
}: StockNewsSheetProps) {
  const [data, setData] = useState<StockHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleNewsClick = (newsId: string) => {
    setSelectedNews(selectedNews === newsId ? null : newsId);

    // 차트로 스크롤
    if (chartRef.current) {
      chartRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  useEffect(() => {
    if (isOpen && stockId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stockId]);

  const loadData = async () => {
    console.log("🔍 Loading stock history for:", stockId, stockName);
    setLoading(true);
    try {
      const result = await getStockHistory(stockId);
      console.log("📦 Stock history result:", result ? "Success" : "Failed");
      setData(result);
    } catch (error) {
      console.error("💥 Error loading stock history:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const headerContent = data ? (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{stockName}</h2>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-900">
          {data.currentPrice.toLocaleString()}원
        </span>
        {data.priceHistory.length > 1 &&
          data.priceHistory[data.priceHistory.length - 1] && (
            <span
              className={`text-sm font-semibold flex items-center gap-1 ${
                data.priceHistory[data.priceHistory.length - 1]!.change >= 0
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {data.priceHistory[data.priceHistory.length - 1]!.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {data.priceHistory[
                data.priceHistory.length - 1
              ]!.changePercent.toFixed(2)}
              %
            </span>
          )}
      </div>
    </div>
  ) : (
    <h2 className="text-xl font-bold text-gray-900">{stockName}</h2>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      headerContent={headerContent}
      maxHeight="66.67vh"
    >
      <div className="px-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-sm">
              가격 정보를 불러오는 중...
            </p>
          </div>
        )}

        {!loading && !data && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <p className="text-lg font-semibold">데이터를 불러올 수 없습니다</p>
            <p className="text-sm mt-2">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Chart */}
            <div
              ref={chartRef}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                가격 추이
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart
                  data={data.priceHistory}
                  margin={{ top: 15, right: 15, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="colorPriceRise"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPriceFall"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: "Day",
                      position: "insideBottom",
                      offset: 0,
                    }}
                    tick={{ fontSize: 12 }}
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value >= 10000) {
                        return `${(value / 10000).toFixed(0)}만원`;
                      }
                      return `${value.toLocaleString()}원`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="text-sm font-semibold">
                              Day {data.day}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {data.price.toLocaleString()}원
                            </p>
                            {data.change !== 0 && (
                              <p
                                className={`text-sm font-semibold ${data.change >= 0 ? "text-red-600" : "text-blue-600"}`}
                              >
                                {data.change >= 0 ? "▲ +" : "▼ "}
                                {data.change.toLocaleString()}원 (
                                {data.changePercent >= 0 ? "+" : ""}
                                {data.changePercent.toFixed(2)}%)
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* 세그먼트별 색상 Line */}
                  {data.priceHistory.map((point, index) => {
                    if (index === 0) return null;
                    const prevPoint = data.priceHistory[index - 1];
                    if (!prevPoint) return null;
                    const isRise = point.price >= prevPoint.price;
                    const segmentData = [prevPoint, point];

                    return (
                      <Line
                        key={`segment-${index}`}
                        data={segmentData}
                        type="monotone"
                        dataKey="price"
                        stroke={isRise ? "#DC2626" : "#2563EB"}
                        strokeWidth={3}
                        dot={false}
                        activeDot={false}
                      />
                    );
                  })}

                  {/* 포인트 강조 */}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="none"
                    strokeWidth={0}
                    dot={(props: {
                      cx: number;
                      cy: number;
                      payload: { change: number; day: number };
                      index?: number;
                    }) => {
                      const { cx, cy, payload, index } = props;
                      const isRise = payload.change >= 0;
                      const isFirst = payload.day === 1;
                      return (
                        <circle
                          key={`dot-${payload.day}-${index || 0}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={
                            isFirst ? "#6B7280" : isRise ? "#DC2626" : "#2563EB"
                          }
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                  />
                  {/* 뉴스 마커 */}
                  {data.relatedNews.map((news) => {
                    const pricePoint = data.priceHistory.find(
                      (p) => p.day === news.day
                    );
                    if (!pricePoint) return null;
                    const isSelected = selectedNews === news.id;
                    return (
                      <g key={news.id}>
                        {/* Ping 효과 (선택 시) */}
                        {isSelected && (
                          <ReferenceDot
                            x={news.day}
                            y={pricePoint.price}
                            r={10}
                            fill="#F59E0B"
                            stroke="none"
                            style={{
                              animation:
                                "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                              transformBox: "fill-box",
                              transformOrigin: "center",
                            }}
                          />
                        )}
                        {/* 실제 마커 */}
                        <ReferenceDot
                          x={news.day}
                          y={pricePoint.price}
                          r={8}
                          fill={isSelected ? "#F59E0B" : "#FBBF24"}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                          onClick={() => handleNewsClick(news.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </g>
                    );
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Related News */}
            {data.relatedNews.length > 0 && (
              <div className="pb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  관련 뉴스
                </h3>
                <div className="space-y-3">
                  {data.relatedNews.map((newsItem) => (
                    <div
                      key={newsItem.id}
                      className={`bg-white border rounded-xl p-4 transition-all cursor-pointer ${
                        selectedNews === newsItem.id
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleNewsClick(newsItem.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-yellow-700">
                            D{newsItem.day}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {newsItem.title}
                          </h4>
                          {selectedNews === newsItem.id && (
                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                              {newsItem.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.relatedNews.length === 0 && (
              <div className="text-center py-8 pb-6 text-gray-500 text-sm">
                아직 관련 뉴스가 없습니다
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
