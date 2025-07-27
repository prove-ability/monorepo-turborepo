"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import type { Class } from "@/types/class";
import { CreateClassModal } from "./create-class-modal";
import { EditClassModal } from "./edit-class-modal";
import { ClassListItem } from "./class-list-item";
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

  const onClassUpdated = () => {
    // 클래스 목록을 새로고침하기 위해 부모 컴포넌트에서 다시 데이터를 가져와야 함
    // 여기서는 간단히 페이지 새로고침을 사용하거나, 부모에서 refetch 함수를 전달받아야 함
    window.location.reload();
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
