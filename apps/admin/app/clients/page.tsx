import { redirect } from "next/navigation";
import { isAdmin, createClientByServerSide } from "@/lib";

export default async function AdminDashboardPage() {
  // 1. 수정한 isAdmin 함수를 호출합니다.
  const isAdminUser = await isAdmin();

  // 2. 관리자가 아니면 로그인 페이지로 리다이렉트합니다.
  if (!isAdminUser) {
    redirect("/login");
  }

  const supabase = await createClientByServerSide();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1>관리자 대시보드</h1>
      <p>환영합니다, 관리자 {user?.email} 님!</p>
      {/* 관리자 전용 기능 구현 */}
    </div>
  );
}
