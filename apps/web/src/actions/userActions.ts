"use server";

import { createWebClient } from "@/lib/supabase/server";
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
    const supabase = await createWebClient();

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

export interface UpdateNicknameResult {
  success: boolean;
  message: string;
  nickname?: string;
}

export async function updateNickname(
  nickname: string
): Promise<UpdateNicknameResult> {
  try {
    const supabase = await createWebClient();

    // 현재 로그인된 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 닉네임 유효성 검사
    if (!nickname.trim()) {
      return {
        success: false,
        message: "닉네임을 입력해주세요.",
      };
    }

    if (nickname.length < 2 || nickname.length > 10) {
      return {
        success: false,
        message: "닉네임은 2-10자 사이로 입력해주세요.",
      };
    }

    // 닉네임 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("user_id")
      .eq("nickname", nickname.trim())
      .neq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러로, 중복이 없다는 의미
      console.error("Nickname check error:", checkError);
      return {
        success: false,
        message: "닉네임 확인 중 오류가 발생했습니다.",
      };
    }

    if (existingUser) {
      return {
        success: false,
        message: "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.",
      };
    }

    // users 테이블에서 닉네임 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({ nickname: nickname.trim() })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Nickname update error:", updateError);
      return {
        success: false,
        message: "닉네임 설정 중 오류가 발생했습니다.",
      };
    }

    return {
      success: true,
      message: "닉네임이 성공적으로 설정되었습니다.",
      nickname: nickname.trim(),
    };
  } catch (error) {
    console.error("Update nickname error:", error);
    return {
      success: false,
      message: "닉네임 설정 중 오류가 발생했습니다.",
    };
  }
}

export async function getWallet(userId: string) {
  const supabase = await createWebClient();

  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("지갑 정보 조회 실패:", error);
    return null;
  }

  return wallet;
}

export async function logoutStudent() {
  const supabase = await createWebClient();
  await supabase.auth.signOut();
  redirect("/login");
}
