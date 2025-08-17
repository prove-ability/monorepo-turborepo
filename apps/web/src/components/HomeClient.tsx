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
    <div className="w-full bg-white p-4">
      <div className="space-y-6 pb-20">
        {/* 상단 알림 */}
        <div className="bg-blue-900 text-white p-3 rounded-lg text-sm flex items-center gap-2">
          <span>🔔</span>
          <div>
            <p>
              <span className="font-bold">{user.nickname}</span>님, 오늘은 day{" "}
              {classInfo?.current_day || 1}입니다.
            </p>
            <p>오늘 투자 결과는 내일 9시에 확인할 수 있어요.</p>
          </div>
        </div>

        {/* 내 계좌 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">내 계좌</h2>
          <p className="text-3xl font-bold">
            {walletInfo?.balance.toLocaleString() || 0}원
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500">투자 중인 금액</p>
              <p className="text-lg font-semibold">0원 (+0%)</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500">주문 가능 금액</p>
              <p className="text-lg font-semibold">
                {walletInfo?.balance.toLocaleString() || 0}원
              </p>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* 보유 종목 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">보유 종목</h2>
          <div className="text-center py-16">
            <p className="text-gray-500">보유 종목이 없어요</p>
            <p className="text-gray-400 text-sm">뉴스를 읽고 투자해 보세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
