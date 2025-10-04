"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { Label, Button, Input } from "@repo/ui";

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    try {
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        // 로그인 성공 시 클라이언트에서 리다이렉트
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      // 예상치 못한 에러만 여기서 처리
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            로그인
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            학생 계정으로 로그인하세요
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-lg bg-white p-8 shadow">
            <div>
              <Label htmlFor="loginId">아이디</Label>
              <Input
                id="loginId"
                name="loginId"
                type="text"
                required
                placeholder="아이디를 입력하세요"
                className="mt-1"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="비밀번호를 입력하세요"
                className="mt-1"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
