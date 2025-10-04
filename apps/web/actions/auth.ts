"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";

export async function login(formData: FormData) {
  const loginId = formData.get("loginId") as string;
  const password = formData.get("password") as string;

  if (!loginId || !password) {
    return { error: "아이디와 비밀번호를 입력해주세요." };
  }

  const user = await verifyCredentials(loginId, password);

  if (!user) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createSession(user);
  
  // redirect는 throw를 발생시키므로 성공 플래그를 먼저 반환
  return { success: true };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
