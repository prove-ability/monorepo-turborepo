"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  login_id: string;
  class_id: string;
}

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // 클라이언트 사이드에서만 실행
    const checkLoginStatus = () => {
      try {
        const studentData = localStorage.getItem("student");
        if (studentData) {
          setStudent(JSON.parse(studentData));
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Failed to parse student data:", error);
        router.push("/login");
        return;
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, [router, isMounted]);

  // 마운트되지 않았거나 로딩 중이거나 학생 정보가 없으면 로딩 표시
  if (!isMounted || isLoading || !student) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        suppressHydrationWarning
      >
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            환영합니다, {student.name}님!
          </h1>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>로그인 ID:</strong> {student.login_id}
            </p>
            <p>
              <strong>학생 ID:</strong> {student.id}
            </p>
            <p>
              <strong>클래스 ID:</strong> {student.class_id}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("student");
              router.push("/login");
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
