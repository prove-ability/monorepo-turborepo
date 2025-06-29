import { createClientByServerSide } from "@/lib";
import { ClientList } from "./components/client-list";

export default async function ClientsPage() {
  const supabase = await createClientByServerSide();

  // Supabase의 관계형 쿼리: clients 테이블을 조회하면서,
  // 관련된 managers 테이블의 모든 데이터(*)를 함께 가져옵니다.
  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      managers ( * )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <p>오류: {error.message}</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
      <ClientList initialClients={clients} />
    </div>
  );
}
