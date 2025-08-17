"use client";

import { useEffect, useState } from "react";
import { logoutStudent, getWallet } from "@/actions/userActions";
import { getClassInfo } from "@/actions/classActions";

interface User {
  user_id: string;
  nickname: string;
  class_id: string;
}

interface ClassInfo {
  current_day: number;
}

interface WalletInfo {
  balance: number;
}

interface HomeClientProps {
  user: User;
}

export default function HomeClient({ user }: HomeClientProps) {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [classData, walletData] = await Promise.all([
        getClassInfo(user.class_id),
        getWallet(user.user_id),
      ]);
      setClassInfo(classData);
      setWalletInfo(walletData);
    }

    fetchData();
  }, [user.class_id, user.user_id]);
  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <div className="p-4 space-y-4 pb-20">
        {" "}
        {/* 하단 네비게이션 높이만큼 패딩 추가 */}
        {/* 상단 알림 */}
        <div className="bg-blue-900 text-white p-3 rounded-lg text-sm">
          <p>
            <span className="font-bold">{user.nickname}</span>님, 오늘은 day{" "}
            {classInfo?.current_day || 1}입니다.
          </p>
          <p>오늘 투자 결과는 내일 9시에 확인할 수 있어요.</p>
        </div>
        {/* 계좌 요약 */}
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 보유자산</span>
            <p className="text-2xl font-bold">
              {walletInfo?.balance.toLocaleString() || 0}원
            </p>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">주문 가능 금액</span>
            <span className="font-bold text-lg text-blue-600">
              {walletInfo?.balance.toLocaleString() || 0}원
            </span>
          </div>
        </div>
        {/* 보유 주식 */}
        <div>
          <h2 className="text-lg font-bold mb-2">보유 주식</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-500">보유 주식이 없습니다.</p>
            {/* TODO: 보유 주식 목록 표시 */}
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t">
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
            onClick={() => logoutStudent()}
            className="text-center text-gray-600"
          >
            <span className="block text-2xl">⚙️</span>
            <span className="text-xs">로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
}
