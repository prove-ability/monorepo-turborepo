"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30초 (기본값)
            gcTime: 5 * 60 * 1000, // 5분 (캐시 유지)
            refetchOnWindowFocus: true, // 탭 전환 시 갱신
            refetchOnReconnect: true, // 재연결 시 갱신
            retry: 1, // 실패 시 1회 재시도
          },
          mutations: {
            retry: 0, // 거래 등 mutation은 재시도 안함
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
