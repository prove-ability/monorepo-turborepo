import { ClientList } from "./components/client-list";
import { getClients } from "@/actions/clientActions";

export default async function ClientsPage() {
  const result = await getClients();

  // ActionState 타입 체크 (인증 실패 또는 에러)
  if (!("data" in result)) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {"message" in result
              ? result.message
              : "클라이언트 목록을 불러오는 중 오류가 발생했습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">고객사 및 매니저 관리</h1>
      </div>
      <ClientList initialClients={result.data} />
    </div>
  );
}
