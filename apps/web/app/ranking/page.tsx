import { createWebClient } from "@/lib/supabase/server";
import RankingClient from "@/components/RankingClient";
import { redirect } from "next/navigation";

export default async function RankingPage() {
  const supabase = await createWebClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("class_id")
    .eq("user_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("사용자 정보 조회 실패:", userError);
    // TODO: 에러 페이지로 리다이렉트 또는 에러 메시지 표시
    return <div>사용자 정보를 불러올 수 없습니다.</div>;
  }

  return <RankingClient classId={userData.class_id} />;
}
