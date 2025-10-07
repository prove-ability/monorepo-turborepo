"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateNickname,
  updatePassword,
  checkNeedsSetup,
} from "@/actions/profile";
import { Button, Input, Label } from "@repo/ui";
import { UserCircle, Lock, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<
    "loading" | "nickname" | "password" | "complete"
  >("loading");
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  async function checkSetupStatus() {
    const result = await checkNeedsSetup();

    if (!result.needsSetup) {
      router.push("/");
      return;
    }

    if (result.needsNickname) {
      setStep("nickname");
    } else if (result.needsPasswordChange) {
      setStep("password");
    }
  }

  async function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await updateNickname(nickname);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // 닉네임 설정 완료 후 비밀번호 변경 필요 여부 확인
    const setupStatus = await checkNeedsSetup();

    if (setupStatus.needsPasswordChange) {
      setStep("password");
      setLoading(false);
    } else {
      setStep("complete");
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const result = await updatePassword(currentPassword, newPassword);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStep("complete");
    setTimeout(() => {
      router.push("/onboarding");
    }, 1500);
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">설정 완료!</h2>
          <p className="text-gray-600">메인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* 진행 상태 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "nickname"
                  ? "bg-blue-600 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {step === "nickname" ? "1" : "✓"}
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "password"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
          <p className="text-center text-sm text-gray-600">
            {step === "nickname" ? "닉네임 설정" : "비밀번호 변경"}
          </p>
        </div>

        {step === "nickname" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <UserCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                닉네임을 설정해주세요
              </h1>
              <p className="text-sm text-gray-600">
                게임에서 사용할 닉네임을 입력하세요
              </p>
            </div>

            <form onSubmit={handleNicknameSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 (최대 20자)"
                  maxLength={20}
                  required
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {nickname.length}/20자
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !nickname.trim()}
              >
                {loading ? "설정 중..." : "다음"}
              </Button>
            </form>
          </div>
        )}

        {step === "password" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                비밀번호를 변경해주세요
              </h1>
              <p className="text-sm text-gray-600">
                보안을 위해 초기 비밀번호를 변경하세요
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (4자 이상)"
                  minLength={4}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {loading ? "변경 중..." : "완료"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
