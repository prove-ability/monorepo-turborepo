"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { createClass, getClientsAndManagers } from "@/actions/classActions";
import { Manager, Client } from "@/types";
import { Modal } from "@/components/common/modal";

interface CreateClassModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClassCreated: (newClass: any) => void;
}

export function CreateClassModal({
  isOpen,
  setIsOpen,
  onClassCreated,
}: CreateClassModalProps) {
  const [clients, setClients] = useState<Partial<Client>[]>([]);
  const [managers, setManagers] = useState<Partial<Manager>[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [filteredManagers, setFilteredManagers] = useState<Partial<Manager>[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClientsAndManagers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClientId) {
      setFilteredManagers(
        managers.filter((m) => m.client_id === selectedClientId)
      );
    } else {
      setFilteredManagers([]);
    }
  }, [selectedClientId, managers]);

  const loadClientsAndManagers = async () => {
    setIsLoading(true);
    try {
      const data = await getClientsAndManagers();
      setClients(data.clients);
      setManagers(data.managers);
    } catch (error) {
      console.error("Error loading clients and managers:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const result = await createClass(formData);

      // withAuth의 ActionState 타입 처리 (errors 필드)
      if ("success" in result && !result.success) {
        alert(`생성 실패: ${result.message}`);
        return;
      }

      // 액션의 실제 반환 타입 처리 (error 필드)
      if ("error" in result && result.error) {
        if ("_form" in result.error) {
          alert("생성 실패: " + result.error._form?.[0]);
        } else {
          const errors = Object.values(result.error).flat();
          alert("생성 실패: " + errors.join(", "));
        }
      } else if ("message" in result && result.message) {
        alert(result.message);
        if ("data" in result && result.data) {
          onClassCreated(result.data);
        }
        setIsOpen(false);
        // 폼 리셋
        (e.target as HTMLFormElement).reset();
        setSelectedClientId("");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="새 수업 추가"
      size="md"
    >
      {isLoading ? (
        <div className="text-center py-4">데이터를 불러오는 중...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                수업명 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="starting_balance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                학생 시작 금액
              </label>
              <input
                type="number"
                id="starting_balance"
                name="starting_balance"
                defaultValue={0}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="client_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                클라이언트 *
              </label>
              <select
                id="client_id"
                name="client_id"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">클라이언트를 선택하세요</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="manager_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                담당 매니저 *
              </label>
              <select
                id="manager_id"
                name="manager_id"
                required
                disabled={!selectedClientId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {selectedClientId
                    ? "매니저를 선택하세요"
                    : "먼저 클라이언트를 선택하세요"}
                </option>
                {filteredManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                시작일 *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                종료일 (선택사항)
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="px-4 py-2"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
