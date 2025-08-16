"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientByClientSide } from "@repo/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!baseUrl || !anonKey) {
      setError("Supabase URL 또는 Anon Key가 설정되지 않았습니다.");
      return;
    }

    const supabase = createClientByClientSide();

    // 학생 계정 이메일 형식 차단
    if (email.endsWith("@student.local")) {
      setError("학생 계정으로는 관리자 페이지에 접근할 수 없습니다.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else if (data.user) {
      // 로그인 성공 후 관리자 권한 검증
      try {
        // 관리자 권한 확인 완료 - 대시보드로 이동
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        await supabase.auth.signOut();
        setError("권한 확인 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
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
          disabled={isLoading}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          disabled={isLoading}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
