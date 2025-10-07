/* eslint-disable @typescript-eslint/no-explicit-any */
import { stackServerApp } from "@/stack/server";
import type { User } from "@stackframe/stack";

// 모든 액션이 반환할 공통 상태 타입을 정의합니다.
export interface ActionState {
  message?: string;
  error?: Record<string, string[]>;
  errors?: Record<string, string[]> | null;
  success: boolean;
}

// 인증된 사용자 정보와 함께 실행될 액션 함수의 타입을 정의합니다.
type AuthenticatedAction<Args extends any[], T> = (
  user: User,
  ...args: Args
) => Promise<T>;

/**
 * 서버 액션을 위한 고차 함수입니다.
 * 실행 전에 사용자 인증을 확인하고, 인증된 경우에만 원본 액션을 실행합니다.
 * @param action 인증된 사용자 정보가 필요한 서버 액션
 * @returns 인증 로직이 추가된 새로운 서버 액션
 */
export function withAuth<Args extends any[], T>(
  action: AuthenticatedAction<Args, T>
) {
  return async (...args: Args): Promise<T | ActionState> => {
    const user = await stackServerApp.getUser();

    if (!user) {
      return {
        message: "사용자 인증에 실패했습니다. 다시 로그인해주세요.",
        success: false,
        errors: null,
      };
    }

    // 인증에 성공하면, user 객체와 함께 원본 액션을 실행합니다.
    return action(user, ...args);
  };
}
