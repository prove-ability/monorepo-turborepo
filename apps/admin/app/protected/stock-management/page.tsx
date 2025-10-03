"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getStocks, type Stock } from "@/actions/stockActions";
import StockManagement from "@/components/game/StockManagement";

export default function StockManagementPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const stocksData = await getStocks();
      setStocks(stocksData);
    } catch (error) {
      console.error("주식 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadStocks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">주식 관리</h1>
          <p className="text-muted-foreground">
            게임에서 사용할 주식 종목을 관리합니다 (모든 클래스 공통)
          </p>
        </div>
        <Button onClick={refreshData}>새로고침</Button>
      </div>

      {/* 주식 관리 컴포넌트 */}
      <StockManagement stocks={stocks} onRefresh={refreshData} />
    </div>
  );
}
