import { type Manager } from "@/types/manager";
import { Button } from "@repo/ui";
import { deleteManager } from "@/actions/managerActions";
import { useState } from "react";

interface ManagerListItemProps {
  manager: Manager;
  handleManagerDeleted: (managerId: string) => void;
}

export function ManagerListItem({
  manager,
  handleManagerDeleted,
}: ManagerListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`${manager.name} 매니저를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteManager(manager.id);
      if (!result.success) {
        alert("삭제 실패: " + result.message);
      } else {
        alert(result.message);
        handleManagerDeleted(manager.id);
      }
    } catch (error) {
      console.error("매니저 삭제 중 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <li className="flex justify-between items-center text-sm">
      <span>
        {manager.name} ({manager.mobile_phone})
        <br />
        {manager.email}
      </span>
      <div className="flex gap-2">
        {/* <Button className="text-xs text-blue-500" onClick={handleEdit}>
          수정
        </Button> */}
        <Button
          className="text-xs text-red-500"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "삭제 중..." : "삭제"}
        </Button>
      </div>
    </li>
  );
}
