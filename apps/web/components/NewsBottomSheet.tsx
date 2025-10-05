"use client";

import { useEffect, useState } from "react";
import { getNewsByStock } from "@/actions/news";

interface NewsItem {
  id: string;
  day: number | null;
  title: string | null;
  content: string | null;
  relatedStockIds: unknown;
  createdAt: Date;
}

interface NewsBottomSheetProps {
  stockId: string;
  stockName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsBottomSheet({
  stockId,
  stockName,
  isOpen,
  onClose,
}: NewsBottomSheetProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stockId) {
      loadNews();
    }
  }, [isOpen, stockId]);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await getNewsByStock(stockId);
      setNews(data);
    } catch (error) {
      console.error("Failed to load news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📰</span>
            <div>
              <h3 className="font-bold text-lg">{stockName}</h3>
              <p className="text-sm text-gray-500">관련 뉴스</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">관련 뉴스가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      Day {item.day}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
