"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Calendar } from "lucide-react";
import { createGameDay, type GameData } from "@/actions/gameActions";
import { type Stock } from "@/actions/stockActions";

interface GameDayManagementProps {
  selectedClass: string;
  selectedDay: number;
  stocks: Stock[];
  onRefresh: () => void;
}

interface StockPriceInput {
  stock_id: string;
  price: number;
}

interface NewsInput {
  title: string;
  content: string;
  related_stock_ids: string[];
}

export default function GameDayManagement({
  selectedClass,
  selectedDay,
  stocks,
  onRefresh,
}: GameDayManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockPrices, setStockPrices] = useState<StockPriceInput[]>([]);
  const [newsItems, setNewsItems] = useState<NewsInput[]>([
    { title: "", content: "", related_stock_ids: [] },
  ]);

  const initializeStockPrices = () => {
    setStockPrices(
      stocks.map((stock) => ({
        stock_id: stock.id,
        price: 10000, // 기본 가격
      }))
    );
  };

  const addNewsItem = () => {
    setNewsItems([
      ...newsItems,
      { title: "", content: "", related_stock_ids: [] },
    ]);
  };

  const removeNewsItem = (index: number) => {
    if (newsItems.length > 1) {
      setNewsItems(newsItems.filter((_, i) => i !== index));
    }
  };

  const updateNewsItem = (
    index: number,
    field: keyof NewsInput,
    value: any
  ) => {
    const updated = [...newsItems];
    const currentItem = updated[index];
    if (currentItem) {
      updated[index] = {
        title: currentItem.title || "",
        content: currentItem.content || "",
        related_stock_ids: currentItem.related_stock_ids || [],
        [field]: value,
      };
      setNewsItems(updated);
    }
  };

  const updateStockPrice = (stockId: string, price: number) => {
    setStockPrices((prev) =>
      prev.map((item) =>
        item.stock_id === stockId ? { ...item, price } : item
      )
    );
  };

  const toggleStockInNews = (newsIndex: number, stockId: string) => {
    const updated = [...newsItems];
    const currentItem = updated[newsIndex];

    if (currentItem) {
      const relatedStocks = currentItem.related_stock_ids;

      if (relatedStocks.includes(stockId)) {
        updated[newsIndex] = {
          ...currentItem,
          related_stock_ids: relatedStocks.filter((id) => id !== stockId),
        };
      } else {
        updated[newsIndex] = {
          ...currentItem,
          related_stock_ids: [...relatedStocks, stockId],
        };
      }

      setNewsItems(updated);
    }
  };

  const handleCreateGameDay = async () => {
    if (!selectedClass) {
      alert("클래스를 선택해주세요.");
      return;
    }

    const validNews = newsItems.filter(
      (news) => news.title.trim() && news.content.trim()
    );
    if (validNews.length === 0) {
      alert("최소 하나의 뉴스를 작성해주세요.");
      return;
    }

    const validPrices = stockPrices.filter((price) => price.price > 0);
    if (validPrices.length === 0) {
      alert("최소 하나의 주식 가격을 설정해주세요.");
      return;
    }

    setLoading(true);
    try {
      const gameData: GameData = {
        class_id: selectedClass,
        day: selectedDay,
        stocks: validPrices,
        news: validNews,
      };

      await createGameDay(gameData);
      setIsDialogOpen(false);
      resetForm();
      onRefresh();
      alert("게임 Day가 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("게임 Day 생성 실패:", error);
      alert("게임 Day 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStockPrices([]);
    setNewsItems([{ title: "", content: "", related_stock_ids: [] }]);
  };

  const openDialog = () => {
    initializeStockPrices();
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>게임 Day 관리</CardTitle>
            <CardDescription>
              특정 Day의 뉴스와 주식 가격을 일괄 설정합니다
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog} disabled={!selectedClass}>
                <Calendar className="h-4 w-4 mr-2" />
                Day {selectedDay} 설정
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Day {selectedDay} 게임 데이터 설정</DialogTitle>
                <DialogDescription>
                  이 Day의 뉴스와 주식 가격을 설정하세요
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* 뉴스 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">뉴스</h3>
                    <Button variant="outline" size="sm" onClick={addNewsItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      뉴스 추가
                    </Button>
                  </div>

                  {newsItems.map((news, index) => (
                    <Card key={index} className="mb-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            뉴스 {index + 1}
                          </CardTitle>
                          {newsItems.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeNewsItem(index)}
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>제목 *</Label>
                          <Input
                            value={news.title}
                            onChange={(e) =>
                              updateNewsItem(index, "title", e.target.value)
                            }
                            placeholder="뉴스 제목을 입력하세요"
                          />
                        </div>
                        <div>
                          <Label>내용 *</Label>
                          <Textarea
                            value={news.content}
                            onChange={(e) =>
                              updateNewsItem(index, "content", e.target.value)
                            }
                            placeholder="뉴스 내용을 입력하세요"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>관련 주식</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {stocks.map((stock) => (
                              <Button
                                key={stock.id}
                                variant={
                                  news.related_stock_ids.includes(stock.id)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  toggleStockInNews(index, stock.id)
                                }
                              >
                                {stock.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 주식 가격 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">주식 가격</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stockPrices.map((priceItem) => {
                      const stock = stocks.find(
                        (s) => s.id === priceItem.stock_id
                      );
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
                                <span className="text-sm text-muted-foreground">
                                  원
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button onClick={handleCreateGameDay} disabled={loading}>
                  {loading ? "생성 중..." : `Day ${selectedDay} 생성`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">게임 Day 설정</h3>
          <p className="text-muted-foreground mb-4">
            선택된 클래스와 Day에 대한 뉴스와 주식 가격을 일괄 설정할 수
            있습니다.
          </p>
          {!selectedClass && (
            <p className="text-sm text-red-500">먼저 클래스를 선택해주세요.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
