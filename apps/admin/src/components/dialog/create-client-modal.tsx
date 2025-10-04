"use client";

import { Button } from "@repo/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { createClientAction } from "@/actions/clientActions";
import { Modal } from "@/components/common/modal";
import { Client, Manager } from "@/types";

export type CreateClientInputs = Pick<Client, "name" | "email" | "mobilePhone">;

interface CreateClientModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClientCreated?: (client: Client & { managers: Manager[] }) => void;
}

export function CreateClientModal({
  isOpen,
  setIsOpen,
  onClientCreated,
}: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<CreateClientInputs>();

  const onSubmit: SubmitHandler<CreateClientInputs> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // FormData 객체로 변환하여 서버 액션에 전달
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("mobilePhone", data.mobilePhone);

    try {
      const result = await createClientAction(null, formData);

      if (result.success) {
        // 성공 메시지 표시
        setSuccessMessage(
          result.message || "고객사가 성공적으로 추가되었습니다."
        );

        // 폼 초기화
        reset();

        // 새로 생성된 클라이언트 데이터를 부모 컴포넌트에 전달
        if (onClientCreated && "data" in result && result.data) {
          onClientCreated({ ...result.data, managers: [] });
        }

        // 1초 후 모달 닫기
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
        }, 1000);
      } else {
        // 에러 처리
        setError(result.message || "고객사 생성 중 오류가 발생했습니다.");

        // 필드별 에러가 있는 경우 콘솔에 출력
        if (result.errors) {
          console.error("Field errors:", result.errors);
        }
      }
    } catch (error) {
      console.error("Error creating client:", error);
      setError("고객사 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 닫힐 때 상태 초기화
  const handleClose = () => {
    setIsOpen(false);
    reset();
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="신규 고객사 추가"
      size="md"
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          새로운 고객사의 정보를 입력해주세요.
        </p>
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 성공 메시지 표시 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-4">
          <fieldset className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              고객사명
            </Label>
            <Input
              {...register("name")}
              id="name"
              name="name"
              className="col-span-3"
            />
          </fieldset>
          <fieldset className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              이메일
            </Label>
            <Input
              {...register("email")}
              id="email"
              name="email"
              className="col-span-3"
            />
          </fieldset>
          <fieldset className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mobilePhone" className="text-right">
              연락처
            </Label>
            <Input
              {...register("mobilePhone")}
              id="mobilePhone"
              name="mobilePhone"
              className="col-span-3"
            />
          </fieldset>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={handleClose}
          >
            닫기
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
