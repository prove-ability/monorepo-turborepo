// middleware.ts

import { updateSessionByAdmin } from "@repo/utils";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ 이 로그를 추가해서 확인!
  console.log("--- 미들웨어 실행 ---");
  console.log("Supabase URL 로드됨?:", baseUrl ? "✅" : "❌ UNDEFINED");
  console.log("Supabase Key 로드됨?:", anonKey ? "✅" : "❌ UNDEFINED");

  return await updateSessionByAdmin(baseUrl, anonKey, request);
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
