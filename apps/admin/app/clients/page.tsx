import { db } from "@repo/db";
import { ClientList } from "./components/client-list";
import { desc } from "drizzle-orm";
import { clients } from "@repo/db/schema";

export default async function ClientsPage() {
  try {
    const clientData = await db.query.clients.findMany({
      columns: {
        id: true,
        name: true,
        mobilePhone: true,
        email: true,
        createdAt: true,
        createdBy: true,
      },
      with: {
        managers: {
          columns: {
            id: true,
            startDate: true,
            endDate: true,
            managerId: true,
            clientId: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
            currentDay: true,
          },
        },
      },
      orderBy: [desc(clients.createdAt)],
    });

    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">고객사 및 매니저 관리</h1>
        <ClientList initialClients={clientData} />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return <p>오류: {message}</p>;
  }
}
