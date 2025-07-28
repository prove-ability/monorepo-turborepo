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

    // Supabase Auth로 직접 로그인 시도
    // 사용자의 login_id를 이메일 형식으로 변환
    const email = `${loginId}@student.local`;
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return {
        success: false,
        message: "로그인 ID 또는 비밀번호가 올바르지 않습니다.",
      };
    }

    // users 테이블에서 사용자 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, name, login_id, class_id")
      .eq("user_id", authData.user.id)
      .single();

    if (userError || !user) {
      // users 테이블에 데이터가 없으면 생성
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          user_id: authData.user.id,
          name: authData.user.user_metadata?.name || loginId,
          login_id: loginId,
          class_id: authData.user.user_metadata?.class_id || 'class1',
        });

      if (insertError) {
        console.error('Insert user error:', insertError);
        return {
          success: false,
          message: "사용자 정보 생성 중 오류가 발생했습니다.",
        };
      }

      // 새로 생성된 사용자 정보 반환
      return {
        success: true,
        message: "로그인 성공",
        user: {
          user_id: authData.user.id,
          name: authData.user.user_metadata?.name || loginId,
          login_id: loginId,
          class_id: authData.user.user_metadata?.class_id || 'class1',
        },
      };
    }

    // 기존 사용자 정보 반환
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
