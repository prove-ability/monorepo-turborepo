import { db } from "@repo/db";
import { ClientList } from "./components/client-list";
import { desc, eq } from "drizzle-orm";
import { clients } from "@repo/db/schema";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  // 사용자 인증 확인
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  try {
    const clientData = await db.query.clients.findMany({
      where: eq(clients.created_by, user.id),
      columns: {
        id: true,
        name: true,
        mobile_phone: true,
        email: true,
        created_at: true,
        created_by: true,
      },
      with: {
        managers: {
          columns: {
            id: true,
            start_date: true,
            end_date: true,
            manager_id: true,
            client_id: true,
            created_at: true,
            updated_at: true,
            created_by: true,
            current_day: true,
          },
        },
      },
      orderBy: [desc(clients.created_at)],
    });

    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
        <ClientList initialClients={clientData} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return <p>오류: {message}</p>;
  }
}
