"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import {
  createStockPrice,
  updateStockPrice,
  deleteStockPrice,
} from "@/actions/gameActions";
import { getNews } from "@/actions/newsActions";
import { ClassStockPrice, ClassStockPriceInput, News, Stock } from "@/types";

interface PriceManagementProps {
  prices: ClassStockPrice[];
  selectedClass: string;
  selectedDay: number;
  stocks: Stock[];
  onRefresh: () => void;
}

export default function PriceManagement({
  prices,
  selectedClass,
  selectedDay,
  stocks,
  onRefresh,
}: PriceManagementProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ClassStockPrice | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [previousDayNews, setPreviousDayNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [formData, setFormData] = useState<ClassStockPriceInput>({
    classId: selectedClass,
    stockId: "",
    day: selectedDay,
    price: "10000",
  });

  // 전날 뉴스 로드
  const loadPreviousDayNews = async () => {
    if (!selectedClass || selectedDay <= 1) {
      setPreviousDayNews([]);
      return;
    }

    setNewsLoading(true);
    try {
      const allNews = await getNews();
      const filteredNews = allNews.filter(
        (news) => news.classId === selectedClass && news.day === selectedDay - 1
      );
      setPreviousDayNews(filteredNews);
    } catch (error) {
      console.error("전날 뉴스 로드 실패:", error);
      setPreviousDayNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  // 클래스나 Day 변경 시 전날 뉴스 로드
  useEffect(() => {
    loadPreviousDayNews();
  }, [selectedClass, selectedDay]);

  const resetForm = () => {
    setFormData({
      classId: selectedClass,
      stockId: "",
      day: selectedDay,
      price: "10000",
    });
  };

  const handleCreate = async () => {
    if (!formData.stockId || Number(formData.price) <= 0) return;

    setLoading(true);
    try {
      await createStockPrice(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
      // invalidate related caches for consistency (progress/prices)
      if (selectedClass) {
        queryClient.invalidateQueries({ queryKey: ["game", "progress", selectedClass] });
        queryClient.invalidateQueries({ queryKey: ["game", "prices", { classId: selectedClass, day: selectedDay }] });
      }
    } catch (error) {
      console.error("주식 가격 생성 실패:", error);
      alert("주식 가격 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingPrice || !formData.stockId || Number(formData.price) <= 0)
      return;

    setLoading(true);
    try {
      const updateData: ClassStockPriceInput = {
        ...formData,
        id: editingPrice.id,
      };
      await updateStockPrice(updateData);
      setIsEditDialogOpen(false);
      setEditingPrice(null);
      resetForm();
      onRefresh();
      // invalidate related caches for consistency (progress/prices)
      if (selectedClass) {
        queryClient.invalidateQueries({ queryKey: ["game", "progress", selectedClass] });
        queryClient.invalidateQueries({ queryKey: ["game", "prices", { classId: selectedClass, day: selectedDay }] });
      }
    } catch (error) {
      console.error("주식 가격 수정 실패:", error);
      alert("주식 가격 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (price: ClassStockPrice) => {
    const stockName =
      stocks.find((s) => s.id === price.stockId)?.name || "알 수 없는 주식";
    if (
      !confirm(
        `Day ${price.day}의 "${stockName}" 가격 데이터를 삭제하시겠습니까?`
      )
    )
      return;

    setLoading(true);
    try {
      await deleteStockPrice(price.id);
      onRefresh();
      // invalidate related caches for consistency (progress/prices)
      if (selectedClass) {
        queryClient.invalidateQueries({ queryKey: ["game", "progress", selectedClass] });
        queryClient.invalidateQueries({ queryKey: ["game", "prices", { classId: selectedClass, day: selectedDay }] });
      }
    } catch (error) {
      console.error("주식 가격 삭제 실패:", error);
      alert("주식 가격 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (price: ClassStockPrice) => {
    setEditingPrice(price);
    setFormData({
      classId: price.classId || selectedClass,
      stockId: price.stockId || "",
      day: price.day ?? selectedDay,
      price: price.price ?? "10000",
    });
    setIsEditDialogOpen(true);
  };

  const getStockName = (stockId: string) => {
    return stocks.find((s) => s.id === stockId)?.name || "알 수 없는 주식";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  // 이미 가격이 설정된 주식들을 제외한 주식 목록
  const availableStocks = stocks.filter(
    (stock) => !prices.some((price) => price.stockId === stock.id)
  );

  return (
    <div className="space-y-6">
      {/* 전날 뉴스 참고 섹션 */}
      {selectedDay > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Day {selectedDay - 1} 뉴스 참고 (가격 설정 참고용)
            </CardTitle>
            <CardDescription>
              이 뉴스들이 Day {selectedDay} 주식 가격에 영향을 주었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {newsLoading ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground">
                  뉴스를 불러오는 중...
                </div>
              </div>
            ) : previousDayNews.length > 0 ? (
              <div className="space-y-3">
                {previousDayNews.map((news, index) => (
                  <div
                    key={news.id}
                    className="border rounded-lg p-4 bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        뉴스 {index + 1}: {news.title}
                      </h4>
                      {news.relatedStockIds &&
                        news.relatedStockIds.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {news.relatedStockIds.map((stockId) => {
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
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {news.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-muted-foreground">
                  Day {selectedDay - 1}에 작성된 뉴스가 없습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 주식 가격 관리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>주식 가격 관리 (Day {selectedDay})</CardTitle>
              <CardDescription>
                Day {selectedDay}의 주식 가격을 관리합니다
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  disabled={!selectedClass || availableStocks.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  가격 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 주식 가격 추가</DialogTitle>
                  <DialogDescription>
                    Day {selectedDay}의 새로운 주식 가격을 설정하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stock">주식 선택 *</Label>
                    <Select
                      value={formData.stockId ?? undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, stockId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="주식을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStocks.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id}>
                            {stock.name} ({stock.marketCountryCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">가격 *</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="price"
                        type="number"
                        value={Number(formData.price)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: e.target.value,
                          })
                        }
                        placeholder="가격을 입력하세요"
                        min="0"
                        step="100"
                      />
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      loading ||
                      !formData.stockId ||
                      Number(formData.price) <= 0
                    }
                  >
                    {loading ? "생성 중..." : "생성"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prices.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Day {selectedDay}의 주식 가격이 없습니다
                </h3>
                <p className="text-muted-foreground mb-4">
                  새로운 주식 가격을 추가해보세요.
                </p>
                {!selectedClass && (
                  <p className="text-sm text-red-500">
                    먼저 클래스를 선택해주세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prices.map((price) => (
                  <Card
                    key={price.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {getStockName(price.stockId || "")}
                          </CardTitle>
                          <CardDescription>Day {price.day}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(price)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(price)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(Number(price.price))}원
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(price.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {availableStocks.length === 0 && prices.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                모든 주식의 가격이 설정되었습니다.
              </div>
            )}
          </div>

          {/* 수정 다이얼로그 */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>주식 가격 수정</DialogTitle>
                <DialogDescription>
                  주식 가격 정보를 수정하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-stock">주식 선택 *</Label>
                  <Select
                    value={formData.stockId ?? undefined}
                    onValueChange={(value) =>
                      setFormData({ ...formData, stockId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="주식을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {stocks.map((stock) => (
                        <SelectItem key={stock.id} value={stock.id}>
                          {stock.name} ({stock.marketCountryCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-price">가격 *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit-price"
                      type="number"
                      value={Number(formData.price)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: e.target.value,
                        })
                      }
                      placeholder="가격을 입력하세요"
                      min="0"
                      step="100"
                    />
                    <span className="text-sm text-muted-foreground">원</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={
                    loading || !formData.stockId || Number(formData.price) <= 0
                  }
                >
                  {loading ? "수정 중..." : "수정"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
