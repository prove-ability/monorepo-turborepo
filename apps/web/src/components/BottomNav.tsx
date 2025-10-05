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
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white border-t-2 border-gray-100 z-40"
      role="navigation"
      aria-label="주요 네비게이션"
    >
      <div className="grid grid-cols-4 h-full" role="tablist">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label} 페이지`}
              className={`flex flex-col items-center justify-center w-full h-16 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                isActive ? "text-blue-600 fill-current" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" strokeWidth={1} aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
