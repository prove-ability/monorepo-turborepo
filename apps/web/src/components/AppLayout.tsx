"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideBottomNav = pathname === "/invest/trade";

  return (
    <>
      <div className="p-4 h-full bg-white">{children}</div>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}
