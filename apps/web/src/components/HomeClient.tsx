"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  TrendingUp,
  Wallet,
  PackageOpen,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
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
    <div className="w-full bg-gray-50 p-4 min-h-screen">
      <div className="space-y-6 pb-20">
        {/* 상단 알림 */}
        <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl flex items-center gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <p className="font-bold text-lg">
              <span className="font-bold">{user.nickname}</span>님, 오늘은 day{" "}
              {classInfo?.current_day || 1}입니다.
            </p>
            <p className="text-base text-indigo-600 mt-1">
              오늘 투자 결과는 내일 9시에 확인할 수 있어요.
            </p>
          </div>
        </div>

        {/* 내 계좌 */}
        <div className="space-y-4 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">내 계좌</h2>
          </div>
          <p className="text-4xl font-bold text-white pt-2">
            {walletInfo?.balance.toLocaleString() || 0}원
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/20 p-4 rounded-lg">
              <p className="text-base text-indigo-100">투자 중인 금액</p>
              <p className="text-xl font-semibold text-white">0원</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <p className="text-base text-indigo-100">주문 가능 금액</p>
              <p className="text-xl font-semibold text-white">
                {walletInfo?.balance.toLocaleString() || 0}원
              </p>
            </div>
          </div>
        </div>

        {/* 보유 종목 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">보유 종목</h2>
          <div className="p-6 bg-white rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <p className="text-lg text-gray-800 font-bold">
                보유 종목이 없어요
              </p>
              <p className="text-base text-gray-500 mt-1">
                뉴스를 읽고 투자해 보세요
              </p>
            </div>
            <button className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-transform active:scale-95 text-sm shrink-0">
              뉴스 보러가기 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
