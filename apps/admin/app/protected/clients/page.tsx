import { ClientList } from "./components/client-list";
import { getClients } from "@/actions/clientActions";

export default async function ClientsPage() {
  const result = await getClients();

  if (!result.success || !("data" in result)) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
        <p className="text-red-600">
          {"message" in result
            ? result.message
            : "클라이언트 목록을 불러오는 중 오류가 발생했습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
      <ClientList initialClients={result.data} />
    </div>
  );
}
