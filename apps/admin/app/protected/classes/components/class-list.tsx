"use client";

import { useState } from "react";
import { getClasses } from "@/actions/classActions";
import { Button } from "@repo/ui";
import { CreateClassModal } from "./create-class-modal";
import { EditClassModal } from "./edit-class-modal";
import { ClassListItem } from "./class-list-item";
import { Class, Manager, Client } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ClassWithRelations extends Class {
  client: Client | null;
  manager: Manager | null;
}

export function ClassList() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithRelations | null>(
    null
  );

  const handleClassCreated = (newClass: ClassWithRelations) => {
    // 캐시에 즉시 반영 후, 외부에서 무효화되어도 UX 동일 유지
    queryClient.setQueryData<ClassWithRelations[]>(["classes", "list"], (prev) => {
      const arr = prev ?? [];
      return [newClass, ...arr];
    });
  };

  const handleClassUpdated = (updatedClass: ClassWithRelations) => {
    queryClient.setQueryData<ClassWithRelations[]>(["classes", "list"], (prev) => {
      const arr = prev ?? [];
      return arr.map((cls) => (cls.id === updatedClass.id ? updatedClass : cls));
    });
  };

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["classes", "list"],
    queryFn: async () => {
      const result = await getClasses();
      if (!result.success) {
        const errorMsg =
          "message" in result
            ? result.message
            : "error" in result && result.error instanceof Error
              ? result.error.message
              : "데이터를 불러오는데 실패했습니다.";
        throw new Error(errorMsg || "인증에 실패했습니다.");
      }
      return "data" in result && result.data ? result.data : [];
    },
  });
  const classes = (data as ClassWithRelations[]) ?? [];

  const onClassUpdated = async () => {
    await refetch();
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (queryError instanceof Error) {
    return <div className="text-red-500">오류: {queryError.message}</div>;
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
