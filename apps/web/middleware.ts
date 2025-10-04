import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지는 항상 접근 가능
  if (pathname === "/login") {
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

  // 세션이 있는 경우 닉네임/비밀번호 설정 필요 여부 확인
  try {
    const user = JSON.parse(sessionCookie.value);
    
    // setup이 필요한 경우 setup 페이지로 리다이렉트
    // (실제 체크는 setup 페이지에서 수행)
    // 여기서는 setup 페이지가 아닌 경우만 통과
  } catch (error) {
    // 세션 파싱 실패 시 로그인 페이지로
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
