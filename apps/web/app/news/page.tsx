import NewsClient from "@/components/NewsClient";
import { createWebClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewsPage() {
  const supabase = await createWebClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return redirect("/login");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("class_id")
    .eq("user_id", authUser.id)
    .single();

  if (userError || !user || !user.class_id) {
    console.error("사용자 또는 클래스 정보 조회 실패:", userError);
    return <div>뉴스 정보를 불러올 수 없습니다.</div>;
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", user.class_id)
    .single();

  if (classError || !classData) {
    console.error("클래스 정보 조회 실패:", classError);
    return <div>뉴스 정보를 불러올 수 없습니다.</div>;
  }

  return <NewsClient classData={classData} />;
}
