"use server";

import { createClientByServerSide } from "../lib/supabase";

export interface LoginResult {
  success: boolean;
  message: string;
  student?: {
    id: string;
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

    // students 테이블에서 login_id와 pw로 학생 조회
    const { data: student, error } = await supabase
      .from("students")
      .select("id, name, login_id, class_id")
      .eq("login_id", loginId)
      .eq("pw", password)
      .single();

    if (error || !student) {
      return {
        success: false,
        message: "로그인 정보가 올바르지 않습니다.",
      };
    }

    return {
      success: true,
      message: "로그인 성공",
      student,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    };
  }
}
