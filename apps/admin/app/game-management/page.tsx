"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { getClasses, type Class } from "@/actions/classActions";
import { getStocks, type Stock } from "@/actions/stockActions";
import {
  getClassStockPrices,
  getGameProgress,
  type ClassStockPrice,
} from "@/actions/gameActions";
import StockManagement from "@/components/game/StockManagement";
import GameDayManagement from "@/components/game/GameDayManagement";
import PriceManagement from "@/components/game/PriceManagement";

export default function GameManagementPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [prices, setPrices] = useState<ClassStockPrice[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [gameProgress, setGameProgress] = useState<{
    maxDay: number;
    totalNews: number;
    totalPrices: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadGameProgress();
      loadPrices();
    }
  }, [selectedClass, selectedDay]);

  const loadInitialData = async () => {
    try {
      const [classesData, stocksData] = await Promise.all([
        getClasses(),
        getStocks(),
      ]);

      setClasses(classesData);
      setStocks(stocksData);

      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameProgress = async () => {
    if (!selectedClass) return;

    try {
      const progress = await getGameProgress(selectedClass);
      setGameProgress(progress);
    } catch (error) {
      console.error("게임 진행 상황 로드 실패:", error);
    }
  };

  const loadPrices = async () => {
    if (!selectedClass) return;

    try {
      const pricesData = await getClassStockPrices(selectedClass, selectedDay);
      setPrices(pricesData);
    } catch (error) {
      console.error("가격 데이터 로드 실패:", error);
    }
  };

  const refreshData = () => {
    loadInitialData();
    if (selectedClass) {
      loadGameProgress();
      loadPrices();
    }
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
          <h1 className="text-3xl font-bold">게임 관리</h1>
          <p className="text-muted-foreground">
            클래스별 주식 게임 데이터를 관리합니다
          </p>
        </div>
        <Button onClick={refreshData}>새로고침</Button>
      </div>

      {/* 클래스 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>클래스 선택</CardTitle>
          <CardDescription>관리할 클래스를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? "default" : "outline"}
                onClick={() => setSelectedClass(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
          </div>

          {gameProgress && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">게임 진행 상황</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">최대 Day:</span>
                  <span className="ml-2 font-medium">
                    {gameProgress.maxDay}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">총 뉴스:</span>
                  <span className="ml-2 font-medium">
                    {gameProgress.totalNews}개
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">총 가격 데이터:</span>
                  <span className="ml-2 font-medium">
                    {gameProgress.totalPrices}개
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Day 선택</CardTitle>
          <CardDescription>관리할 게임 날짜를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
              disabled={selectedDay <= 1}
            >
              이전 Day
            </Button>
            <span className="text-lg font-semibold">Day {selectedDay}</span>
            <Button
              variant="outline"
              onClick={() => setSelectedDay(selectedDay + 1)}
            >
              다음 Day
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 관리 탭 */}
      <Tabs defaultValue="stocks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stocks">주식 관리</TabsTrigger>
          <TabsTrigger value="game-day">게임 Day 관리</TabsTrigger>
          <TabsTrigger value="prices">가격 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks">
          <StockManagement stocks={stocks} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="game-day">
          <GameDayManagement
            selectedClass={selectedClass}
            selectedDay={selectedDay}
            stocks={stocks}
            onRefresh={refreshData}
          />
        </TabsContent>

        <TabsContent value="prices">
          <PriceManagement
            prices={prices}
            selectedClass={selectedClass}
            selectedDay={selectedDay}
            stocks={stocks}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
