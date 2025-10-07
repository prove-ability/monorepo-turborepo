"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerContent?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  minHeight?: string;
  showHeader?: boolean;
  headerClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  headerContent,
  children,
  maxWidth = "lg",
  minHeight = "400px",
  showHeader = true,
  headerClassName = "bg-gradient-to-br from-blue-600 to-indigo-700",
}: ModalProps) {
  // 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-[9999] w-[90%] ${maxWidthClass} animate-scale-in overflow-hidden`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        {showHeader && (
          <div className={`relative p-6 pb-8 ${headerClassName}`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {headerContent || (
              <>
                {title && (
                  <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                )}
                {subtitle && (
                  <div className="text-blue-100 text-sm">{subtitle}</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{
            maxHeight: showHeader ? "calc(85vh - 120px)" : "calc(85vh - 24px)",
            minHeight,
          }}
        >
          {children}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `,
        }}
      />
    </>,
    document.body
  );
}
