import { getSession } from "@/lib/session";
import { logout } from "@/actions/auth";
import { checkNeedsSetup } from "@/actions/profile";
import { getStocksWithPrices } from "@/actions/stocks";
import { redirect } from "next/navigation";
import StockChart from "@/components/StockChart";

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

  const stocksData = await getStocksWithPrices();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">주식 투자 게임</h1>
            <p className="text-sm text-gray-600">{user.name}님 환영합니다</p>
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

      <main className="px-4 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">주식 가격 차트</h2>
          <p className="text-sm text-gray-600">
            Day {stocksData[0]?.currentDay || 0} / {stocksData[0]?.maxDay || 9}
          </p>
        </div>

        <StockChart stocks={stocksData} />
      </main>
    </div>
  );
}
