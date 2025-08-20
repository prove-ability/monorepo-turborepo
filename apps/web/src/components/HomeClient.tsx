"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getWallet, getHoldings } from "@/actions/userActions";
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

interface Holding {
  stock_id: string;
  quantity: number;
  average_purchase_price: number;
  name: string | null;
  current_price: number | null;
}

interface HomeClientProps {
  user: User;
}

const AccountSkeleton = () => (
  <div className="space-y-4 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-md animate-pulse">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-white">내 계좌</h2>
    </div>
    {/* text-4xl pt-2에 해당하는 높이와 패딩 적용 */}
    <div className="pt-2">
      <div className="h-10 bg-white/30 rounded-md w-3/4"></div>
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4">
      <div className="bg-white/20 p-4 rounded-lg">
        <p className="text-base text-indigo-100">투자 중인 금액</p>
        {/* text-xl에 해당하는 높이 적용 */}
        <div className="h-7 bg-white/30 rounded-md mt-1 w-1/2"></div>
      </div>
      <div className="bg-white/20 p-4 rounded-lg">
        <p className="text-base text-indigo-100">주문 가능 금액</p>
        {/* text-xl에 해당하는 높이 적용 */}
        <div className="h-7 bg-white/30 rounded-md mt-1 w-1/2"></div>
      </div>
    </div>
  </div>
);

export default function HomeClient({ user }: HomeClientProps) {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classData, walletData, holdingsData] = await Promise.all([
          getClassInfo(user.class_id),
          getWallet(user.user_id),
          getHoldings(),
        ]);
        setClassInfo(classData);
        setWalletInfo(walletData);
        setHoldings(holdingsData || []);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user.class_id, user.user_id]);

  // 투자 원금
  const investedAmount = holdings.reduce(
    (acc, holding) => acc + holding.average_purchase_price * holding.quantity,
    0
  );

  // 보유 주식 평가액
  const evaluationAmount = holdings.reduce((acc, holding) => {
    const currentPrice = holding.current_price || 0;
    return acc + currentPrice * holding.quantity;
  }, 0);

  // 총 자산 = 현금 + 보유 주식 평가액
  const totalAssetValue = (walletInfo?.balance || 0) + evaluationAmount;

  return (
    <div className="w-full min-h-screen">
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
        {isLoading ? (
          <AccountSkeleton />
        ) : (
          <div className="space-y-4 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-md">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">내 계좌</h2>
            </div>
            <p className="text-4xl font-bold text-white pt-2">
              {totalAssetValue.toLocaleString()}원
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/20 p-4 rounded-lg">
                <p className="text-base text-indigo-100">투자 중인 금액</p>
                <p className="text-xl font-semibold text-white">
                  {investedAmount.toLocaleString()}원
                </p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg">
                <p className="text-base text-indigo-100">주문 가능 금액</p>
                <p className="text-xl font-semibold text-white">
                  {walletInfo?.balance.toLocaleString() || 0}원
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 보유 종목 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">보유 종목</h2>
          {holdings && holdings.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {holdings.map((holding) => {
                console.log("holding", holding);
                const currentPrice = holding.current_price || 0;
                const evaluation = currentPrice * holding.quantity;
                const profit =
                  evaluation -
                  holding.average_purchase_price * holding.quantity;
                const profitRate =
                  holding.average_purchase_price === 0
                    ? 0
                    : (profit /
                        (holding.average_purchase_price * holding.quantity)) *
                      100;

                const colorClass =
                  profit > 0
                    ? "text-red-500"
                    : profit < 0
                      ? "text-blue-500"
                      : "text-gray-500";

                return (
                  <div
                    key={holding.stock_id}
                    className="p-4 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg text-gray-800">
                        {holding.name}
                      </div>
                      <div className={`font-semibold ${colorClass}`}>
                        {profit.toLocaleString()}원
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <div className="text-gray-500">
                        {holding.quantity}주 ·{" "}
                        {holding.average_purchase_price.toLocaleString()}원
                      </div>
                      <div className={`${colorClass}`}>
                        {profitRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
