import { ClientList } from "./components/client-list";

export default function ClientsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">고객사 및 매니저 관리</h1>
      </div>
      <ClientList />
    </div>
  );
}
