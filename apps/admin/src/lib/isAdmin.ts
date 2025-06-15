import { createClientByServerSide } from "./supabase";

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClientByServerSide();

  // 1. 현재 로그인한 사용자 정보를 가져옵니다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. 로그인 상태가 아니면 무조건 false를 반환합니다.
  if (!user) {
    return false;
  }

  // 3. 'admins' 테이블에서 현재 사용자의 ID가 있는지 확인합니다.
  // RLS 정책 덕분에, 관리자가 아니면 이 쿼리는 항상 아무 결과도 반환하지 않습니다.
  const { data, error } = await supabase
    .from("admins")
    .select("user_id") // 존재 여부만 확인하면 되므로 아무 컬럼이나 선택
    .eq("user_id", user.id)
    .single(); // 결과가 하나이거나 없어야 함

  console.error(error);

  // 4. 에러가 없고, 데이터가 존재하면(null이 아니면) 관리자입니다.
  // 관리자가 아닌 경우, RLS 정책에 의해 `data`는 `null`이 되고 `error`가 발생합니다.
  // 따라서 `data`가 `null`이 아닌지만 확인하면 됩니다.
  if (data) {
    return true;
  }

  return false;
}
