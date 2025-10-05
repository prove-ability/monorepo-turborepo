import { NextResponse, type NextRequest } from "next/server";
import { db, guests } from "@repo/db";
import { eq } from "drizzle-orm";

export async function middleware(request: NextRequest) {
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

  // 세션이 있는 경우 클래스 상태 확인
  try {
    const user = JSON.parse(sessionCookie.value);

    // 게스트 정보와 클래스 상태 확인
    const guestWithClass = await db.query.guests.findFirst({
      where: eq(guests.id, user.id),
      with: {
        class: true,
      },
    });

    // 게스트 정보가 없거나 클래스가 종료된 경우 로그인 페이지로 리다이렉트
    if (!guestWithClass || guestWithClass.class?.status === "ended") {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      // 세션 쿠키 삭제
      response.cookies.delete("guests_session");
      return response;
    }
  } catch (error) {
    // 세션 파싱 실패 또는 DB 조회 실패 시 로그인 페이지로
    console.error("Middleware error:", error);
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
