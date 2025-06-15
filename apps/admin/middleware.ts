// middleware.ts

import { updateSession } from "@repo/utils";
import { type NextRequest } from "next/server";
import { env } from "./env";

export async function middleware(request: NextRequest) {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return await updateSession(baseUrl, anonKey, request);
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
