"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import GameEndModal from "@/components/GameEndModal";
import { getGameProgress } from "@/actions/dashboard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // BottomNav를 숨길 페이지들
  const hideBottomNav =
    ["/login", "/setup", "/onboarding", "/invest/trade"].some((path) =>
      pathname.startsWith(path)
    ) || pathname.startsWith("/handler");

  // 게임 진행 상태 조회 (로그인된 페이지에서만)
  const { data: gameProgress } = useQuery({
    queryKey: ["gameProgress"],
    queryFn: getGameProgress,
    enabled: !hideBottomNav, // 로그인 페이지 등에서는 조회하지 않음
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
  });

  return (
    <>
      <div className="max-w-xl mx-auto h-full min-h-screen">{children}</div>
      {!hideBottomNav && <BottomNav />}
      {/* 게임 종료 모달 - 모든 페이지에서 표시 */}
      {gameProgress && (
        <GameEndModal
          currentDay={gameProgress.currentDay}
          totalDays={gameProgress.totalDays}
        />
      )}
    </>
  );
}
