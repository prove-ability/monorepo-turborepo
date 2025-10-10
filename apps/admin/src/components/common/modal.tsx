"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@repo/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  customHeader?: ReactNode;
  maxHeight?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  customHeader,
  maxHeight = "90vh",
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-2xl flex flex-col`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 커스텀 헤더 또는 기본 헤더 */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              {typeof title === "string" ? (
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                type="button"
                aria-label="닫기"
              >
                ✕
              </Button>
            )}
          </div>
        )}

        {/* 컨텐츠 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* 푸터 */}
        {footer && (
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
