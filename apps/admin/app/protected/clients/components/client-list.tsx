"use client";

import { deleteClientAction } from "@/actions/clientActions";
import { useState } from "react";
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
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

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

  const handleClientCreated = (newClient: ClientWithManagers) => {
    setClients((prevClients) => [newClient, ...prevClients]);
  };

  const handleClientDelete = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `${clientName} 고객사를 삭제하시겠습니까?\n\n주의: 해당 고객사의 모든 매니저 정보도 함께 삭제됩니다.`
      )
    ) {
      return;
    }

    setDeletingClientId(clientId);
    try {
      const result = await deleteClientAction(clientId);
      if (result.success) {
        alert(result.message);
        setClients((prevClients) =>
          prevClients.filter((client) => client.id !== clientId)
        );
        // 삭제된 클라이언트가 현재 선택된 클라이언트라면 선택 해제
        if (selectedClientId === clientId) {
          setSelectedClientId(null);
        }
      } else {
        alert("삭제 실패: " + result.message);
      }
    } catch (error) {
      console.error("삭제 중 오류가 발생했습니다.", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsCreateClientModalOpen(true)}>
          + 고객사 추가
        </Button>
      </div>
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        setIsOpen={setIsCreateClientModalOpen}
        onClientCreated={handleClientCreated}
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
            </div>
            <div className="flex gap-2">
              {/* <Button className="text-sm text-blue-500">수정</Button> */}
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // 클릭 이벤트 버블링 방지
                  handleClientDelete(client.id, client.name);
                }}
                disabled={deletingClientId === client.id}
              >
                {deletingClientId === client.id ? "삭제 중..." : "삭제"}
              </Button>
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
