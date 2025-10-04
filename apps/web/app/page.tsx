import { getSession } from "@/lib/session";
import { logout } from "@/actions/auth";
import { checkNeedsSetup } from "@/actions/profile";
import { redirect } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            주식 투자 게임
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}님 환영합니다
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">메인 페이지</h2>
          <p className="text-gray-600">
            로그인에 성공했습니다! 이제 게임 기능을 추가할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
