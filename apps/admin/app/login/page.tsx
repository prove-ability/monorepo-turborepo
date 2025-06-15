"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientByClientSide } from "@repo/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    console.log("--- 클라이언트 환경 변수 확인 ---");
    console.log("Supabase URL:", baseUrl);
    console.log("Supabase Anon Key:", anonKey);

    if (!baseUrl || !anonKey) {
      setError("Supabase URL 또는 Anon Key가 설정되지 않았습니다.");
      return;
    }

    const supabase = createClientByClientSide(baseUrl, anonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("--- 로그인 시도 결과 ---");
    console.log("에러 객체:", error);
    console.log("데이터 객체:", data);
    console.log("세션 객체 존재?:", data.session ? "✅" : "❌ NULL");

    if (error) {
      setError(error.message);
    } else {
      // 로그인 성공 시 관리자 대시보드로 이동
      console.log("로그인 성공:", data);
      router.push("/dashboard");
      router.refresh(); // 서버 상태를 최신화하기 위해 refresh 호출
    }
  };

  return (
    <div>
      <h1>관리자 로그인</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
        />
        <button type="submit">로그인</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
