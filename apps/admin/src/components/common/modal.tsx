"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@repo/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdropClick = true,
}: ModalProps) {
  // ESC 키 입력 시 모달 닫기
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg p-6 w-full ${sizeClasses[size]} mx-4 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {showCloseButton && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              type="button"
            >
              ✕
            </Button>
          )}
        </div>

        {/* 컨텐츠 */}
        <div>{children}</div>
      </div>
    </div>
  );
}
