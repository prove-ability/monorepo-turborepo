import { Dialog, Button } from "@repo/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateClientModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  formAction: (formData: FormData) => void;
  formState: {
    errors: Record<string, string>;
    message: string;
  };
}
export function CreateClientModal({
  isOpen,
  setIsOpen,
  formAction,
  formState,
}: CreateClientModalProps) {
  return (
    <>
      <Dialog open={true} onOpenChange={() => {}}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>신규 고객사 추가</Dialog.Title>
            <Dialog.Description>
              새로운 고객사의 정보를 입력해주세요.
            </Dialog.Description>
          </Dialog.Header>
          {/* ...나머지 폼... */}
        </Dialog.Content>
      </Dialog>
      {/* <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Button onClick={() => setIsOpen(true)}>신규 고객사 추가</Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>신규 고객사 추가</Dialog.Title>
            <Dialog.Description>
              새로운 고객사의 정보를 입력해주세요.
            </Dialog.Description>
          </Dialog.Header>
          <form
            action={(formData) => {
              formAction(formData);
              if (!formState.errors) {
                setIsOpen(false);
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  고객사명
                </Label>
                <Input id="name" name="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  이메일
                </Label>
                <Input id="email" name="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  연락처
                </Label>
                <Input id="phone" name="phone" className="col-span-3" />
              </div>
            </div>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit">저장</Button>
            </Dialog.Footer>
            {formState?.message && (
              <p className="text-red-500 text-sm mt-2">{formState.message}</p>
            )}
          </form>
        </Dialog.Content>
      </Dialog> */}
    </>
  );
}
