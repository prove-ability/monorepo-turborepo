"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
  maxHeight?: string;
  showHeader?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerContent,
  children,
  maxHeight = "80vh",
  showHeader = true,
}: BottomSheetProps) {
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

  return createPortal(
    <>
      {/* Overlay - 뷰포트 전체 */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Bottom Sheet - 최상위 z-index */}
      <div
        id="trade-modal"
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl flex flex-col animate-slide-up"
        style={{ 
          maxHeight,
          zIndex: 9999,
          maxWidth: "640px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-5 sticky top-0 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-t-2xl">
            {headerContent || (
              <div className="flex items-center gap-2">
                {icon && <span className="text-2xl">{icon}</span>}
                <div>
                  {title && <h3 className="font-bold text-lg text-white">{title}</h3>}
                  {subtitle && (
                    <p className="text-sm text-emerald-100">{subtitle}</p>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `
      }} />
    </>,
    document.body
  );
}
