"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DaySelectionModalProps {
  isOpen: boolean;
  currentDay: number;
  maxDay?: number;
  onClose: () => void;
  onConfirm: () => void;
  onDayChange: (day: number) => void;
}

export function DaySelectionModal({
  isOpen,
  currentDay,
  maxDay = 100,
  onClose,
  onConfirm,
  onDayChange,
}: DaySelectionModalProps) {
  const handlePrevDay = () => {
    if (currentDay > 1) {
      onDayChange(currentDay - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDay < maxDay) {
      onDayChange(currentDay + 1);
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>조회할 Day 선택</DialogTitle>
          <DialogDescription>
            게임 Day 관리와 가격 관리에서 조회할 Day를 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-8">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            disabled={currentDay <= 1}
            className="h-12 w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">선택된 Day</span>
            <div className="text-5xl font-bold text-primary">
              {currentDay}
            </div>
            <span className="text-xs text-muted-foreground">
              (최대: Day {maxDay})
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            disabled={currentDay >= maxDay}
            className="h-12 w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm}>
            Day {currentDay} 선택
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
