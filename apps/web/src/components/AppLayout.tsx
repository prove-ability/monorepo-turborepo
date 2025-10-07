"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // BottomNav를 숨길 페이지들
  const hideBottomNav =
    ["/login", "/setup", "/onboarding", "/invest/trade"].some((path) =>
      pathname.startsWith(path)
    ) || pathname.startsWith("/handler");

  return (
    <>
      <div className="max-w-xl mx-auto h-full min-h-screen">{children}</div>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}
