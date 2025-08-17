import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return redirect("/login");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id, login_id, class_id, nickname")
    .eq("user_id", authUser.id)
    .single();

  if (userError || !user) {
    console.error("사용자 정보 조회 실패:", userError);
    return redirect("/login");
  }

  console.log(user);

  return <HomeClient user={user} />;
}
