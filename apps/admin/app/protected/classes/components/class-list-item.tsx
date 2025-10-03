"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { deleteClass } from "@/actions/classActions";
import { CreateUserModal } from "./create-user-modal";
import { useRouter } from "next/navigation";
import { Class, Manager, Client } from "@/types";

interface ClassWithRelations extends Class {
  client: Client | null;
  manager: Manager | null;
}

interface ClassListItemProps {
  classItem: ClassWithRelations;
  onClassUpdated: () => void;
  onEditClass: (classItem: ClassWithRelations) => void;
}

export function ClassListItem({
  classItem,
  onClassUpdated,
  onEditClass,
}: ClassListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const handleDeleteClass = async (classId: string, className: string) => {
    if (
      !confirm(
        `"${className}" 수업을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n해당 수업에 속한 학생(guests), 뉴스, 주식 가격 정보도 함께 삭제됩니다.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteClass(classId);
      if ("error" in result && result.error) {
        alert("삭제 중 오류가 발생했습니다.");
      } else if ("success" in result && !result.success) {
        alert(result.message || "삭제 중 오류가 발생했습니다.");
      } else {
        onClassUpdated();
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-sm p-6 bg-white">
      <div className="mb-4">
        <h3
          className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
          onClick={() => router.push(`/classes/${classItem.id}`)}
        >
          {classItem.name}
        </h3>
        <div className="text-sm text-gray-600 space-y-1 mt-2">
          <p>
            <span className="font-medium">클라이언트:</span>{" "}
            {classItem.client?.name || "데이터 없음"}
          </p>
          <p>
            <span className="font-medium">담당 매니저:</span>{" "}
            {classItem.manager?.name || "데이터 없음"}
          </p>
          <p>
            <span className="font-medium">생성일:</span>{" "}
            {new Date(classItem.createdAt).toLocaleDateString("ko-KR")}
          </p>
          {classItem.updatedAt && (
            <p>
              <span className="font-medium">수정일:</span>{" "}
              {new Date(classItem.updatedAt).toLocaleDateString("ko-KR")}
            </p>
          )}
          <p>
            <span className="font-medium">현재 Day:</span>{" "}
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Day {classItem.currentDay || 1}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 justify-end">
        <Button
          variant="ghost"
          onClick={() => router.push(`/protected/classes/${classItem.id}`)}
          className="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1"
        >
          👁️ 상세
        </Button>
        <Button
          variant="ghost"
          onClick={() => setIsStudentModalOpen(true)}
          className="text-xs text-green-500 hover:bg-green-50 px-2 py-1"
        >
          + 학생
        </Button>
        <Button
          onClick={() => onEditClass(classItem)}
          className="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1"
          variant="ghost"
        >
          수정
        </Button>
        <Button
          onClick={() =>
            handleDeleteClass(classItem.id, classItem.name || "수업")
          }
          disabled={isDeleting}
          className="text-xs text-red-500 hover:bg-red-50 px-2 py-1"
          variant="ghost"
        >
          {isDeleting ? "삭제중" : "삭제"}
        </Button>
      </div>

      <CreateUserModal
        isOpen={isStudentModalOpen}
        setIsOpen={setIsStudentModalOpen}
        classId={classItem.id}
        clientId={classItem.clientId || ""}
        onUserCreated={onClassUpdated}
      />
    </div>
  );
}
