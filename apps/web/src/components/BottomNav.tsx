"use client";

import { Home, Newspaper, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getDashboardData } from "@/actions/dashboard";
import { getStocksForInvest } from "@/actions/stocks";
import { getClassRanking } from "@/actions/ranking";
import { getAllNews } from "@/actions/news";

const navItems = [
  { href: "/", icon: Home, label: "홈", id: "nav-home" },
  { href: "/news", icon: Newspaper, label: "뉴스", id: "nav-news" },
  { href: "/invest", icon: TrendingUp, label: "투자", id: "nav-invest" },
  { href: "/ranking", icon: Trophy, label: "랭킹", id: "nav-ranking" },
];

export function BottomNav() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Prefetch 함수
  const handlePrefetch = (href: string) => {
    switch (href) {
      case '/':
        queryClient.prefetchQuery({
          queryKey: ['dashboard'],
          queryFn: getDashboardData,
          staleTime: 30 * 1000,
        });
        break;
      case '/invest':
        queryClient.prefetchQuery({
          queryKey: ['stocks'],
          queryFn: getStocksForInvest,
          staleTime: 20 * 1000,
        });
        break;
      case '/ranking':
        queryClient.prefetchQuery({
          queryKey: ['ranking'],
          queryFn: getClassRanking,
          staleTime: 15 * 1000,
        });
        break;
      case '/news':
        queryClient.prefetchQuery({
          queryKey: ['news'],
          queryFn: getAllNews,
          staleTime: 60 * 1000,
        });
        break;
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto border-t-2 border-gray-100 z-40 backdrop-blur-lg bg-white/90"
      role="navigation"
      aria-label="주요 네비게이션"
    >
      <div className="grid grid-cols-4 h-full relative" role="tablist">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const MotionLink = motion(Link);
          return (
            <MotionLink
              key={item.label}
              id={item.id}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label} 페이지`}
              className="flex flex-col items-center justify-center w-full h-16 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => handlePrefetch(item.href)}
              onTouchStart={() => handlePrefetch(item.href)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50/50"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`flex flex-col items-center justify-center relative z-10 ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}>
                <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2 : 1} aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </MotionLink>
          );
        })}
      </div>
    </nav>
  );
}
