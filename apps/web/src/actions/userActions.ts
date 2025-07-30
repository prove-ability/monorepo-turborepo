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
    nickname: string | null;
    phone: string;
    grade: number | null;
    school_name: string;
    class_id: string;
  };
}

export async function loginStudent(
  loginId: string,
  password: string
): Promise<LoginResult> {
  try {
    const supabase = await createClientByServerSide();

    // 관리자 계정 형식 차단 (일반 이메일 형식)
    if (loginId.includes("@") && !loginId.endsWith("@student.local")) {
      return {
        success: false,
        message: "관리자 계정으로는 학생 페이지에 접근할 수 없습니다.",
      };
    }

    // Supabase Auth로 직접 로그인 시도
    // 사용자의 login_id를 이메일 형식으로 변환
    const email = `${loginId}@student.local`;
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
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
      .select(
        "user_id, name, login_id, nickname, phone, grade, school_name, class_id"
      )
      .eq("user_id", authData.user.id)
      .single();

    if (userError || !user) {
      return {
        success: false,
        message: "사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.",
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
        nickname: user.nickname,
        phone: user.phone,
        grade: user.grade,
        school_name: user.school_name,
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
  redirect("/login");
}
