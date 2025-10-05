"use client";

import { Home, Newspaper, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/news", icon: Newspaper, label: "뉴스" },
  { href: "/invest", icon: TrendingUp, label: "투자" },
  { href: "/ranking", icon: Trophy, label: "랭킹" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white border-t-2 border-gray-100 z-40">
      <div className="grid grid-cols-4 h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-16 transition-transform active:scale-95 ${
                isActive ? "text-blue-600 fill-current" : "text-gray-500"
              }`}
            >
                              <item.icon className="w-6 h-6 mb-1" strokeWidth={1} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
