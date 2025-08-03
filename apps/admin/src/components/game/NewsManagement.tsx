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
import { Plus, Edit, Trash2, Newspaper } from "lucide-react";
import {
  createNews,
  updateNews,
  deleteNews,
  type News,
  type CreateNewsData,
  type UpdateNewsData,
} from "@/actions/newsActions";
import { type Stock } from "@/actions/stockActions";

interface NewsManagementProps {
  news: News[];
  selectedDay: number;
  stocks: Stock[];
  onRefresh: () => void;
}

export default function NewsManagement({
  news,
  selectedDay,
  stocks,
  onRefresh,
}: NewsManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateNewsData>({
    day: selectedDay,
    title: "",
    content: "",
    related_stock_ids: [],
  });

  const resetForm = () => {
    setFormData({
      day: selectedDay,
      title: "",
      content: "",
      related_stock_ids: [],
    });
  };

  const toggleStockInNews = (stockId: string) => {
    const relatedStocks = formData.related_stock_ids || [];

    if (relatedStocks.includes(stockId)) {
      setFormData({
        ...formData,
        related_stock_ids: relatedStocks.filter((id) => id !== stockId),
      });
    } else {
      setFormData({
        ...formData,
        related_stock_ids: [...relatedStocks, stockId],
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setLoading(true);
    try {
      await createNews(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("뉴스 생성 실패:", error);
      alert("뉴스 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingNews || !formData.title.trim() || !formData.content.trim())
      return;

    setLoading(true);
    try {
      const updateData: UpdateNewsData = {
        id: editingNews.id,
        ...formData,
      };
      await updateNews(updateData);
      setIsEditDialogOpen(false);
      setEditingNews(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("뉴스 수정 실패:", error);
      alert("뉴스 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (newsItem: News) => {
    if (!confirm(`"${newsItem.title}" 뉴스를 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      await deleteNews(newsItem.id);
      onRefresh();
    } catch (error) {
      console.error("뉴스 삭제 실패:", error);
      alert("뉴스 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      day: newsItem.day,
      title: newsItem.title,
      content: newsItem.content,
      related_stock_ids: newsItem.related_stock_ids || [],
    });
    setIsEditDialogOpen(true);
  };

  const getRelatedStockNames = (stockIds: string[] = []) => {
    return stockIds
      .map((id) => stocks.find((stock) => stock.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>뉴스 관리 (Day {selectedDay})</CardTitle>
            <CardDescription>
              Day {selectedDay}의 뉴스를 관리합니다
            </CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                뉴스 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 뉴스 추가</DialogTitle>
                <DialogDescription>
                  Day {selectedDay}의 새로운 뉴스를 작성하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="뉴스 제목을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="content">내용 *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="뉴스 내용을 입력하세요"
                    rows={5}
                  />
                </div>
                <div>
                  <Label>관련 주식</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stocks.map((stock) => (
                      <Button
                        key={stock.id}
                        variant={
                          (formData.related_stock_ids || []).includes(stock.id)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleStockInNews(stock.id)}
                      >
                        {stock.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    이 뉴스와 관련된 주식을 선택하세요
                  </p>
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
                    !formData.title.trim() ||
                    !formData.content.trim()
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
          {news.length === 0 ? (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Day {selectedDay}의 뉴스가 없습니다
              </h3>
              <p className="text-muted-foreground mb-4">
                새로운 뉴스를 추가해보세요.
              </p>
            </div>
          ) : (
            news.map((newsItem) => (
              <Card key={newsItem.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {newsItem.title}
                      </CardTitle>
                      <CardDescription>
                        Day {newsItem.day} •{" "}
                        {new Date(newsItem.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(newsItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(newsItem)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3 whitespace-pre-wrap">
                    {newsItem.content}
                  </p>
                  {newsItem.related_stock_ids &&
                    newsItem.related_stock_ids.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">관련 주식:</span>{" "}
                        {getRelatedStockNames(newsItem.related_stock_ids)}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>뉴스 수정</DialogTitle>
              <DialogDescription>뉴스 정보를 수정하세요</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">제목 *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="뉴스 제목을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="edit-content">내용 *</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="뉴스 내용을 입력하세요"
                  rows={5}
                />
              </div>
              <div>
                <Label>관련 주식</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {stocks.map((stock) => (
                    <Button
                      key={stock.id}
                      variant={
                        (formData.related_stock_ids || []).includes(stock.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleStockInNews(stock.id)}
                    >
                      {stock.name}
                    </Button>
                  ))}
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
                  loading || !formData.title.trim() || !formData.content.trim()
                }
              >
                {loading ? "수정 중..." : "수정"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
