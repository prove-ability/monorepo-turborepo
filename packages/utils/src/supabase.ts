import {
  type CookieOptions,
  createServerClient,
  createBrowserClient,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createClientByClientSide(baseUrl: string, anonKey: string) {
  const supabase = createBrowserClient(baseUrl, anonKey);
  return supabase;
}

export async function updateSession(
  baseUrl: string,
  anonKey: string,
  request: NextRequest
) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(baseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value: "", // 값을 비우고
          ...options,
          maxAge: 0, // 만료 시간을 0으로 설정하여 즉시 삭제
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 로그인 페이지가 아닌데, 세션이 없는 경우 로그인 페이지로 리디렉션
  if (!session && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인 페이지인데, 세션이 있는 경우 대시보드 홈으로 리디렉션
  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
