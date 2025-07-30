"use client";

import { useState } from "react";
import { loginStudent } from "../../src/actions/userActions";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const loginId = formData.get("loginId") as string;
    const password = formData.get("password") as string;

    try {
      const result = await loginStudent(loginId, password);

      if (result.success) {
        if (!result.user?.nickname) {
          router.push("/setup/nickname");
          return;
        }

        // Supabase 세션이 생성되었으므로 middleware가 자동으로 리다이렉트 처리
        // 페이지를 새로고침하여 middleware가 세션을 확인하도록 함
        router.push("/");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-left text-3xl font-bold tracking-tight text-gray-900">
            투자 대회를
            <br />
            시작해 볼까요?
          </h2>
          <figure>
            <img
              src="/images/login/logo.jpeg"
              alt="Login"
              className="w-full h-auto"
            />
          </figure>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="login-id" className="sr-only">
                로그인 ID
              </label>
              <input
                id="login-id"
                name="loginId"
                type="text"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="로그인 ID"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="비밀번호"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "로그인 중..." : "로그인 하기"}
            </button>
          </div>
        </form>
        <p className="text-sm text-gray-600">
          로그인 시 자동 로그인 설정됩니다.
          <br />내 폰이 아니라면 로그인하지 마세요!
        </p>
      </div>
    </div>
  );
}
