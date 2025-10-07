"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { getStockHistory, StockHistoryData } from "@/actions/stockHistory";

interface StockDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stockId: string;
  stockName: string;
}

export default function StockDetailSheet({ isOpen, onClose, stockId, stockName }: StockDetailSheetProps) {
  const [data, setData] = useState<StockHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && stockId) {
      loadData();
    }
  }, [isOpen, stockId]);

  // 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[101] flex flex-col"
            style={{ 
              bottom: 0,
              maxHeight: "66.67vh",
              maxWidth: "640px",
              margin: "0 auto"
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{stockName}</h2>
                {data && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.currentPrice.toLocaleString()}원
                    </span>
                    {data.priceHistory.length > 1 && data.priceHistory[data.priceHistory.length - 1] && (
                      <span className={`text-sm font-semibold flex items-center gap-1 ${
                        data.priceHistory[data.priceHistory.length - 1]!.change >= 0 
                          ? "text-red-600" 
                          : "text-blue-600"
                      }`}>
                        {data.priceHistory[data.priceHistory.length - 1]!.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {data.priceHistory[data.priceHistory.length - 1]!.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 text-sm">가격 정보를 불러오는 중...</p>
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
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">가격 추이</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={data.priceHistory}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="day" 
                          label={{ value: "Day", position: "insideBottom", offset: -5 }}
                          tick={{ fontSize: 12 }}
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
                                  <p className="text-sm font-semibold">Day {data.day}</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {data.price.toLocaleString()}원
                                  </p>
                                  {data.change !== 0 && (
                                    <p className={`text-sm ${data.change >= 0 ? "text-red-600" : "text-blue-600"}`}>
                                      {data.change >= 0 ? "+" : ""}{data.change.toLocaleString()}원 
                                      ({data.changePercent.toFixed(2)}%)
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          fill="url(#colorPrice)" 
                          stroke="none"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: "#3B82F6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        {/* 뉴스 마커 */}
                        {data.relatedNews.map((news) => {
                          const pricePoint = data.priceHistory.find(p => p.day === news.day);
                          if (!pricePoint) return null;
                          return (
                            <ReferenceDot
                              key={news.id}
                              x={news.day}
                              y={pricePoint.price}
                              r={8}
                              fill="#F59E0B"
                              stroke="#FFFFFF"
                              strokeWidth={2}
                              onClick={() => setSelectedNews(selectedNews === news.id ? null : news.id)}
                              style={{ cursor: "pointer" }}
                            />
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
                          <motion.div
                            key={newsItem.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white border rounded-xl p-4 transition-all cursor-pointer ${
                              selectedNews === newsItem.id 
                                ? "border-yellow-400 bg-yellow-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedNews(selectedNews === newsItem.id ? null : newsItem.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-yellow-700">D{newsItem.day}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm">{newsItem.title}</h4>
                                <AnimatePresence>
                                  {selectedNews === newsItem.id && (
                                    <motion.p
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="text-sm text-gray-600 mt-2 overflow-hidden"
                                    >
                                      {newsItem.content}
                                    </motion.p>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
