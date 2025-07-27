import { Button } from "@repo/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog } from "radix-ui";
import { useForm, SubmitHandler } from "react-hook-form";

export type CreateClientInputs = {
  name: string;
  email: string;
  phone: string;
};

interface CreateClientModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handleCreateClient: (data: CreateClientInputs) => void;
}
export function CreateClientModal({
  isOpen,
  setIsOpen,
  handleCreateClient,
}: CreateClientModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientInputs>();

  const onSubmit: SubmitHandler<CreateClientInputs> = (data) =>
    handleCreateClient(data);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
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
                <Button type="button" variant="secondary">
                  닫기
                </Button>
              </Dialog.Close>
              <Button type="submit">저장</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
