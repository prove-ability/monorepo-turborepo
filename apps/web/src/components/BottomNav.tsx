"use client";

import { logoutStudent } from "@/actions/userActions";
import { useRouter } from "next/navigation";

export function BottomNav() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutStudent();
    router.push("/login");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto bg-white border-t">
      <div className="flex justify-around p-2">
        <button className="text-center text-gray-600">
          <span className="block text-2xl">🏠</span>
          <span className="text-xs">홈</span>
        </button>
        <button className="text-center text-gray-600">
          <span className="block text-2xl">📰</span>
          <span className="text-xs">뉴스</span>
        </button>
        <button className="text-center text-blue-600 font-bold">
          <span className="block text-2xl">📈</span>
          <span className="text-xs">투자</span>
        </button>
        <button className="text-center text-gray-600">
          <span className="block text-2xl">🏆</span>
          <span className="text-xs">랭킹</span>
        </button>
        <button
          onClick={handleLogout}
          className="text-center text-gray-600"
        >
          <span className="block text-2xl">⚙️</span>
          <span className="text-xs">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
