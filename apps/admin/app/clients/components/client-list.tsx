"use client";

import { createManager } from "@/actions/managerActions";
import { useState, FormEvent } from "react";
import { type Client } from "@/types/client";
import { type Manager } from "@/types/manager";
import { CreateClientModal } from "@/components/dialog/create-client-modal";
import { Button } from "@repo/ui";
import { AddManagerForm } from "./add-manager-form";
import { ManagerListItem } from "./manager-list-item";

// page.tsx에서 내려준 타입 (Client와 Manager 배열을 포함)
type ClientWithManagers = Client & {
  managers: Manager[];
};

export function ClientList({
  initialClients,
}: {
  initialClients: ClientWithManagers[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  const toggleManagers = (clientId: string) => {
    setSelectedClientId(selectedClientId === clientId ? null : clientId);
  };

  const handleManagerAdded = (clientId: string, newManager: Manager) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? { ...client, managers: [...client.managers, newManager] }
          : client
      )
    );
  };

  const handleManagerDeleted = (managerId: string) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.managers.some((manager) => manager.id === managerId)
          ? {
              ...client,
              managers: client.managers.filter(
                (manager) => manager.id !== managerId
              ),
            }
          : client
      )
    );
  };

  return (
    <div className="space-y-4">
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        setIsOpen={setIsCreateClientModalOpen}
      />
      {clients.map((client) => (
        <div key={client.id} className="border rounded-lg shadow-sm">
          {/* 고객사 정보 헤더 */}
          <div
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
            onClick={() => toggleManagers(client.id)}
          >
            <div>
              <h3 className="font-bold text-lg">{client.name}</h3>
              <p className="text-sm text-gray-500">
                {client.email} | {client.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="text-sm text-blue-500">수정</Button>
              <Button className="text-sm text-red-500">삭제</Button>
              <span>{selectedClientId === client.id ? "▲" : "▼"}</span>
            </div>
          </div>

          {/* 매니저 목록 (선택된 고객사일 경우 보임) */}
          {selectedClientId === client.id && (
            <div className="p-4 border-t">
              <h4 className="font-semibold mb-2">
                담당 매니저 ({client.managers.length})
              </h4>
              {client.managers.length > 0 ? (
                <ul className="space-y-2">
                  {client.managers.map((manager) => (
                    <ManagerListItem
                      key={manager.id}
                      manager={manager}
                      handleManagerDeleted={handleManagerDeleted}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  등록된 매니저가 없습니다.
                </p>
              )}
              {/* 신규 매니저 추가 폼 */}
              <AddManagerForm
                clientId={client.id}
                onManagerAdded={(manager) =>
                  handleManagerAdded(client.id, manager)
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
