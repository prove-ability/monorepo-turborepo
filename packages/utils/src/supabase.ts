import {
  type CookieOptions,
  createServerClient,
  createBrowserClient,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// For client-side components
export function createClientByClientSide(key: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createBrowserClient(baseUrl, anonKey, {
    auth: {
      storageKey: key, // "admin" or "web"
    },
  });
  return supabase;
}

// For admin middleware
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
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
    auth: {
      storageKey: "admin", // Unique key for admin
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if ((!user || userError) && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && !userError) {
    const userEmail = user.email;
    if (userEmail && userEmail.endsWith("@student.local")) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

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

  if (user && !userError && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

// For web (user/student) middleware
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
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
    auth: {
      storageKey: "web", // Unique key for web
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if ((!user || userError) && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && !userError && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && !userError) {
    try {
      const userEmail = user.email;
      if (userEmail && !userEmail.endsWith("@student.local")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("user_id, name, login_id, class_id")
        .eq("user_id", user.id)
        .single();

      if (error || !userData) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login", request.url));
      }

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
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
