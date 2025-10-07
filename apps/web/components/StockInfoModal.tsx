"use client";

import { useEffect, useState } from "react";
import { getStockById } from "@/actions/stocks";
import Modal from "./Modal";

interface StockInfo {
  id: string;
  name: string;
  currentPrice: number;
  marketCountryCode: string;
  industrySector: string;
  remarks: string | null;
}

interface StockInfoModalProps {
  stockId: string;
  stockName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockInfoModal({
  stockId,
  stockName,
  isOpen,
  onClose,
}: StockInfoModalProps) {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stockId) {
      loadStockInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stockId]);

  const loadStockInfo = async () => {
    console.log("🔍 Loading stock info for:", stockId, stockName);
    setLoading(true);
    try {
      const data = await getStockById(stockId);
      console.log("📦 Stock info result:", data);
      setStockInfo(data);
    } catch (error) {
      console.error("💥 Failed to load stock info:", error);
    } finally {
      setLoading(false);
    }
  };

  const headerContent = stockInfo ? (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">{stockName}</h2>
      <div className="text-blue-100 text-sm">{stockInfo.industrySector}</div>
    </>
  ) : (
    <h2 className="text-2xl font-bold text-white mb-1">{stockName}</h2>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={headerContent}
      maxWidth="lg"
      minHeight="400px"
    >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 text-sm">정보를 불러오는 중...</p>
            </div>
          ) : !stockInfo ? (
            <div className="text-center flex flex-col items-center justify-center h-[400px] text-gray-500">
              <p className="text-lg font-semibold">
                정보를 불러올 수 없습니다
              </p>
              <p className="text-sm mt-2">잠시 후 다시 시도해주세요</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Current Price Card */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  현재가
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {stockInfo.currentPrice.toLocaleString()}
                  </span>
                  <span className="text-xl font-semibold text-gray-600 mb-1">원</span>
                </div>
              </div>

              {/* Stock Details */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    종목 정보
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-5 py-4">
                    <span className="text-sm text-gray-600">산업 분야</span>
                    <span className="font-semibold text-gray-900">
                      {stockInfo.industrySector}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-5 py-4">
                    <span className="text-sm text-gray-600">시장</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {stockInfo.marketCountryCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {stockInfo.remarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 text-lg">💡</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900 mb-1">
                        참고사항
                      </h4>
                      <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                        {stockInfo.remarks}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
    </Modal>
  );
}
