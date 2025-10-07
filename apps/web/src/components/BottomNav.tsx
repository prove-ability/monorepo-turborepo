"use client";

import { Home, Newspaper, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
      className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white border-t-2 border-gray-100 z-40 backdrop-blur-lg bg-white/90"
      role="navigation"
      aria-label="주요 네비게이션"
    >
      <div className="grid grid-cols-4 h-full relative" role="tablist">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label} 페이지`}
              className="flex flex-col items-center justify-center w-full h-16 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50/50"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                className={`flex flex-col items-center justify-center relative z-10 ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: isActive ? 1 : 1 }}
              >
                <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2 : 1} aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
