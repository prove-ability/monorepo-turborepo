"use client";

import { useState, useEffect } from "react";
import { createClientByClientSide } from "@repo/utils";
import { logoutStudent } from "../src/actions/userActions";

interface User {
  user_id: string;
  login_id: string;
  class_id: string;
  nickname: string | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const getUserFromSession = async () => {
      try {
        const supabase = createClientByClientSide();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // 세션에서 사용자 정보 가져오기
          // const userData = session.user.user_metadata;

          // 메타데이터가 없으면 users 테이블에서 직접 조회
          const { data: userData } = await supabase
            .from("users")
            .select("user_id, login_id, class_id, nickname")
            .eq("login_id", session.user.email?.split("@")[0])
            .single();

          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Failed to get user from session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserFromSession();
  }, [isMounted]);

  // 마운트되지 않았거나 로딩 중이면 로딩 표시
  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  // 사용자 정보가 없으면 middleware가 리다이렉트 처리할 것임
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">인증 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            환영합니다, {user.nickname}님!
          </h1>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>로그인 ID:</strong> {user.login_id}
            </p>
            <p>
              <strong>사용자 ID:</strong> {user.user_id}
            </p>
            <p>
              <strong>클래스 ID:</strong> {user.class_id}
            </p>
          </div>
          <button
            onClick={async () => {
              await logoutStudent();
            }}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
