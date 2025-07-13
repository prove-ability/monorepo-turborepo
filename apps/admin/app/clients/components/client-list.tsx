"use client";

import { useState, useActionState } from "react";
import { type Client } from "@/types/client";
import { type Manager } from "@/types/manager";
import { createClientAction } from "@/actions/clientActions";
import {
  CreateClientInputs,
  CreateClientModal,
} from "@/components/dialog/create-client-modal";

// page.tsx에서 내려준 타입 (Client와 Manager 배열을 포함)
type ClientWithManagers = Client & {
  managers: Manager[];
};

export function ClientList({
  initialClients,
}: {
  initialClients: ClientWithManagers[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  const toggleManagers = (clientId: string) => {
    setSelectedClientId(selectedClientId === clientId ? null : clientId);
  };

  const handleCreateClient = (data: CreateClientInputs) => {
    console.log("data", data);
  };

  return (
    <div className="space-y-4">
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        setIsOpen={setIsCreateClientModalOpen}
        handleCreateClient={handleCreateClient}
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
              <button className="text-sm text-blue-500">수정</button>
              <button className="text-sm text-red-500">삭제</button>
              <span>{selectedClientId === client.id ? "▲" : "▼"}</span>
            </div>
          </div>

          {/* 매니저 목록 (선택된 고객사일 경우 보임) */}
          {selectedClientId === client.id && (
            <div className="p-4 border-t">
              <h4 className="font-semibold mb-2">담당 매니저</h4>
              {client.managers.length > 0 ? (
                <ul className="space-y-2">
                  {client.managers.map((manager) => (
                    <li
                      key={manager.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {manager.name} ({manager.mobile_phone})
                      </span>
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-500">수정</button>
                        <button className="text-xs text-red-500">삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  등록된 매니저가 없습니다.
                </p>
              )}
              {/* 신규 매니저 추가 폼 버튼 */}
              <button className="mt-4 text-sm p-2 bg-gray-200 rounded">
                매니저 추가
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
