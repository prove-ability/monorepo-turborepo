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
    <div className="w-full bg-white">
      <div className="space-y-4 pb-20">
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

    </div>
  );
}
