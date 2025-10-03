import { notFound } from "next/navigation";
import { getClassById } from "@/actions/classActions";
import { ClassDetailClient } from "./components/class-detail-client";
import UserManagement from "./components/UserManagement";

interface ClassDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ClassDetailPage({
  params,
}: ClassDetailPageProps) {
  const classInfo = await getClassById(params.id);

  // Type guard: check if the result has 'data' property
  if (!classInfo || !("data" in classInfo) || !classInfo.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClassDetailClient classData={classInfo.data} classId={params.id} />
      <UserManagement classId={params.id} />
    </div>
  );
}
