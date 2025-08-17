"use server";

import { createClient } from "@/lib/supabase/server";

export async function getClassInfo(classId: string) {
  const supabase = await createClient();

  const { data: classInfo, error } = await supabase
    .from("classes")
    .select("current_day")
    .eq("id", classId)
    .single();

  if (error) {
    console.error("클래스 정보 조회 실패:", error);
    return null;
  }

  return classInfo;
}
