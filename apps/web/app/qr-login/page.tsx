"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyQRToken, createQRGuestSession } from "@/actions/qr-auth";

export default function QRLoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string } | null>(null);
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const classId = searchParams.get("classId");

    if (!token || !classId) {
      setStatus("error");
      setError("잘못된 QR 코드입니다.");
      return;
    }

    // QR 토큰 검증
    verifyQRToken(token, classId).then((result) => {
      if (result.success) {
        setStatus("verified");
        setClassInfo({ id: result.classId, name: result.className });
      } else {
        setStatus("error");
        switch (result.reason) {
          case "invalid_token":
            setError("유효하지 않은 QR 코드입니다.");
            break;
          case "expired_token":
            setError("만료된 QR 코드입니다. 강사님께 새로운 QR 코드를 요청하세요.");
            break;
          case "class_not_active":
            setError("이 수업은 현재 진행 중이 아닙니다.");
            break;
          case "invalid_class":
            setError("수업을 찾을 수 없습니다.");
            break;
          default:
            setError("알 수 없는 오류가 발생했습니다.");
        }
      }
    });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    if (!classInfo) {
      setError("수업 정보를 찾을 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createQRGuestSession(classInfo.id, nickname.trim());

      if (result.success) {
        // 로그인 성공 - 메인 페이지로 이동
        router.push("/");
      } else {
        setError(result.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="text-lg text-gray-700">QR 코드 확인 중...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              접속 실패
            </h1>
            <p className="text-red-600">{error}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
            <p className="text-sm text-gray-600 text-center">
              강사님께 새로운 QR 코드를 요청하거나,<br />
              계정 로그인 방식을 이용해주세요.
            </p>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  // status === "verified"
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* 타이틀 */}
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            환영합니다!
          </h1>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-emerald-600">{classInfo?.name}</span> 수업에 접속하셨습니다
          </p>
        </div>

        {/* 닉네임 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-emerald-100">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임을 입력해주세요
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 김철수"
              required
              maxLength={20}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              게임에서 사용할 닉네임을 입력하세요 (최대 20자)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? "접속 중..." : "게임 시작하기"}
          </button>
        </form>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-800">
            💡 <strong>팁:</strong> 닉네임은 수업 내에서 다른 학생들과 중복될 수 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
