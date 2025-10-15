"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  updateClassCurrentDay,
  incrementDayAndPayAllowance,
  type ClassWithRelations,
} from "@/actions/classActions";
import { DayAdjustmentModal } from "./components/DayAdjustmentModal";
import { getGameManagementData } from "@/actions/gameActions";
import { getNews } from "@/actions/newsActions";
import GameDayManagement from "@/components/game/GameDayManagement";
import PriceManagement from "@/components/game/PriceManagement";
import { ClassStockPrice, Stock } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function GameManagementPage() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [dayAdjustmentModal, setDayAdjustmentModal] = useState({
    isOpen: false,
    newDay: 1,
  });
  const isInitialized = useRef(false);

  // 단일 쿼리로 모든 데이터 조회
  const {
    data,
    isLoading,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ["game-management", { classId: selectedClass, day: selectedDay }],
    queryFn: () =>
      getGameManagementData({
        selectedClassId: selectedClass || undefined,
        selectedDay: selectedDay,
      }),
    staleTime: 30_000, // 30초 캐시
  });

  const classes = useMemo(() => data?.classes || [], [data?.classes]);
  const stocks = useMemo(() => data?.stocks || [], [data?.stocks]);
  const gameProgress = useMemo(() => data?.gameProgress || null, [data?.gameProgress]);
  const prices = useMemo(() => data?.prices || [], [data?.prices]);

  // 초기 선택 설정 (한 번만 실행)
  useEffect(() => {
    if (classes.length > 0 && !isInitialized.current) {
      isInitialized.current = true;
      const firstClientId = (classes[0] as any)?.client?.id;
      if (firstClientId) {
        setSelectedClientId(firstClientId);
        const firstClassOfClient = classes.find(
          (c) => (c as any)?.client?.id === firstClientId
        );
        setSelectedClass(firstClassOfClient?.id || classes[0]?.id || "");
      } else {
        setSelectedClass(classes[0]?.id || "");
      }
    }
  }, [classes]);

  const refreshData = () => {
    refetchAll();
  };

  const handleNextDay = async () => {
    if (!selectedClass) return;

    const selectedClassData = classes.find((c) => c.id === selectedClass);
    const totalDays = selectedClassData?.totalDays;

    if (!totalDays) {
      alert("클래스의 최대 Day가 설정되지 않았습니다.");
      return;
    }

    if (selectedDay >= totalDays) {
      alert(`최대 Day는 ${totalDays}입니다. 더 이상 진행할 수 없습니다.`);
      return;
    }

    try {
      const [allNews, currentPrices] = await Promise.all([
        getNews(),
        Promise.resolve(prices), // 이미 로드된 데이터 사용
      ]);

      const currentDayNews = allNews.filter(
        (news) => news.classId === selectedClass && news.day === selectedDay
      );

      const isLastDay = selectedDay === totalDays - 1;

      if (isLastDay) {
        if (currentDayNews.length === 0) {
          alert(`Day ${selectedDay}에 뉴스가 1개 이상 필요합니다.`);
          return;
        }
        if (currentPrices.length === 0) {
          alert(`Day ${selectedDay}에 가격이 설정된 주식이 1개 이상 필요합니다.`);
          return;
        }
      } else {
        if (currentDayNews.length === 0) {
          alert(`Day ${selectedDay}에 뉴스가 1개 이상 필요합니다.`);
          return;
        }
        if (currentPrices.length === 0) {
          alert(`Day ${selectedDay}에 가격이 설정된 주식이 1개 이상 필요합니다.`);
          return;
        }
      }

      setSelectedDay(selectedDay + 1);
    } catch (error) {
      console.error("Day 검증 실패:", error);
      alert("Day 검증에 실패했습니다.");
    }
  };

  const getCurrentDay = () => {
    const selectedClassData = classes.find((c) => c.id === selectedClass);
    return selectedClassData?.currentDay || 1;
  };

  const handleDayDecrease = async () => {
    if (!selectedClass) return;

    const currentDay = getCurrentDay();
    const newDay = Math.max(1, currentDay - 1);
    if (newDay === currentDay) return;

    try {
      await updateClassCurrentDay(selectedClass, newDay);
      queryClient.invalidateQueries({ queryKey: ["game-management"] });
      alert(`현재 Day가 ${newDay}로 업데이트되었습니다.`);
    } catch (error) {
      console.error("Day 감소 실패:", error);
      alert("Day 감소에 실패했습니다.");
    }
  };

  const handleDayIncrease = async () => {
    if (!selectedClass) return;

    const currentDay = getCurrentDay();
    const selectedClassData = classes.find((c) => c.id === selectedClass);
    const totalDays = selectedClassData?.totalDays;

    if (!totalDays) {
      alert("클래스의 최대 Day가 설정되지 않았습니다.");
      return;
    }

    if (currentDay >= totalDays) {
      alert(`최대 Day는 ${totalDays}입니다.`);
      return;
    }

    const newDay = currentDay + 1;

    try {
      await incrementDayAndPayAllowance(selectedClass, newDay);
      queryClient.invalidateQueries({ queryKey: ["game-management"] });
      alert(`Day ${newDay}로 진행되었으며, 용돈이 지급되었습니다.`);
    } catch (error) {
      console.error("Day 증가 실패:", error);
      alert("Day 증가에 실패했습니다.");
    }
  };

  const handleDayAdjustment = () => {
    const currentDay = getCurrentDay();
    setDayAdjustmentModal({ isOpen: true, newDay: currentDay });
  };

  const confirmDayAdjustment = async () => {
    if (!selectedClass) return;

    const newDay = dayAdjustmentModal.newDay;
    const selectedClassData = classes.find((c) => c.id === selectedClass);
    const totalDays = selectedClassData?.totalDays;

    if (!totalDays) {
      alert("클래스의 최대 Day가 설정되지 않았습니다.");
      return;
    }

    if (newDay < 1 || newDay > totalDays) {
      alert(`Day는 1부터 ${totalDays} 사이여야 합니다.`);
      return;
    }

    try {
      await updateClassCurrentDay(selectedClass, newDay);
      queryClient.invalidateQueries({ queryKey: ["game-management"] });
      setDayAdjustmentModal({ ...dayAdjustmentModal, isOpen: false });
      alert(`현재 Day가 ${newDay}로 업데이트되었습니다.`);
    } catch (error) {
      console.error("Day 조정 실패:", error);
      alert("Day 조정에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">게임 관리 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const uniqueClients = Array.from(
    new Set(classes.map((c: any) => c.client?.id).filter(Boolean))
  ).map((clientId) => {
    const classWithClient = classes.find((c: any) => c.client?.id === clientId);
    return (classWithClient as any)?.client;
  });

  const classesOfSelectedClient = classes.filter(
    (c: any) => c.client?.id === selectedClientId
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>게임 관리</CardTitle>
          <CardDescription>
            주식 게임의 종목, Day별 뉴스, 가격을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 클래스 선택 */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                고객사 선택
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  const newClientId = e.target.value;
                  setSelectedClientId(newClientId);
                  // 고객사 변경 시 해당 고객사의 첫 클래스 자동 선택
                  if (newClientId) {
                    const classesOfClient = classes.filter(
                      (c: any) => c.client?.id === newClientId
                    );
                    if (classesOfClient.length > 0) {
                      setSelectedClass(classesOfClient[0].id);
                    } else {
                      setSelectedClass("");
                    }
                  } else {
                    setSelectedClass("");
                  }
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">고객사를 선택하세요</option>
                {uniqueClients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientId && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  클래스 선택
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">클래스를 선택하세요</option>
                  {classesOfSelectedClient.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (현재 Day: {cls.currentDay})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 게임 진행 상황 */}
          {selectedClass && gameProgress && (
            <Card className="mb-6 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">게임 진행 상황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">최대 Day</p>
                    <p className="text-2xl font-bold">{gameProgress.maxDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">총 뉴스</p>
                    <p className="text-2xl font-bold">{gameProgress.totalNews}개</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">총 가격 데이터</p>
                    <p className="text-2xl font-bold">{gameProgress.totalPrices}개</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Day 조정 버튼 */}
          {selectedClass && (
            <div className="mb-6 flex gap-2">
              <Button onClick={handleDayDecrease} variant="outline">
                Day 감소 (-1)
              </Button>
              <Button onClick={handleDayIncrease}>
                Day 증가 (+1, 용돈 지급)
              </Button>
              <Button onClick={handleDayAdjustment} variant="secondary">
                Day 직접 조정
              </Button>
              <Button onClick={refreshData} variant="outline">
                새로고침
              </Button>
            </div>
          )}

          {/* 탭 */}
          {selectedClass && (
            <Tabs defaultValue="stock-management" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stock-management">주식 관리</TabsTrigger>
                <TabsTrigger value="game-day-management">
                  게임 Day 관리
                </TabsTrigger>
                <TabsTrigger value="price-management">가격 관리</TabsTrigger>
              </TabsList>

              <TabsContent value="stock-management">
                <Card>
                  <CardHeader>
                    <CardTitle>주식 종목 관리</CardTitle>
                    <CardDescription>
                      게임에 사용할 주식 종목을 관리합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stocks.map((stock: Stock) => (
                        <div
                          key={stock.id}
                          className="p-3 border rounded flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{stock.name}</p>
                            <p className="text-sm text-gray-500">
                              {stock.symbol}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="game-day-management">
                <GameDayManagement
                  selectedClass={selectedClass}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  stocks={stocks}
                  onNextDay={handleNextDay}
                  onRefresh={refreshData}
                />
              </TabsContent>

              <TabsContent value="price-management">
                <PriceManagement
                  selectedClass={selectedClass}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  stocks={stocks}
                  prices={prices}
                  onRefresh={refreshData}
                  maxDay={gameProgress?.maxDay || 0}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Day 조정 모달 */}
      <DayAdjustmentModal
        isOpen={dayAdjustmentModal.isOpen}
        currentDay={dayAdjustmentModal.newDay}
        onClose={() =>
          setDayAdjustmentModal({ ...dayAdjustmentModal, isOpen: false })
        }
        onConfirm={confirmDayAdjustment}
        onDayChange={(day) =>
          setDayAdjustmentModal({ ...dayAdjustmentModal, newDay: day })
        }
      />
    </div>
  );
}
