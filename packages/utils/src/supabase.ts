import {
  type CookieOptions,
  createServerClient,
  createBrowserClient,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createClientByClientSide() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createBrowserClient(baseUrl, anonKey);
  return supabase;
}

export async function updateSessionByAdmin(
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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 로그인 페이지가 아닌데, 사용자가 없는 경우 로그인 페이지로 리디렉션
  if ((!user || userError) && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 학생 계정(@student.local)이 admin에 접근하는 것을 차단
  if (user && !userError) {
    const userEmail = user.email;
    if (userEmail && userEmail.endsWith("@student.local")) {
      // 학생 계정은 로그아웃 후 로그인 페이지로 리디렉션
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // admins 테이블에서 관리자 권한 확인
    try {
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      // 관리자가 아닌 경우 로그아웃 후 로그인 페이지로 리디렉션
      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      console.error("Admin validation error:", error);
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 로그인 페이지인데, 사용자가 있는 경우 대시보드 홈으로 리디렉션
  if (user && !userError && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export async function updateSessionByUser(
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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // User(학생)용 세션 처리 로직

  // 1. 로그인 페이지가 아닌데 사용자가 없는 경우 로그인 페이지로 리디렉션
  if ((!user || userError) && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. 로그인 페이지인데 사용자가 있는 경우 학생 홈으로 리디렉션
  if (user && !userError && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. 사용자가 있는 경우 학생 인증 상태 확인
  if (user && !userError) {
    try {
      // 사용자가 학생인지 확인 (이메일이 @student.local로 끝나는지 확인)
      const userEmail = user.email;
      if (userEmail && !userEmail.endsWith("@student.local")) {
        // 학생이 아닌 사용자는 로그아웃 후 로그인 페이지로 리디렉션
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // users 테이블에 사용자 정보가 있는지 확인
      const { data: userData, error } = await supabase
        .from("users")
        .select("user_id, name, login_id, class_id")
        .eq("user_id", user.id)
        .single();

      // users 테이블에 데이터가 없는 경우 로그인 페이지로 리디렉션
      if (error || !userData) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // 세션에 사용자 정보 업데이트 (메타데이터가 비어있는 경우)
      if (!user.user_metadata?.user_id) {
        await supabase.auth.updateUser({
          data: {
            user_id: userData.user_id,
            name: userData.name,
            login_id: userData.login_id,
            class_id: userData.class_id,
          },
        });
      }
    } catch (error) {
      console.error("User session validation error:", error);
      // 오류 발생 시 로그아웃 후 로그인 페이지로 리디렉션
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
