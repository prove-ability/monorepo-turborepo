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
import {
  getClasses,
  updateClassCurrentDay,
  type ClassWithId,
} from "@/actions/classActions";
import { DayAdjustmentModal } from "./components/DayAdjustmentModal";
import { getStocks, type Stock } from "@/actions/stockActions";
import {
  getClassStockPrices,
  getGameProgress,
  type ClassStockPrice,
} from "@/actions/gameActions";

import GameDayManagement from "@/components/game/GameDayManagement";
import PriceManagement from "@/components/game/PriceManagement";

export default function GameManagementPage() {
  const [classes, setClasses] = useState<ClassWithId[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [prices, setPrices] = useState<ClassStockPrice[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [gameProgress, setGameProgress] = useState<{
    maxDay: number;
    totalNews: number;
    totalPrices: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameProgressLoading, setGameProgressLoading] = useState(false);

  // Day 조정 모달 상태
  const [dayAdjustmentModal, setDayAdjustmentModal] = useState({
    isOpen: false,
    newDay: 1,
  });

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
        // 기본 선택: 첫 고객사 및 해당 고객사의 첫 클래스
        const firstClientId = (classesData[0] as any)?.clients?.id as
          | string
          | undefined;
        if (firstClientId) {
          setSelectedClientId(firstClientId);
          const firstClassOfClient = classesData.find(
            (c) => (c as any)?.clients?.id === firstClientId
          );
          setSelectedClass(firstClassOfClient?.id || classesData[0].id);
        } else {
          setSelectedClass(classesData[0].id);
        }
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 선택된 고객사 변경 시, 해당 고객사의 첫 클래스를 자동 선택
  useEffect(() => {
    if (!selectedClientId) return;
    const classesOfClient = classes.filter(
      (c) => (c as any)?.clients?.id === selectedClientId
    );
    if (classesOfClient.length === 0) {
      // 해당 고객사에 클래스가 없으면 선택 해제
      setSelectedClass("");
      return;
    }
    const currentSelectedBelongs = classesOfClient.some(
      (c) => c.id === selectedClass
    );
    if (!currentSelectedBelongs) {
      const first = classesOfClient[0];
      if (first) setSelectedClass(first.id);
    }
  }, [selectedClientId, classes]);

  const loadGameProgress = async () => {
    if (!selectedClass) return;

    setGameProgressLoading(true);
    try {
      const progress = await getGameProgress(selectedClass);
      setGameProgress(progress);
    } catch (error) {
      console.error("게임 진행 상황 로드 실패:", error);
    } finally {
      setGameProgressLoading(false);
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

  // 현재 선택된 클래스의 current_day 가져오기
  const getCurrentDay = () => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    return selectedClassData?.current_day || 1;
  };

  // Day 감소 (바로 실행)
  const handleDayDecrease = async () => {
    if (!selectedClass) return;
    
    const currentDay = getCurrentDay();
    const newDay = Math.max(1, currentDay - 1);
    if (newDay === currentDay) return; // 이미 최소값인 경우
    
    try {
      await updateClassCurrentDay(selectedClass, newDay);
      loadInitialData();
      alert(`현재 Day가 ${newDay}로 업데이트되었습니다.`);
    } catch (error) {
      console.error("현재 Day 업데이트 실패:", error);
      alert("현재 Day 업데이트에 실패했습니다.");
    }
  };

  // Day 증가 모달 열기 (+1 Day만)
  const handleDayIncreaseRequest = () => {
    if (!selectedClass) return;
    
    const newDay = getCurrentDay() + 1;
    setDayAdjustmentModal({
      isOpen: true,
      newDay,
    });
  };

  // Day 조정 모달 닫기
  const handleDayAdjustmentClose = () => {
    setDayAdjustmentModal({
      isOpen: false,
      newDay: 1,
    });
  };

  // Day 조정 확인 후 실제 업데이트
  const handleDayAdjustmentConfirm = async () => {
    if (!selectedClass) return;

    try {
      await updateClassCurrentDay(selectedClass, dayAdjustmentModal.newDay);
      // 클래스 목록 새로고침하여 current_day 반영
      loadInitialData();
      alert(`현재 Day가 ${dayAdjustmentModal.newDay}로 업데이트되었습니다.`);
    } catch (error) {
      console.error("현재 Day 업데이트 실패:", error);
      alert("현재 Day 업데이트에 실패했습니다.");
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

      {/* 고객사 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>고객사 선택</CardTitle>
          <CardDescription>고객사를 선택하면 해당 고객사의 클래스만 표시됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // classes 목록에서 고객사를 유일값으로 도출
              const map = new Map<string, { id: string; name: string }>();
              classes.forEach((c) => {
                const client = (c as any)?.clients as
                  | { id: string; name: string }
                  | undefined;
                if (client?.id && !map.has(client.id)) {
                  map.set(client.id, client);
                }
              });
              const clientList = Array.from(map.values());
              return clientList.map((client) => (
                <Button
                  key={client.id}
                  variant={
                    selectedClientId === client.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedClientId(client.id)}
                >
                  {client.name}
                </Button>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* 클래스 선택 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>클래스 선택</CardTitle>
          <CardDescription>관리할 클래스를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(selectedClientId
              ? classes.filter(
                  (c) => (c as any)?.clients?.id === selectedClientId
                )
              : classes
            ).map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? "default" : "outline"}
                onClick={() => setSelectedClass(cls.id)}
              >
                <div className="flex flex-col items-start leading-tight">
                  <span>{cls.name}</span>
                  {(() => {
                    const anyCls = cls as any;
                    const clientName = anyCls?.clients?.name as string | undefined;
                    return clientName ? (
                      <span className="text-[10px] text-muted-foreground">{clientName}</span>
                    ) : null;
                  })()}
                </div>
              </Button>
            ))}
          </div>

          {selectedClass && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">게임 진행 상황</h4>
              {gameProgressLoading ? (
                // 스켈레톤 로딩 UI
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ) : gameProgress ? (
                // 실제 데이터 표시
                <div className="space-y-4">
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
                      <span className="text-muted-foreground">
                        총 가격 데이터:
                      </span>
                      <span className="ml-2 font-medium">
                        {gameProgress.totalPrices}개
                      </span>
                    </div>
                  </div>

                  {/* 클래스별 current_day 조정 */}
                  {(() => {
                    const selectedClassData = classes.find(
                      (c) => c.id === selectedClass
                    );
                    const currentDay = selectedClassData?.current_day || 1;

                    return (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              클래스 현재 Day:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              Day {currentDay}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDayDecrease}
                              disabled={currentDay <= 1}
                            >
                              -1 Day
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDayIncreaseRequest}
                            >
                              +1 Day
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          현재 Day는 이 클래스의 게임 진행도를 나타냅니다.
                          학생들이 볼 수 있는 최대 Day를 제한합니다.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // 데이터가 없을 때
                <div className="text-sm text-muted-foreground">
                  게임 데이터가 없습니다.
                </div>
              )}
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
      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="news">뉴스 관리</TabsTrigger>
          <TabsTrigger value="prices">가격 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
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

      {/* Day 조정 확인 모달 (+1 Day만) */}
      <DayAdjustmentModal
        isOpen={dayAdjustmentModal.isOpen}
        onClose={handleDayAdjustmentClose}
        onConfirm={handleDayAdjustmentConfirm}
        classId={selectedClass}
        currentDay={getCurrentDay()}
        newDay={dayAdjustmentModal.newDay}
        className={classes.find(c => c.id === selectedClass)?.name || ""}
        stocks={stocks}
      />
    </div>
  );
}
