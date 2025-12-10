import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지와 QR 로그인 페이지는 항상 접근 가능
  if (pathname === "/login" || pathname === "/qr-login") {
    return NextResponse.next();
  }

  // 세션 쿠키 확인
  const sessionCookie = request.cookies.get("guests_session");

  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // setup 페이지는 세션이 있으면 접근 가능
  if (pathname === "/setup") {
    return NextResponse.next();
  }

  // 세션 파싱 확인
  try {
    JSON.parse(sessionCookie.value);
  } catch (error) {
    // 세션 파싱 실패 시 로그인 페이지로
    console.error("Proxy error:", error);
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("guests_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

