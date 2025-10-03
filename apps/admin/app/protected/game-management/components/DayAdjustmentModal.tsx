"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsByClassAndDay } from "@/actions/newsActions";
import { getClassStockPrices } from "@/actions/gameActions";
import { ClassStockPrice, Stock, News } from "@/types";

interface DayAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  classId: string;
  currentDay: number;
  newDay: number;
  className: string;
  stocks: Stock[];
}

export function DayAdjustmentModal({
  isOpen,
  onClose,
  onConfirm,
  classId,
  currentDay,
  newDay,
  className,
  stocks,
}: DayAdjustmentModalProps) {
  const [news, setNews] = useState<News[]>([]);
  const [prices, setPrices] = useState<ClassStockPrice[]>([]);
  const [prevPrices, setPrevPrices] = useState<ClassStockPrice[]>([]);
  const [prevNews, setPrevNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      loadPreviewData();
    }
  }, [isOpen, classId, newDay]);

  const loadPreviewData = async () => {
    setLoading(true);
    try {
      const fetches: Promise<any>[] = [
        // 0: 다음 Day 뉴스, 1: 다음 Day 가격
        getNewsByClassAndDay(classId, newDay),
        getClassStockPrices(classId, newDay),
      ];
      // newDay > 1인 경우 전날 가격, 전날 뉴스도 조회 (고정된 순서로 push)
      if (newDay > 1) {
        // 2: 전날 가격, 3: 전날 뉴스
        fetches.push(getClassStockPrices(classId, newDay - 1));
        fetches.push(getNewsByClassAndDay(classId, newDay - 1));
      }

      const results = await Promise.all(fetches);
      const newsData = results[0] as News[];
      const pricesData = results[1] as ClassStockPrice[];
      const prevPricesData =
        (newDay > 1 ? (results[2] as ClassStockPrice[]) : []) || [];
      const prevNewsData = (newDay > 1 ? (results[3] as News[]) : []) || [];
      setNews(newsData);
      setPrices(pricesData);
      setPrevPrices(prevPricesData);
      setPrevNews(prevNewsData);
    } catch (error) {
      console.error("미리보기 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // 주식 ID로 주식 이름 찾기
  const getStockName = (stockId: string) => {
    const stock = stocks.find((s) => s.id === stockId);
    return stock?.name || `주식 ${stockId}`;
  };

  const dayChange = newDay - currentDay;
  const isIncreasing = dayChange > 0;
  // 다음 Day 진행 가능 여부: 증가일 때 뉴스와 가격이 모두 1개 이상 있어야 함
  const canConfirm =
    !loading && (!isIncreasing || (news.length > 0 && prices.length > 0));

  // 전날 대비 변화 계산 헬퍼
  const getPrevPrice = (stockId?: string) => {
    if (!stockId) return undefined;
    const prev = prevPrices.find((p) => p.stockId === stockId);
    return prev?.price ? Number(prev.price) : undefined;
  };
  const getChangeInfo = (stockId?: string, current?: number) => {
    const prev = getPrevPrice(stockId);
    if (prev === undefined || current === undefined)
      return {
        delta: undefined,
        dir: "none" as const,
        percent: undefined as number | undefined,
      };
    const delta = current - prev;
    const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const percent = prev > 0 ? (delta / prev) * 100 : undefined;
    return { delta, dir, percent };
  };

  // 전날 뉴스 중 해당 종목과 관련된 뉴스 필터링
  const getPrevRelatedNews = (stockId?: string) => {
    if (!stockId || prevNews.length === 0) return [] as News[];
    return prevNews.filter(
      (n) =>
        Array.isArray(n.relatedStockIds) && n.relatedStockIds?.includes(stockId)
    );
  };

  // 긴 뉴스 본문을 미리보기용으로 자르기
  const truncate = (text?: string, max = 100) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max) + "…";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Day 조정 확인 - {className}</DialogTitle>
          <DialogDescription>
            현재 Day {currentDay}에서 Day {newDay}로
            {isIncreasing ? "진행" : "되돌리기"}하시겠습니까?
            {isIncreasing && " 다음은 Day " + newDay + "에 공개될 내용입니다."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">데이터를 불러오는 중...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Day 변경 정보 - 컴팩트 */}
            <div className="flex items-center justify-center gap-3 py-4 bg-muted/30 rounded-lg">
              <Badge variant="outline" className="px-2 py-1">
                Day {currentDay}
              </Badge>
              <span className="text-lg">→</span>
              <Badge
                variant={isIncreasing ? "default" : "destructive"}
                className="px-2 py-1"
              >
                Day {newDay}
              </Badge>
            </div>

            {isIncreasing && (
              <>
                {/* 뉴스 미리보기 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Day {newDay} 뉴스 ({news.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {news.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Day {newDay}에 등록된 뉴스가 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {news.map((item) => (
                          <div
                            key={item.id}
                            className="border rounded-lg p-3 bg-muted/30"
                          >
                            <h4 className="font-medium mb-1">{item.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 주식 가격 미리보기 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Day {newDay} 주식 가격 ({prices.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prices.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Day {newDay}에 등록된 주식 가격이 없습니다.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {prices.map((price) => (
                          <div
                            key={price.id}
                            className="border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="font-medium text-lg">
                                {getStockName(price.stockId || "")}
                              </div>
                              {(() => {
                                const { delta, dir, percent } = getChangeInfo(
                                  price.stockId || undefined,
                                  price.price ? Number(price.price) : undefined
                                );
                                const textColor =
                                  dir === "up"
                                    ? "text-green-700"
                                    : dir === "down"
                                      ? "text-red-700"
                                      : "text-gray-700";
                                const badgeTone =
                                  dir === "up"
                                    ? "bg-green-50 dark:bg-green-950/20 border-green-200/60"
                                    : dir === "down"
                                      ? "bg-red-50 dark:bg-red-950/20 border-red-200/60"
                                      : "bg-gray-100 dark:bg-gray-900/40 border-gray-300/40";
                                const arrow =
                                  dir === "up"
                                    ? "▲"
                                    : dir === "down"
                                      ? "▼"
                                      : "■";
                                return (
                                  <div className="text-right">
                                    <div className="text-xl md:text-2xl font-extrabold text-blue-600">
                                      ₩{Number(price.price).toLocaleString()}
                                    </div>
                                    <div
                                      className={`text-xs font-medium inline-block rounded px-1.5 py-0.5 border ${badgeTone} ${textColor}`}
                                    >
                                      {prevPrices.length > 0 ? (
                                        <>
                                          {arrow}
                                          {delta !== undefined
                                            ? ` ${delta > 0 ? "+" : ""}${delta.toLocaleString()}`
                                            : " -"}
                                          {percent !== undefined
                                            ? ` (${percent > 0 ? "+" : ""}${percent.toFixed(2)}%)`
                                            : ""}
                                        </>
                                      ) : (
                                        "전날 데이터 없음"
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {(() => {
                              const related = getPrevRelatedNews(
                                price.stockId || undefined
                              );
                              return (
                                <div className="mt-2 pt-2 border-t">
                                  {related.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      전날 관련 뉴스 없음
                                    </p>
                                  ) : (
                                    <div className="mt-1 space-y-2">
                                      {related.map((n) => (
                                        <div
                                          key={n.id}
                                          className="rounded-md border p-2 bg-background/60"
                                        >
                                          <div className="text-xs font-semibold">
                                            {n.title}
                                          </div>
                                          {n.content && (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                              {truncate(n.content, 120)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* 진행 불가 안내 (증가 시 데이터 미존재) */}
            {isIncreasing &&
              !loading &&
              (news.length === 0 || prices.length === 0) && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  다음 Day에 {news.length === 0 ? "뉴스" : ""}
                  {news.length === 0 && prices.length === 0 ? "와 " : ""}
                  {prices.length === 0 ? "주식 가격" : ""} 데이터가 없습니다.
                  등록 후 진행해 주세요.
                </div>
              )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isIncreasing ? "default" : "destructive"}
            disabled={!canConfirm}
          >
            {isIncreasing ? `Day ${newDay}로 진행` : `Day ${newDay}로 되돌리기`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
