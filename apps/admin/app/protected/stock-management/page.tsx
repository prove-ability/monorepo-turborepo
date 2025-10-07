"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StockManagement from "@/components/game/StockManagement";
import { Stock } from "@/types";
import { getStocks } from "@/actions/stockActions";

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

  const handleStockCreated = (newStock: Stock) => {
    setStocks((prev) => [...prev, newStock]);
  };

  const handleStockUpdated = (updatedStock: Stock) => {
    setStocks((prev) =>
      prev.map((stock) => (stock.id === updatedStock.id ? updatedStock : stock))
    );
  };

  const handleStockDeleted = (deletedStockId: string) => {
    setStocks((prev) => prev.filter((stock) => stock.id !== deletedStockId));
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
        <Button onClick={loadStocks}>새로고침</Button>
      </div>

      {/* 주식 관리 컴포넌트 */}
      <StockManagement
        stocks={stocks}
        onStockCreated={handleStockCreated}
        onStockUpdated={handleStockUpdated}
        onStockDeleted={handleStockDeleted}
      />
    </div>
  );
}
