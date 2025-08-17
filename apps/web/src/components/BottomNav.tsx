"use client";

import { Home, ShoppingBag, LineChart, Gem } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/news", label: "뉴스", icon: ShoppingBag },
  { href: "/invest", label: "투자", icon: LineChart },
  { href: "/ranking", label: "랭킹", icon: Gem },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-16 transition-transform active:scale-95 ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
