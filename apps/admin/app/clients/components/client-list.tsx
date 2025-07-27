"use client";

import { createManager } from "@/actions/managerActions";
import { useState, FormEvent } from "react";
import { type Client } from "@/types/client";
import { type Manager } from "@/types/manager";
import { CreateClientModal } from "@/components/dialog/create-client-modal";
import { Button } from "@repo/ui";

// page.tsx에서 내려준 타입 (Client와 Manager 배열을 포함)
type ClientWithManagers = Client & {
  managers: Manager[];
};

function ManagerAddForm({
  clientId,
  onManagerAdded,
}: {
  clientId: string;
  onManagerAdded: (manager: Manager) => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("mobile_phone", mobile);
    formData.append("email", email);
    const result: any = await createManager(clientId, formData);
    setLoading(false);
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error
    ) {
      setError(
        typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", ")
      );
    } else {
      console.log("result", result);
      setMsg(result.message);
      setName("");
      setMobile("");
      setEmail("");
      // 새로 추가된 매니저를 부모 컴포넌트에 전달
      if (result && result.data) {
        onManagerAdded(result.data);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
      <input
        className="border p-1 rounded"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="border p-1 rounded"
        placeholder="연락처"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <input
        className="border p-1 rounded"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "저장 중..." : "매니저 저장"}
      </Button>
      {msg && <div className="text-green-600 text-sm mt-1">{msg}</div>}
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </form>
  );
}

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
                    <li
                      key={manager.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {manager.name} ({manager.mobile_phone})
                        <br />
                        {manager.email}
                      </span>
                      <div className="flex gap-2">
                        <Button className="text-xs text-blue-500">수정</Button>
                        <Button className="text-xs text-red-500">삭제</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  등록된 매니저가 없습니다.
                </p>
              )}
              {/* 신규 매니저 추가 폼 */}
              <ManagerAddForm
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
