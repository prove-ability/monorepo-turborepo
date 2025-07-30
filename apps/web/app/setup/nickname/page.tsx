"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateNickname } from "../../../src/actions/userActions";

export default function NicknameSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const nicknameValue = formData.get("nickname") as string;

    // 닉네임 유효성 검사
    if (!nicknameValue.trim()) {
      setError("닉네임을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (nicknameValue.length < 2 || nicknameValue.length > 10) {
      setError("닉네임은 2-10자 사이로 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateNickname(nicknameValue);

      if (result.success) {
        // 메인 페이지로 이동
        router.push("/");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("닉네임 설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-left text-3xl font-bold tracking-tight text-gray-900">
            어떤 닉네임으로
            <br />
            활동하시겠어요?
          </h2>
          <p className="mt-4 text-sm text-gray-600">
            다른 참가자들에게 보여질 닉네임을 설정해주세요.
            <br />한 번 설정하면 변경할 수 없어요.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              닉네임
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="닉네임을 입력하세요"
            />
            <p className="mt-1 text-xs text-gray-500">{nickname.length}/10자</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "설정 중..." : "닉네임 설정하기"}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          닉네임은 2-10자 사이로 입력해주세요.
          <br />
          특수문자는 사용할 수 없습니다.
        </p>
      </div>
    </div>
  );
}
