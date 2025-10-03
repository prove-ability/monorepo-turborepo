"use client";

import { useState, useEffect } from "react";
import { getClasses } from "@/actions/classActions";
import { Button } from "@repo/ui";
import { CreateClassModal } from "./create-class-modal";
import { EditClassModal } from "./edit-class-modal";
import { ClassListItem } from "./class-list-item";
import { Class, Manager, Client } from "@/types";

interface ClassWithRelations extends Class {
  client: Client | null;
  manager: Manager | null;
}

export function ClassList() {
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(
    null
  );

  const handleClassCreated = (newClass: ClassWithRelations) => {
    setClasses((prev) => [newClass, ...prev]);
  };

  const handleClassUpdated = (updatedClass: ClassWithRelations) => {
    setClasses((prev) =>
      prev.map((cls) => (cls.id === updatedClass.id ? updatedClass : cls))
    );
  };

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        const result = await getClasses();

        // Check for authentication or API errors
        if (!result.success) {
          const errorMsg =
            "message" in result
              ? result.message
              : "error" in result && result.error instanceof Error
                ? result.error.message
                : "데이터를 불러오는데 실패했습니다.";
          setError(errorMsg || "인증에 실패했습니다.");
          return;
        }

        // Success case: result has 'data' property
        if ("data" in result && result.data) {
          setClasses(result.data);
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  const onClassUpdated = async () => {
    const result = await getClasses();

    // Only update if successful and has data
    if (result.success && "data" in result && result.data) {
      setClasses(result.data);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

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
            <ClassListItem
              key={classItem.id}
              classItem={classItem}
              onClassUpdated={onClassUpdated}
              onEditClass={(classItem) => setEditingClass(classItem)}
            />
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
