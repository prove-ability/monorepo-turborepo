import { createServerClient } from "@supabase/ssr";
import { createClient as createClientPrimitive } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export function createClientByClientSide(baseUrl: string, anonKey: string) {
  const supabase = createClientPrimitive(baseUrl, anonKey);
  return supabase;
}

export async function updateSession(
  baseUrl: string,
  anonKey: string,
  request: NextRequest
) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(baseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
      },
      remove(name: string, options) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
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
