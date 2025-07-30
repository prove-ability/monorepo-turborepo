"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClientByServerSide, createAdminClient } from "@/lib/supabase";
// 타입 정의를 인라인으로 추가
interface CreateUserData {
  name: string;
  phone: string;
  grade: number;
  school_name: string;
  client_id: string;
  class_id: string;
}

interface UpdateUserData extends Partial<CreateUserData> {}

// 자동 로그인 ID 생성 함수 (중복 방지 - Auth 시스템 포함)
async function generateLoginId(): Promise<string> {
  const adminSupabase = await createAdminClient();

  // public.users 테이블의 기존 login_id들 조회
  const { data: existingUsers } = await adminSupabase
    .from("users")
    .select("login_id")
    .order("login_id");

  // Auth 시스템의 모든 사용자 조회
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();

  const existingIds = new Set(
    existingUsers?.map((user) => user.login_id) || []
  );

  // Auth 시스템에서 student.local 도메인 사용자들의 login_id 추가
  authUsers?.users?.forEach((authUser) => {
    if (authUser.email && authUser.email.endsWith("@student.local")) {
      const loginId = authUser.email.split("@")[0];
      existingIds.add(loginId);
    }
  });

  console.log("existingIds", existingIds);

  // user001부터 시작하여 중복되지 않는 ID 찾기
  // 더 높은 번호부터 시작하여 기존 사용자와 충돌 방지
  let counter =
    Math.max(
      ...Array.from(existingIds).map((id) => {
        const match = id.match(/user(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }),
      0
    ) + 1;

  let newLoginId: string;

  do {
    newLoginId = `user${counter.toString().padStart(3, "0")}`;
    counter++;
  } while (existingIds.has(newLoginId));

  return newLoginId;
}

// 자동 비밀번호 생성 함수 (영문 + 숫자 4자리)
function generatePassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let password = "";
  // 영문 2자리
  for (let i = 0; i < 2; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 숫자 2자리
  for (let i = 0; i < 2; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return password;
}

// 사용자 데이터 검증 스키마 (ID와 비밀번호는 자동 생성되므로 제외)
const userSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().min(1, "전화번호는 필수입니다"),
  grade: z.number().min(1).max(12),
  school_name: z.string().min(1, "학교명은 필수입니다"),
  client_id: z.string().min(1, "클라이언트 ID는 필수입니다"),
  class_id: z.string().min(1, "클래스 ID는 필수입니다"),
});

// CREATE: 새 사용자 생성
export async function createUser(
  data: Omit<CreateUserData, "login_id" | "password">
) {
  let authDataObject;

  try {
    const adminSupabase = await createAdminClient();

    // 데이터 검증
    const validatedData = userSchema.parse(data);

    // 자동으로 로그인 ID와 비밀번호 생성
    const loginId = await generateLoginId();
    const password = generatePassword();

    // Supabase Auth에 사용자 생성 (서비스 역할 키 사용)
    const email = `${loginId}@student.local`;

    const { data: authData, error: signUpError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    authDataObject = authData;

    if (signUpError || !authData.user) {
      return {
        error: { _form: [`인증 사용자 생성 실패: ${signUpError?.message}`] },
      };
    }

    // if (true) {
    //   return {
    //     error: {
    //       _form: [
    //         `${authData.user?.id} ${loginId} ${password} ${validatedData.name} ${validatedData.phone} ${validatedData.grade} ${validatedData.school_name} ${validatedData.class_id} ${validatedData.client_id}   ${validatedData.nickname} `,
    //       ],
    //     },
    //   };
    // }

    // users 테이블에 사용자 정보 저장 (password 포함) - 관리자 권한으로 실행
    const { error: insertError } = await adminSupabase.from("users").insert({
      user_id: authData.user.id,
      login_id: loginId,
      password: password, // 관리용 비밀번호 저장
      name: validatedData.name,
      phone: validatedData.phone,
      grade: validatedData.grade,
      school_name: validatedData.school_name,
      class_id: validatedData.class_id,
    });

    if (insertError) {
      // Auth 사용자 삭제 (롤백)
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      return {
        error: { _form: [`사용자 정보 저장 실패: ${insertError.message}`] },
      };
    }

    revalidatePath("/classes");

    return {
      success: true,
      message: `사용자가 성공적으로 등록되었습니다!\n로그인 ID: ${loginId}\n비밀번호: ${password}`,
      data: { loginId, password },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          const fieldName = err.path[0];
          if (typeof fieldName === "string") {
            fieldErrors[fieldName] = [err.message];
          }
        }
      });
      const adminSupabase = await createAdminClient();
      await adminSupabase.auth.admin.deleteUser(authDataObject?.user?.id!);
      return { error: fieldErrors };
    }

    return {
      error: { _form: ["사용자 등록 중 오류가 발생했습니다."] },
    };
  }
}

// READ: 모든 사용자 조회 (클라이언트, 클래스 정보 포함)
export async function getUsers() {
  try {
    const supabase = await createClientByServerSide();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        classes (
          id,
          name,
          clients (
            id,
            name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: "사용자 목록을 불러오는데 실패했습니다.",
    };
  }
}

// READ: 특정 클래스의 사용자들 조회
export async function getUsersByClass(classId: string) {
  try {
    const supabase = await createClientByServerSide();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        classes (
          id,
          name,
          clients (
            id,
            name
          )
        )
      `
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: "사용자 목록을 불러오는데 실패했습니다.",
    };
  }
}

// UPDATE: 사용자 정보 수정
export async function updateUser(userId: string, data: UpdateUserData) {
  try {
    const supabase = await createClientByServerSide();

    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    revalidatePath("/classes");

    return {
      success: true,
      message: "사용자 정보가 성공적으로 수정되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      error: "사용자 정보 수정에 실패했습니다.",
    };
  }
}

// DELETE: 사용자 삭제
export async function deleteUser(userId: string) {
  try {
    const supabase = await createClientByServerSide();

    // users 테이블에서 삭제 (CASCADE로 auth.users도 자동 삭제됨)
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    revalidatePath("/classes");

    return {
      success: true,
      message: "사용자가 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      error: "사용자 삭제에 실패했습니다.",
    };
  }
}

// 클라이언트별 클래스 목록 조회 (사용자 등록 시 사용)
export async function getClassesByClient(clientId: string) {
  try {
    const supabase = await createClientByServerSide();

    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .eq("client_id", clientId)
      .order("name");

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: "클래스 목록을 불러오는데 실패했습니다.",
    };
  }
}
