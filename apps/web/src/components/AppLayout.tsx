"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideLayout = ["/sign-in", "/sign-up", "/invest/trade"].includes(
    pathname
  );

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="p-4 h-full bg-white">{children}</div>
      <BottomNav />
    </>
  );
}
