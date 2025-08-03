"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type Stock } from "@/actions/stockActions";

export interface StockPriceInputData {
  stock_id: string;
  price: number;
}

interface StockPriceInputProps {
  stocks: Stock[];
  stockPrices: StockPriceInputData[];
  onStockPricesChange: (prices: StockPriceInputData[]) => void;
  title?: string;
  description?: string;
  defaultPrice?: number;
}

export default function StockPriceInput({
  stocks,
  stockPrices,
  onStockPricesChange,
  title = "주식 가격",
  description = "각 주식의 가격을 설정하세요",
  defaultPrice = 10000,
}: StockPriceInputProps) {
  const [localStockPrices, setLocalStockPrices] =
    useState<StockPriceInputData[]>(stockPrices);

  // stocks가 변경되면 stockPrices 초기화
  useEffect(() => {
    if (stocks.length > 0 && stockPrices.length === 0) {
      const initialPrices = stocks.map((stock) => ({
        stock_id: stock.id,
        price: defaultPrice,
      }));
      setLocalStockPrices(initialPrices);
      onStockPricesChange(initialPrices);
    } else {
      setLocalStockPrices(stockPrices);
    }
  }, [stocks, stockPrices, defaultPrice, onStockPricesChange]);

  const updateStockPrice = (stockId: string, price: number) => {
    const updated = localStockPrices.map((item) =>
      item.stock_id === stockId ? { ...item, price } : item
    );
    setLocalStockPrices(updated);
    onStockPricesChange(updated);
  };

  const initializeStockPrices = () => {
    const initialPrices = stocks.map((stock) => ({
      stock_id: stock.id,
      price: defaultPrice,
    }));
    setLocalStockPrices(initialPrices);
    onStockPricesChange(initialPrices);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" onClick={initializeStockPrices}>
            기본값으로 초기화
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localStockPrices.map((priceItem) => {
            const stock = stocks.find((s) => s.id === priceItem.stock_id);
            if (!stock) return null;

            return (
              <Card key={priceItem.stock_id}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label>{stock.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={priceItem.price}
                        onChange={(e) =>
                          updateStockPrice(
                            priceItem.stock_id,
                            Number(e.target.value)
                          )
                        }
                        placeholder="가격"
                        min="0"
                        step="100"
                      />
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                    {stock.industry_sector && (
                      <p className="text-xs text-muted-foreground">
                        {stock.industry_sector}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {localStockPrices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            설정할 주식이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
