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
import {
  getNews,
  updateNews,
  deleteNews,
  type News,
} from "@/actions/newsActions";
import StockPriceInput, { type StockPriceInputData } from "./StockPriceInput";

interface GameDayManagementProps {
  selectedClass: string;
  selectedDay: number;
  stocks: Stock[];
  onRefresh: () => void;
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
  const [newsLoading, setNewsLoading] = useState(false);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [savingNewsIndex, setSavingNewsIndex] = useState<number | null>(null);

  const [newsItems, setNewsItems] = useState<NewsInput[]>([
    { title: "", content: "", related_stock_ids: [] },
  ]);
  const [existingNews, setExistingNews] = useState<News[]>([]);

  // 클래스나 Day가 변경될 때마다 상태 초기화 및 기존 뉴스 로드
  useEffect(() => {
    resetForm();
    loadExistingNews();
  }, [selectedClass, selectedDay]);

  const loadExistingNews = async () => {
    if (!selectedClass) {
      setExistingNews([]);
      return;
    }

    setNewsLoading(true);
    try {
      const allNews = await getNews();
      // 현재 클래스와 Day에 해당하는 뉴스만 필터링
      const filteredNews = allNews.filter(
        (news) => news.class_id === selectedClass && news.day === selectedDay
      );
      setExistingNews(filteredNews);
    } catch (error) {
      console.error("기존 뉴스 로드 실패:", error);
      setExistingNews([]);
    } finally {
      setNewsLoading(false);
    }
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

    // 뉴스 유효성 검사
    const validNews = newsItems.filter(
      (news) => news.title.trim() && news.content.trim()
    );
    if (validNews.length === 0) {
      alert("최소 하나의 뉴스를 작성해주세요.");
      return;
    }

    setLoading(true);
    try {
      const gameData: GameData = {
        class_id: selectedClass,
        day: selectedDay,
        stocks: [], // 빈 배열로 설정 (주식 가격은 다른 탭에서 관리)
        news: validNews,
      };

      await createGameDay(gameData);
      resetForm();
      onRefresh();
      alert("뉴스가 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("뉴스 저장 실패:", error);
      alert("뉴스 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewsItems([{ title: "", content: "", related_stock_ids: [] }]);
  };

  const handleUpdateNews = async (
    newsId: string,
    updatedData: Partial<News>
  ) => {
    setEditingNewsId(newsId);
    try {
      await updateNews({
        id: newsId,
        day: selectedDay,
        title: updatedData.title || "",
        content: updatedData.content || "",
        related_stock_ids: updatedData.related_stock_ids || [],
        class_id: selectedClass,
      });
      await loadExistingNews();
      onRefresh();
      alert("뉴스가 성공적으로 수정되었습니다!");
    } catch (error) {
      console.error("뉴스 수정 실패:", error);
      alert("뉴스 수정에 실패했습니다.");
    } finally {
      setEditingNewsId(null);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm("정말로 이 뉴스를 삭제하시겠습니까?")) {
      return;
    }

    setDeletingNewsId(newsId);
    try {
      await deleteNews(newsId);
      await loadExistingNews();
      onRefresh();
      alert("뉴스가 성공적으로 삭제되었습니다!");
    } catch (error) {
      console.error("뉴스 삭제 실패:", error);
      alert("뉴스 삭제에 실패했습니다.");
    } finally {
      setDeletingNewsId(null);
    }
  };

  const handleSaveIndividualNews = async (newsIndex: number) => {
    const news = newsItems[newsIndex];
    if (!selectedClass) {
      alert("클래스를 선택해주세요.");
      return;
    }

    if (!news || !news.title.trim() || !news.content.trim()) {
      alert("뉴스 제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSavingNewsIndex(newsIndex);
    try {
      const gameData: GameData = {
        class_id: selectedClass,
        day: selectedDay,
        stocks: [], // 빈 배열로 설정 (주식 가격은 다른 탭에서 관리)
        news: [news],
      };

      await createGameDay(gameData);

      // 해당 뉴스를 목록에서 제거
      const updatedNewsItems = newsItems.filter(
        (_, index) => index !== newsIndex
      );
      setNewsItems(
        updatedNewsItems.length > 0
          ? updatedNewsItems
          : [{ title: "", content: "", related_stock_ids: [] }]
      );

      await loadExistingNews();
      onRefresh();
      alert("뉴스가 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("뉴스 저장 실패:", error);
      alert("뉴스 저장에 실패했습니다.");
    } finally {
      setSavingNewsIndex(null);
    }
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (!selectedClass) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              클래스를 선택해주세요
            </h3>
            <p className="text-muted-foreground">
              먼저 상단에서 클래스를 선택한 후 Day {selectedDay}의 데이터를
              설정할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}

      {/* Day별 뉴스 관리 통합 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Day {selectedDay} 뉴스 관리</CardTitle>
              <CardDescription>
                기존 뉴스를 확인하고 새로운 뉴스를 작성하세요
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addNewsItem}>
              <Plus className="h-4 w-4 mr-2" />
              뉴스 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">뉴스를 불러오는 중...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 기존 뉴스 목록 */}
              {existingNews.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-sm text-muted-foreground px-2">
                      저장된 뉴스
                    </span>
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  {existingNews.map((news, index) => (
                    <Card
                      key={news.id}
                      className="border-l-4 border-l-green-500"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            뉴스 {index + 1} (저장됨)
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: 수정 모달 열기
                                console.log("뉴스 수정:", news.id);
                              }}
                              disabled={editingNewsId === news.id || deletingNewsId === news.id}
                            >
                              {editingNewsId === news.id ? "수정 중..." : "수정"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteNews(news.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={editingNewsId === news.id || deletingNewsId === news.id}
                            >
                              {deletingNewsId === news.id ? "삭제 중..." : "삭제"}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">제목</Label>
                            <div className="mt-1 p-2 bg-muted rounded">
                              {news.title}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">내용</Label>
                            <div className="mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
                              {news.content}
                            </div>
                          </div>
                          {news.related_stock_ids &&
                            news.related_stock_ids.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium">
                                  관련 주식
                                </Label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {news.related_stock_ids.map((stockId) => {
                                    const stock = stocks.find(
                                      (s) => s.id === stockId
                                    );
                                    return stock ? (
                                      <span
                                        key={stockId}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                      >
                                        {stock.name}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 새 뉴스 작성 */}
              {newsItems.length > 0 && (
                <div className="space-y-4">
                  {existingNews.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="text-sm text-muted-foreground px-2">
                        새 뉴스 작성
                      </span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>
                  )}
                  {newsItems.map((news, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            뉴스 {index + 1}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSaveIndividualNews(index)}
                              disabled={
                                savingNewsIndex === index ||
                                !news.title.trim() ||
                                !news.content.trim()
                              }
                            >
                              {savingNewsIndex === index ? "저장 중..." : "저장"}
                            </Button>
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
              )}

              {/* 뉴스가 없을 때 안내 메시지 */}
              {existingNews.length === 0 && newsItems.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Day {selectedDay}에 작성된 뉴스가 없습니다.
                  </p>
                  <Button variant="outline" onClick={addNewsItem}>
                    <Plus className="h-4 w-4 mr-2" />첫 번째 뉴스 작성하기
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
