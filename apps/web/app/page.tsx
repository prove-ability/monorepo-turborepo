"use client";

import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { getDashboardData, DashboardData } from "@/actions/dashboard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BenefitNotificationBanner from "@/components/BenefitNotificationBanner";
import AnimatedBalance from "@/components/AnimatedBalance";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTour } from "@/hooks/useTour";
import { Home as HomeIcon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useTour(!isLoading && !!dashboardData);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardData();
      setDashboardData(data as DashboardData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh 기능
  const { isRefreshing } = usePullToRefresh(async () => {
    await loadDashboard();
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
          description={`${dashboardData.userName}님, 주식시장 속에서 오늘도 한 걸음! 🚀`}
          icon={<HomeIcon className="h-7 w-7 text-blue-600" />}
        />
        {/* 지원금 알림 배너 */}
        <BenefitNotificationBanner benefit={dashboardData.latestBenefit} />

        {/* 진행 상황 */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-5 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {dashboardData.className}
              </h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-gray-600">Day</span>
              <span className="text-3xl font-bold text-blue-600">
                {dashboardData.currentDay}
              </span>
              <span className="text-lg font-medium text-gray-400">
                / {dashboardData.totalDays}
              </span>
            </div>
          </div>

          <div className="relative">
            <progress
              value={dashboardData.currentDay}
              max={dashboardData.totalDays}
              className="w-full h-3 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-white [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:shadow-inner [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-blue-500 [&::-webkit-progress-value]:to-blue-600 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-500 [&::-moz-progress-bar]:bg-gradient-to-r [&::-moz-progress-bar]:from-blue-500 [&::-moz-progress-bar]:to-blue-600 [&::-moz-progress-bar]:rounded-full"
              aria-label={`진행도 ${dashboardData.currentDay}/${dashboardData.totalDays}`}
            />
            {dashboardData.totalDays > 0 && dashboardData.currentDay > 0 && (
              <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                <span className="text-[10px] font-bold text-gray-600 drop-shadow">
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
          className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-5 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">💰 내 자산</h3>
            {dashboardData.profit !== 0 && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  dashboardData.profit >= 0
                    ? "bg-red-500/20 text-red-100"
                    : "bg-blue-300/20 text-blue-100"
                }`}
              >
                {dashboardData.profit >= 0 ? "📈 수익 중" : "📉 손실 중"}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mb-1">
            {dashboardData.totalAssets.toLocaleString()}원
          </p>
          {dashboardData.profit !== 0 && (
            <p
              className={`text-sm font-medium mb-3 ${
                dashboardData.profit >= 0 ? "text-red-100" : "text-blue-100"
              }`}
            >
              {dashboardData.profit >= 0 ? "+" : ""}
              {dashboardData.profit.toLocaleString()}원 (
              {dashboardData.profit >= 0 ? "+" : ""}
              {dashboardData.profitRate.toFixed(2)}%)
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-xs opacity-80 mb-1">💵 보유 현금</p>
              <div className="text-lg font-semibold">
                <AnimatedBalance
                  balance={dashboardData.balance}
                  benefit={dashboardData.latestBenefit}
                />
              </div>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">📊 주식 가치</p>
              <p className="text-lg font-semibold">
                {dashboardData.totalHoldingValue.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* 내 랭킹 */}
        {dashboardData.myRank && (
          <Link href="/ranking">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    내 순위
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.myRank}위
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      / {dashboardData.totalParticipants}명
                    </span>
                  </p>
                </div>
                <div className="text-gray-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 보유 주식 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">보유 주식</h3>
            <Link
              href="/invest"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              상세보기 →
            </Link>
          </div>

          {dashboardData.holdingStocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">보유 중인 주식이 없습니다</p>
              <Link
                href="/invest"
                className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                주식 투자하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.holdingStocks.slice(0, 3).map((stock) => (
                <div
                  key={stock.stockId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {stock.stockName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stock.quantity}주 · 평균{" "}
                      {stock.averagePrice.toLocaleString()}원
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {stock.holdingValue.toLocaleString()}원
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        stock.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {stock.profitLoss >= 0 ? "+" : ""}
                      {stock.profitLoss.toLocaleString()}원 (
                      {stock.profitLoss >= 0 ? "+" : ""}
                      {stock.profitLossRate.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              ))}

              {dashboardData.holdingStocks.length > 3 && (
                <Link
                  href="/invest"
                  className="block text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  +{dashboardData.holdingStocks.length - 3}개 더보기
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
