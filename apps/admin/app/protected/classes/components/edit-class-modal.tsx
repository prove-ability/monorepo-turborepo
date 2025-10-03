"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { updateClass, getClientsAndManagers } from "@/actions/classActions";
import { Manager, Client, Class } from "@/types";
import { Modal } from "@/components/common/modal";

interface ClassData extends Class {
  client: Client | null;
  manager: Manager | null;
}

interface EditClassModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  classData: ClassData;
  onClassUpdated: (updatedClass: ClassData) => void;
}

export function EditClassModal({
  isOpen,
  setIsOpen,
  classData,
  onClassUpdated,
}: EditClassModalProps) {
  const [clients, setClients] = useState<Partial<Client>[]>([]);
  const [managers, setManagers] = useState<Partial<Manager>[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(
    classData.clientId || ""
  );
  const [selectedManagerId, setSelectedManagerId] = useState(
    classData.managerId || ""
  );
  const [filteredManagers, setFilteredManagers] = useState<Partial<Manager>[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    managerId: "",
    clientId: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadClientsAndManagers();
      setSelectedClientId(classData.clientId || "");
    }
  }, [isOpen, classData.clientId]);

  useEffect(() => {
    if (selectedClientId) {
      const filtered = managers.filter(
        (manager) => manager.client_id === selectedClientId
      );
      setFilteredManagers(filtered);

      // 클라이언트가 변경되면 매니저 선택 초기화 (단, 초기 로드 시에는 유지)
      if (selectedClientId !== classData.clientId) {
        setSelectedManagerId("");
      }
    } else {
      setFilteredManagers([]);
      setSelectedManagerId("");
    }
  }, [selectedClientId, managers, classData.clientId]);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        managerId: classData.managerId || "",
        clientId: classData.clientId || "",
      });
    }
  }, [classData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const isNumber = type === "number";
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };

  const loadClientsAndManagers = async () => {
    setIsLoading(true);
    try {
      const data = await getClientsAndManagers();
      setClients(data.clients);
      setManagers(data.managers);
    } catch (error) {
      console.error(error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const result = await updateClass(classData.id, formData);

      // withAuth의 ActionState 타입 처리 (errors 필드)
      if ("success" in result && !result.success) {
        alert(`수정 실패: ${result.message}`);
        return;
      }

      // 액션의 실제 반환 타입 처리 (error 필드)
      if ("error" in result && result.error) {
        const errorMessages = Object.values(result.error).flat().join(", ");
        alert(`수정 실패: ${errorMessages}`);
      } else if ("data" in result && result.data) {
        alert("수업이 성공적으로 수정되었습니다.");
        onClassUpdated(result.data);
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log(classData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="수업 수정"
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
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="수업명을 입력하세요"
            />
          </div>

          {/* <div className="mb-4">
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
                value={formData.startingBalance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="예: 100000"
              />
            </div> */}

          <div>
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              클라이언트 *
            </label>
            <select
              id="clientId"
              name="clientId"
              required
              value={selectedClientId || ""}
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
              htmlFor="managerId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              담당 매니저 *
            </label>
            <select
              id="managerId"
              name="managerId"
              required
              disabled={!selectedClientId}
              value={selectedManagerId || ""}
              onChange={(e) => setSelectedManagerId(e.target.value)}
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
              {isSubmitting ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
