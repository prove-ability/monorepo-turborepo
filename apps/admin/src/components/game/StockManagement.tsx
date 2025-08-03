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
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  createStock,
  updateStock,
  deleteStock,
  type Stock,
  type CreateStockData,
  type UpdateStockData,
} from "@/actions/stockActions";

interface StockManagementProps {
  stocks: Stock[];
  onRefresh: () => void;
}

export default function StockManagement({
  stocks,
  onRefresh,
}: StockManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStockData>({
    name: "",
    industry_sector: "",
    remarks: "",
    market_country_code: "KR",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      industry_sector: "",
      remarks: "",
      market_country_code: "KR",
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await createStock(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("주식 생성 실패:", error);
      alert("주식 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingStock || !formData.name.trim()) return;

    setLoading(true);
    try {
      const updateData: UpdateStockData = {
        id: editingStock.id,
        ...formData,
      };
      await updateStock(updateData);
      setIsEditDialogOpen(false);
      setEditingStock(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("주식 수정 실패:", error);
      alert("주식 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stock: Stock) => {
    if (!confirm(`"${stock.name}" 주식을 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      await deleteStock(stock.id);
      onRefresh();
    } catch (error) {
      console.error("주식 삭제 실패:", error);
      alert("주식 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      name: stock.name,
      industry_sector: stock.industry_sector || "",
      remarks: stock.remarks || "",
      market_country_code: stock.market_country_code,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>주식 관리</CardTitle>
            <CardDescription>게임에서 사용할 주식을 관리합니다</CardDescription>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                주식 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 주식 추가</DialogTitle>
                <DialogDescription>
                  새로운 주식 정보를 입력하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">주식명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 삼성전자"
                  />
                </div>
                <div>
                  <Label htmlFor="industry_sector">산업 섹터</Label>
                  <Input
                    id="industry_sector"
                    value={formData.industry_sector}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        industry_sector: e.target.value,
                      })
                    }
                    placeholder="예: 반도체"
                  />
                </div>
                <div>
                  <Label htmlFor="market_country_code">시장 국가 코드 *</Label>
                  <Select
                    value={formData.market_country_code}
                    onValueChange={(value) =>
                      setFormData({ ...formData, market_country_code: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KR">한국 (KR)</SelectItem>
                      <SelectItem value="US">미국 (US)</SelectItem>
                      <SelectItem value="JP">일본 (JP)</SelectItem>
                      <SelectItem value="CN">중국 (CN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="remarks">비고</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    placeholder="추가 정보나 설명"
                  />
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
                  disabled={loading || !formData.name.trim()}
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
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 주식이 없습니다. 새 주식을 추가해보세요.
            </div>
          ) : (
            stocks.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{stock.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>산업: {stock.industry_sector || "미지정"}</p>
                    <p>시장: {stock.market_country_code}</p>
                    {stock.remarks && <p>비고: {stock.remarks}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(stock)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(stock)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>주식 수정</DialogTitle>
              <DialogDescription>주식 정보를 수정하세요</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">주식명 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 삼성전자"
                />
              </div>
              <div>
                <Label htmlFor="edit-industry_sector">산업 섹터</Label>
                <Input
                  id="edit-industry_sector"
                  value={formData.industry_sector}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industry_sector: e.target.value,
                    })
                  }
                  placeholder="예: 반도체"
                />
              </div>
              <div>
                <Label htmlFor="edit-market_country_code">
                  시장 국가 코드 *
                </Label>
                <Select
                  value={formData.market_country_code}
                  onValueChange={(value) =>
                    setFormData({ ...formData, market_country_code: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KR">한국 (KR)</SelectItem>
                    <SelectItem value="US">미국 (US)</SelectItem>
                    <SelectItem value="JP">일본 (JP)</SelectItem>
                    <SelectItem value="CN">중국 (CN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-remarks">비고</Label>
                <Textarea
                  id="edit-remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  placeholder="추가 정보나 설명"
                />
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
                disabled={loading || !formData.name.trim()}
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
