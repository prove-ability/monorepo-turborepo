"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { CreateClassModal } from "./create-class-modal";
import { EditClassModal } from "./edit-class-modal";
import { deleteClass } from "@/actions/classActions";

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

interface ClassListProps {
  initialClasses: ClassWithRelations[];
}

export function ClassList({ initialClasses }: ClassListProps) {
  const [classes, setClasses] = useState(initialClasses);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(
    null
  );
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const handleClassCreated = (newClass: ClassWithRelations) => {
    setClasses((prev) => [newClass, ...prev]);
  };

  const handleClassUpdated = (updatedClass: ClassWithRelations) => {
    setClasses((prev) =>
      prev.map((cls) => (cls.id === updatedClass.id ? updatedClass : cls))
    );
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`"${className}" 수업을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingClassId(classId);
    try {
      const result = await deleteClass(classId);
      if (result.error) {
        const errorMessage =
          "_form" in result.error ? result.error._form?.[0] : "알 수 없는 오류";
        alert("삭제 실패: " + errorMessage);
      } else {
        alert(result.message);
        setClasses((prev) => prev.filter((cls) => cls.id !== classId));
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingClassId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">총 {classes.length}개의 수업</p>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          새 수업 추가
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">등록된 수업이 없습니다.</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
          >
            첫 번째 수업 추가하기
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="border rounded-lg shadow-sm p-6 bg-white"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {classItem.name}
                </h3>
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
                  onClick={() => setEditingClass(classItem)}
                  className="text-xs text-blue-500 hover:bg-blue-50"
                  variant="ghost"
                >
                  수정
                </Button>
                <Button
                  onClick={() =>
                    handleDeleteClass(classItem.id, classItem.name)
                  }
                  disabled={deletingClassId === classItem.id}
                  className="text-xs text-red-500 hover:bg-red-50"
                  variant="ghost"
                >
                  {deletingClassId === classItem.id ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClassModal
        isOpen={isCreateModalOpen}
        setIsOpen={setIsCreateModalOpen}
        onClassCreated={handleClassCreated}
      />

      {editingClass && (
        <EditClassModal
          isOpen={!!editingClass}
          setIsOpen={(open) => !open && setEditingClass(null)}
          classData={editingClass}
          onClassUpdated={handleClassUpdated}
        />
      )}
    </div>
  );
}
