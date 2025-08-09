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
import { getNewsByClassAndDay, type News } from "@/actions/newsActions";
import {
  getClassStockPrices,
  type ClassStockPrice,
} from "@/actions/gameActions";
import { type Stock } from "@/actions/stockActions";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      loadPreviewData();
    }
  }, [isOpen, classId, newDay]);

  const loadPreviewData = async () => {
    setLoading(true);
    try {
      const [newsData, pricesData] = await Promise.all([
        getNewsByClassAndDay(classId, newDay),
        getClassStockPrices(classId, newDay),
      ]);
      setNews(newsData);
      setPrices(pricesData);
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {prices.map((price) => (
                          <div
                            key={price.id}
                            className="border rounded-lg p-3 text-center bg-muted/30"
                          >
                            <div className="font-medium text-sm mb-1">
                              {getStockName(price.stock_id || "")}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              ₩{price.price.toLocaleString()}
                            </div>
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
