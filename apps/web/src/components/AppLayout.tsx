"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { UserButton } from "@stackframe/stack";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Stack-auth 핸들러 경로도 레이아웃 숨김 처리
  const hideLayout =
    ["/handler/sign-in", "/handler/sign-up", "/invest/trade"].some((path) =>
      pathname.startsWith(path)
    ) || pathname.startsWith("/handler");

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="p-4 h-full bg-white">
        <div className="flex justify-end mb-4">
          <UserButton />
        </div>
        {children}
      </div>
      <BottomNav />
    </>
  );
}
