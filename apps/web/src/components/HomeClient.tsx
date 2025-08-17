"use client";

import { useEffect, useState } from "react";
import { Bell, TrendingUp, Wallet, PackageOpen } from "lucide-react";
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
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
                        <p className="font-semibold text-base">
              <span className="font-bold">{user.nickname}</span>님, 오늘은 day{" "}
              {classInfo?.current_day || 1}입니다.
            </p>
                        <p className="text-sm text-blue-600 mt-1">오늘 투자 결과는 내일 9시에 확인할 수 있어요.</p>
          </div>
        </div>

        {/* 내 계좌 */}
        <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">내 계좌</h2>
                    <p className="text-4xl font-bold text-gray-900">
            {walletInfo?.balance.toLocaleString() || 0}원
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                                <p className="text-base text-gray-500">투자 중인 금액</p>
                                <p className="text-xl font-semibold text-gray-800">0원</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                                <p className="text-base text-gray-500">주문 가능 금액</p>
                <p className="text-xl font-semibold text-gray-800">
                  {walletInfo?.balance.toLocaleString() || 0}원
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* 보유 종목 */}
        <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">보유 종목</h2>
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
            <PackageOpen className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-lg text-gray-600 font-semibold">보유 종목이 없어요</p>
                        <p className="text-base text-gray-400 mt-2">뉴스를 읽고 투자해 보세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
