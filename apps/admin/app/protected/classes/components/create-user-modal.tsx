"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { createUserWithStack } from "@/actions/userActions";
import { Modal } from "@/components/common/modal";

interface CreateUserModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  classId: string;
  clientId: string;
  onUserCreated: () => void;
}

export function CreateUserModal({
  isOpen,
  setIsOpen,
  classId,
  clientId,
  onUserCreated,
}: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    
    // client_id와 class_id를 FormData에 추가
    formData.set("client_id", clientId);
    formData.set("class_id", classId);

    try {
      const result = await createUserWithStack(formData);

      // withAuth의 ActionState 타입 처리
      if ("success" in result && !result.success) {
        alert(`등록 실패: ${result.message}`);
        return;
      }

      // 액션의 실제 반환 타입 처리
      if ("error" in result && result.error) {
        if ("_form" in result.error) {
          alert("등록 실패: " + result.error._form?.[0]);
        } else {
          setErrors(result.error as Record<string, string[]>);
        }
      } else if ("message" in result && result.message) {
        // 생성된 계정 정보를 표시
        alert(result.message);
        setIsOpen(false);
        onUserCreated();
        // 폼 초기화
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error("학생 등록 중 오류:", error);
      alert("학생 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="새 학생 등록"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              전화번호 *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="010-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              학년 *
            </label>
            <select
              id="grade"
              name="grade"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">학년을 선택하세요</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <option key={grade} value={grade}>
                  {grade}학년
                </option>
              ))}
            </select>
            {errors.grade && (
              <p className="text-red-500 text-xs mt-1">{errors.grade[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="school_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              학교명 *
            </label>
            <input
              type="text"
              id="school_name"
              name="school_name"
              required
              placeholder="예: 서울고등학교"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.school_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.school_name[0]}
              </p>
            )}
          </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
