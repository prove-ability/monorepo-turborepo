"use client";

import { Newspaper } from "lucide-react";
import StockBadge from "./StockBadge";

interface RelatedStock {
  id: string;
  name: string;
}

interface NewsItem {
  id: string;
  title: string | null;
  content: string | null;
  day: number | null;
  relatedStocks: RelatedStock[];
}

interface NewsListProps {
  news: NewsItem[];
  currentDay: number;
}

export default function NewsList({ news, currentDay }: NewsListProps) {
  if (news.length === 0) {
    return (
      <div className="text-center py-12">
        <Newspaper className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">오늘의 뉴스가 아직 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((newsItem, index) => (
        <div
          key={newsItem.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2">
                {newsItem.title}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {newsItem.content}
              </p>
              {newsItem.relatedStocks && newsItem.relatedStocks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newsItem.relatedStocks.map((stock) => (
                    <StockBadge
                      key={stock.id}
                      stockId={stock.id}
                      stockName={stock.name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
