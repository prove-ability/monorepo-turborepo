import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { User } from "./auth";

/**
 * 서버 액션에 세션 검증을 추가하는 HOC
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export function withAuth<T extends any[], R>(
  handler: (user: User, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const user = await getSession();

    if (!user) {
      redirect("/login");
    }

    return handler(user, ...args);
  };
}
