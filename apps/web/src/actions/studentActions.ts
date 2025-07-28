"use server";

import { createClientByServerSide } from "../lib/supabase";
import { redirect } from "next/navigation";

export interface LoginResult {
  success: boolean;
  message: string;
  user?: {
    user_id: string;
    name: string;
    login_id: string;
    class_id: string;
  };
}

export async function loginStudent(
  loginId: string,
  password: string
): Promise<LoginResult> {
  try {
    const supabase = await createClientByServerSide();

    // 1. users 테이블에서 사용자 정보 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, name, login_id, class_id, pw")
      .eq("login_id", loginId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        message: "로그인 ID 또는 비밀번호가 올바르지 않습니다.",
      };
    }

    // 2. 비밀번호 확인
    if (user.pw !== password) {
      return {
        success: false,
        message: "로그인 ID 또는 비밀번호가 올바르지 않습니다.",
      };
    }

    // 3. Supabase Auth에 로그인 (세션 생성)
    // 사용자의 login_id를 이메일 형식으로 변환하여 Supabase Auth 사용
    const email = `${loginId}@student.local`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: user.user_id, // user_id를 패스워드로 사용
    });

    // 4. 만약 사용자가 존재하지 않으면 생성
    if (signInError?.message?.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: user.user_id,
        options: {
          data: {
            user_id: user.user_id,
            name: user.name,
            login_id: user.login_id,
            class_id: user.class_id,
          },
        },
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        return {
          success: false,
          message: "인증 시스템 오류가 발생했습니다.",
        };
      }

      // 생성 후 다시 로그인
      const { error: retrySignInError } = await supabase.auth.signInWithPassword({
        email,
        password: user.user_id,
      });

      if (retrySignInError) {
        console.error('Retry SignIn error:', retrySignInError);
        return {
          success: false,
          message: "로그인 중 오류가 발생했습니다.",
        };
      }
    } else if (signInError) {
      console.error('SignIn error:', signInError);
      return {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      };
    }

    // 5. 로그인 성공
    return {
      success: true,
      message: "로그인 성공",
      user: {
        user_id: user.user_id,
        name: user.name,
        login_id: user.login_id,
        class_id: user.class_id,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    };
  }
}

export async function logoutStudent() {
  const supabase = await createClientByServerSide();
  await supabase.auth.signOut();
  redirect('/login');
}
