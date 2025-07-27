import { Button } from "@repo/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog } from "radix-ui";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { createClientAction } from "@/actions/clientActions";

export type CreateClientInputs = {
  name: string;
  email: string;
  phone: string;
};

interface CreateClientModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function CreateClientModal({
  isOpen,
  setIsOpen,
}: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClientInputs>();

  const onSubmit: SubmitHandler<CreateClientInputs> = async (data) => {
    setIsLoading(true);
    setError(null);

    // FormData 객체로 변환하여 서버 액션에 전달
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);

    try {
      const result = await createClientAction(null, formData);

      if (result.errors) {
        setError(result.message || "고객사 생성 중 오류가 발생했습니다.");
      } else {
        // 성공 시 모달 닫기 및 폼 초기화
        setIsOpen(false);
        reset();
        setError(null);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      setError("고객사 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 닫힐 때 상태 초기화
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setError(null);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button onClick={() => setIsOpen(true)}>신규 고객사 추가</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-blackA6 data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray1 p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow text-foreground bg-gray-600 z-20">
          <Dialog.Title className="m-0 text-[17px] font-medium text-mauve12">
            신규 고객사 추가
          </Dialog.Title>
          <Dialog.Description className="mb-5 mt-2.5 text-[15px] leading-normal text-mauve11">
            새로운 고객사의 정보를 입력해주세요.
          </Dialog.Description>

          {/* 에러 메시지 표시 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
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
                <Label htmlFor="phone" className="text-right">
                  연락처
                </Label>
                <Input
                  {...register("phone")}
                  id="phone"
                  name="phone"
                  className="col-span-3"
                />
              </fieldset>
            </div>
            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>
                  닫기
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
