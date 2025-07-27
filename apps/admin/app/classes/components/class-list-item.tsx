"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { deleteClass } from "@/actions/classActions";
import { CreateStudentModal } from "./create-student-modal";

interface ClassWithRelations {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  manager_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
  managers: { id: string; name: string } | null;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`"${className}" 수업을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteClass(classId);
      if (result?.error) {
        alert("삭제 중 오류가 발생했습니다.");
      } else {
        onClassUpdated();
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg shadow-sm p-6 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{classItem.name}</h3>
        <div className="text-sm text-gray-600 space-y-1 mt-2">
          <p>
            <span className="font-medium">클라이언트:</span>{" "}
            {classItem.clients?.name || "데이터 없음"}
          </p>
          <p>
            <span className="font-medium">담당 매니저:</span>{" "}
            {classItem.managers?.name || "데이터 없음"}
          </p>
          <p>
            <span className="font-medium">시작일:</span>{" "}
            {new Date(classItem.start_date).toLocaleDateString("ko-KR")}
          </p>
          {classItem.end_date && (
            <p>
              <span className="font-medium">종료일:</span>{" "}
              {new Date(classItem.end_date).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          onClick={() => setIsStudentModalOpen(true)}
          className="text-xs text-green-500 hover:bg-green-50"
        >
          학생 추가
        </Button>
        <Button
          onClick={() => onEditClass(classItem)}
          className="text-xs text-blue-500 hover:bg-blue-50"
          variant="ghost"
        >
          수정
        </Button>
        <Button
          onClick={() => handleDeleteClass(classItem.id, classItem.name)}
          disabled={isDeleting}
          className="text-xs text-red-500 hover:bg-red-50"
          variant="ghost"
        >
          {isDeleting ? "삭제 중..." : "삭제"}
        </Button>
      </div>

      <CreateStudentModal
        isOpen={isStudentModalOpen}
        setIsOpen={setIsStudentModalOpen}
        classId={classItem.id}
        clientId={classItem.client_id}
        onStudentCreated={onClassUpdated}
      />
    </div>
  );
}
