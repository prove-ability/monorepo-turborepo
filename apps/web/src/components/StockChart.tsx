"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface StockPriceData {
  day: number;
  price: number;
  news?: Array<{
    title: string;
    content: string;
  }>;
}

interface StockWithPrices {
  id: string;
  name: string;
  prices: StockPriceData[];
  currentDay: number;
  maxDay: number;
}

interface StockChartProps {
  stocks: StockWithPrices[];
}

// 주식별 색상 (더 선명하고 구분하기 쉬운 색상)
const STOCK_COLORS = [
  "#2563eb", // 파랑
  "#dc2626", // 빨강
  "#16a34a", // 초록
  "#ea580c", // 주황
  "#9333ea", // 보라
  "#db2777", // 핑크
  "#0891b2", // 청록
  "#ca8a04", // 노랑
  "#4f46e5", // 인디고
  "#059669", // 에메랄드
  "#7c3aed", // 바이올렛
  "#be123c", // 로즈
  "#0284c7", // 스카이
  "#65a30d", // 라임
  "#c026d3", // 푸시아
  "#0d9488", // 틸
  "#d97706", // 앰버
  "#7c2d12", // 브라운
  "#1e40af", // 딥블루
  "#b91c1c", // 딥레드
];

export default function StockChart({ stocks }: StockChartProps) {
  const [selectedNews, setSelectedNews] = useState<{
    stockName: string;
    day: number;
    news: Array<{ title: string; content: string }>;
  } | null>(null);

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">주식 데이터가 없습니다.</p>
      </div>
    );
  }

  const maxDay = stocks[0]?.maxDay || 9;
  const currentDay = stocks[0]?.currentDay || 0;

  // Recharts용 데이터 변환
  const chartData: any[] = [];
  for (let day = 1; day <= currentDay; day++) {
    const dayData: any = { day: `Day ${day}`, dayNumber: day };
    stocks.forEach((stock) => {
      const priceData = stock.prices.find((p) => p.day === day);
      if (priceData) {
        dayData[stock.name] = priceData.price;
        dayData[`${stock.name}_news`] = priceData.news;
      }
    });
    chartData.push(dayData);
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-white rounded-lg shadow-xl border-2 border-blue-200 max-w-md max-h-[400px] overflow-y-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <p className="font-bold text-gray-900 mb-3 text-lg sticky top-0 bg-white pt-4 px-4 pb-2 border-b z-10 -mx-4 -mt-4">{label}</p>
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {payload.map((entry: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium text-sm text-gray-700 truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-bold text-sm whitespace-nowrap ml-2" style={{ color: entry.color }}>
                    ₩{entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Y축 포맷터 (한화 원단위 - 전체 표시)
  const formatYAxis = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 shadow-md border border-gray-200">
        <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
          주식 목록 ({stocks.length}개)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {stocks.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: STOCK_COLORS[idx % STOCK_COLORS.length],
                }}
              />
              <span className="text-sm font-medium text-gray-800 truncate">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            주식 가격 추이 (Day 1 ~ {currentDay})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            총 {stocks.length}개 주식 • 현재 Day {currentDay}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={600}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <defs>
              <rect id="chartBackground" fill="#ffffff" />
            </defs>
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              style={{ fontSize: "14px", fontWeight: 600 }}
              tick={{ fill: "#374151" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "14px", fontWeight: 600 }}
              tick={{ fill: "#374151" }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} offset={200} position={{ y: -200 }} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              iconSize={20}
            />
            
            {/* 현재 Day 표시 */}
            <ReferenceLine
              x={`Day ${currentDay}`}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: "현재",
                position: "top",
                fill: "#3b82f6",
                fontWeight: "bold",
              }}
            />

            {/* 각 주식의 라인 */}
            {stocks.map((stock, idx) => (
              <Line
                key={stock.id}
                type="monotone"
                dataKey={stock.name}
                stroke={STOCK_COLORS[idx % STOCK_COLORS.length]}
                strokeWidth={3}
                dot={{
                  r: 5,
                  strokeWidth: 2,
                  fill: "#fff",
                }}
                activeDot={{
                  r: 7,
                  strokeWidth: 3,
                }}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 뉴스 모달 */}
      {selectedNews && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedNews.stockName}
                </h3>
                <p className="text-sm text-gray-600">Day {selectedNews.day}</p>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {selectedNews.news.map((n, i) => (
                <div
                  key={i}
                  className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                >
                  <p className="font-semibold text-gray-900 mb-2">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
