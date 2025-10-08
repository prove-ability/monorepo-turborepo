"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { Label, Button, Input } from "@repo/ui";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        // 로그인 성공 시 setup 페이지로 리다이렉트
        // setup 페이지에서 필요 여부를 확인하고 자동으로 메인으로 이동
        router.push("/setup");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* 타이틀 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            반가워요!
          </h1>
          <p className="text-sm text-gray-600">
            아이디와 비밀번호를 입력해주세요
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4" aria-label="로그인 폼">
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm border border-emerald-100">
            <div>
              <Label htmlFor="loginId" className="text-sm font-medium text-gray-700">
                아이디
              </Label>
              <Input
                id="loginId"
                name="loginId"
                type="text"
                required
                autoComplete="username"
                placeholder="아이디를 입력해주세요"
                className="mt-1.5 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={loading}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해주세요"
                  className="pr-10 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={loading}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-100" role="alert" id="login-error">
                <p className="text-sm text-red-900 font-medium">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-xl py-3 font-semibold text-white transition-colors" 
              disabled={loading}
            >
              {loading ? "로그인하는 중이에요..." : "로그인하기"}
            </Button>
          </div>
        </form>

        {/* 하단 안내 */}
        <p className="text-center text-xs text-gray-500">
          선생님께 받은 계정 정보로 로그인하세요
        </p>
      </div>
    </div>
  );
}
