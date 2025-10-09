"use client";

import { useState } from "react";
import { logout } from "@/actions/auth";
import { getDashboardData } from "@/actions/dashboard";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import BenefitNotificationBanner from "@/components/BenefitNotificationBanner";
import AnimatedBalance from "@/components/AnimatedBalance";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import Day1GuideBanner from "@/components/Day1GuideBanner";
import Day2GuideBanner from "@/components/Day2GuideBanner";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTour } from "@/hooks/useTour";

export default function Home() {
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);

  // React Query로 데이터 페칭
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
    staleTime: 30 * 1000, // 30초
    refetchOnWindowFocus: true, // 탭 전환 시 자동 갱신
  });

  useTour(!isLoading && !!dashboardData);

  // Pull-to-refresh 기능
  const { isRefreshing } = usePullToRefresh(async () => {
    await refetch();
  });

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh 인디케이터 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <PageHeader
          title="투자 게임"
          description={`${dashboardData.userName}님, 주식시장 속에서 한 걸음! 🚀`}
        />
        {/* 지원금 알림 배너 */}
        <BenefitNotificationBanner benefit={dashboardData.latestBenefit} />
        {/* Day 1 가이드 배너 */}
        <Day1GuideBanner currentDay={dashboardData.currentDay} />
        {/* Day 2 가이드 배너 */}
        <Day2GuideBanner currentDay={dashboardData.currentDay} />

        {/* 진행 상황 */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {dashboardData.className}
            </h2>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">Day</span>
            <span className="text-3xl font-semibold text-emerald-700">
              {dashboardData.currentDay}
            </span>
            <span className="text-lg font-medium text-gray-400">
              / {dashboardData.totalDays}
            </span>
          </div>

          <div className="relative">
            <progress
              value={dashboardData.currentDay}
              max={dashboardData.totalDays}
              className="w-full h-3 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-white [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:shadow-inner [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-emerald-500 [&::-webkit-progress-value]:to-emerald-600 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500 [&::-moz-progress-bar]:bg-gradient-to-r [&::-moz-progress-bar]:from-emerald-500 [&::-moz-progress-bar]:to-emerald-600 [&::-moz-progress-bar]:rounded-full"
              aria-label={`진행도 ${dashboardData.currentDay}/${dashboardData.totalDays}`}
            />
            {dashboardData.totalDays > 0 && dashboardData.currentDay > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-end pr-2 cursor-pointer"
                onClick={() => {
                  const newCount = tapCount + 1;
                  setTapCount(newCount);

                  if (newCount >= 5) {
                    const confirmLogout =
                      window.confirm("로그아웃 하시겠습니까?");
                    if (confirmLogout) {
                      handleLogout();
                    }
                    setTapCount(0);
                  }

                  // 2초 후 카운트 리셋
                  setTimeout(() => setTapCount(0), 2000);
                }}
              >
                <span className="text-[10px] font-bold text-gray-600 drop-shadow select-none">
                  {Math.round(
                    (dashboardData.currentDay / dashboardData.totalDays) * 100
                  )}
                  %
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 내 자산 */}
        <div
          id="wallet-balance"
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">내 자산</h3>
            {dashboardData.profit !== 0 && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  dashboardData.profit >= 0
                    ? "bg-red-50 text-red-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {dashboardData.profit >= 0 ? "수익 중! 🔥" : "손실 중 😢"}
              </span>
            )}
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            {dashboardData.totalAssets.toLocaleString()}원
          </p>
          {dashboardData.profit !== 0 && (
            <p
              className={`text-sm font-medium mb-5 ${
                dashboardData.profit >= 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {dashboardData.profit >= 0 ? "+" : ""}
              {dashboardData.profit.toLocaleString()}원 (
              {dashboardData.profit >= 0 ? "+" : ""}
              {dashboardData.profitRate.toFixed(2)}%)
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-600 mb-1.5">남은 현금</p>
              <div className="text-base font-bold text-gray-900">
                <AnimatedBalance
                  balance={dashboardData.balance}
                  benefit={dashboardData.latestBenefit}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1.5">내 주식</p>
              <p className="text-base font-bold text-gray-900">
                {dashboardData.totalHoldingValue.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* 내 순위 */}
        {dashboardData.myRank && (
          <Link href="/ranking">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 active:scale-[0.98] transition-all cursor-pointer mb-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-600 mb-1.5">
                    내 순위
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.myRank}등
                    <span className="text-sm font-medium text-gray-500 ml-2">
                      / {dashboardData.totalParticipants}명
                    </span>
                  </p>
                </div>
                <div className="text-gray-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 보유 주식 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">보유 주식</h3>
            <Link
              href="/invest?filter=holdings"
              className="text-xs text-gray-500 hover:text-gray-700 font-bold"
            >
              상세보기 →
            </Link>
          </div>

          {dashboardData.holdingStocks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-sm text-gray-600 mb-3">
                보유 중인 주식이 없습니다
              </p>
              <Link
                href="/invest"
                className="inline-block text-xs text-gray-500 hover:text-gray-700 font-bold"
              >
                주식 투자하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.holdingStocks.slice(0, 3).map((stock) => (
                <div
                  key={stock.stockId}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">
                      {stock.stockName}
                    </p>
                    <p className="text-xs text-gray-500">{stock.quantity}주</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm mb-0.5">
                      {stock.holdingValue.toLocaleString()}원
                    </p>
                    <p
                      className={`text-xs font-bold ${
                        stock.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {stock.profitLoss >= 0 ? "+" : ""}
                      {stock.profitLoss.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}

              {/* Day 2+ 투자 분석 버튼 */}
              {dashboardData.currentDay >= 2 &&
                dashboardData.holdingStocks.length > 0 && (
                  <Link
                    href="/analysis"
                    className="block mt-4 bg-emerald-700 text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-emerald-800 active:scale-95 transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>어제 투자 결과 궁금해? 📈</span>
                      <span className="text-xs opacity-90 font-normal">
                        뉴스가 수익에 미친 영향 분석
                      </span>
                    </div>
                  </Link>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
