import { getClassById } from "@/actions/classActions";
import { ClassDetailPageClient } from "./components/ClassDetailPageClient";

interface ClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params;
  // 서버 액션을 얇은 래퍼로 전달하고, 데이터 패칭/로딩은 클라이언트에서 수행
  return <ClassDetailPageClient classId={id} getClassByIdAction={getClassById} />;
}
