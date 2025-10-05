import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0]?.clientY || 0;
    };

    const handleTouchEnd = async () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const pullDistance = touchEndY.current - touchStartY.current;

      // 페이지 맨 위에서 아래로 150px 이상 당기면 새로고침
      if (scrollTop === 0 && pullDistance > 150 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);

  return { isRefreshing };
}
