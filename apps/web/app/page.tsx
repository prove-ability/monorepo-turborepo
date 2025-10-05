import { getSession } from "@/lib/session";
import { logout } from "@/actions/auth";
import { checkNeedsSetup } from "@/actions/profile";
import { getDashboardData } from "@/actions/dashboard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // setup이 필요한지 확인
  const setupStatus = await checkNeedsSetup();
  if (setupStatus.needsSetup) {
    redirect("/setup");
  }

  const dashboardData = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">주식 투자 게임</h1>
            <p className="text-sm text-gray-600">{dashboardData.userName}님 환영합니다</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
        {/* 진행 상황 */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-5 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">진행 중인 게임</p>
              <h2 className="text-xl font-bold text-gray-900">{dashboardData.className}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1">진행도</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboardData.currentDay}
                <span className="text-lg text-gray-400">
                  /{dashboardData.totalDays}
                </span>
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-white rounded-full h-3 shadow-inner overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{
                  width: `${dashboardData.totalDays > 0 ? Math.min((dashboardData.currentDay / dashboardData.totalDays) * 100, 100) : 0}%`,
                }}
              >
                {dashboardData.totalDays > 0 && dashboardData.currentDay > 0 && (
                  <span className="text-[10px] font-bold text-white drop-shadow">
                    {Math.round((dashboardData.currentDay / dashboardData.totalDays) * 100)}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Day {dashboardData.currentDay} 진행 중
            </p>
          </div>
        </div>

        {/* 자산 현황 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-5 text-white shadow-lg">
          <h3 className="text-sm font-medium opacity-90 mb-1">총 자산</h3>
          <p className="text-3xl font-bold mb-4">
            {dashboardData.totalAssets.toLocaleString()}원
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-xs opacity-80 mb-1">잔액</p>
              <p className="text-lg font-semibold">
                {dashboardData.balance.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">보유 주식</p>
              <p className="text-lg font-semibold">
                {dashboardData.totalHoldingValue.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* 수익 현황 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">수익 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">수익금</p>
              <p
                className={`text-2xl font-bold ${
                  dashboardData.profit >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {dashboardData.profit >= 0 ? "+" : ""}
                {dashboardData.profit.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">수익률</p>
              <p
                className={`text-2xl font-bold ${
                  dashboardData.profitRate >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                {dashboardData.profitRate >= 0 ? "+" : ""}
                {dashboardData.profitRate.toFixed(2)}%
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">내 순위</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.myRank}위
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      / {dashboardData.totalParticipants}명
                    </span>
                  </p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                    <p className="font-semibold text-gray-900">{stock.stockName}</p>
                    <p className="text-xs text-gray-500">
                      {stock.quantity}주 · 평균 {stock.averagePrice.toLocaleString()}원
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

        {/* 빠른 액션 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/invest">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center cursor-pointer">
              <div className="text-3xl mb-2">📈</div>
              <p className="font-semibold text-gray-900">투자하기</p>
            </div>
          </Link>
          <Link href="/ranking">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center cursor-pointer">
              <div className="text-3xl mb-2">🏆</div>
              <p className="font-semibold text-gray-900">랭킹</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
