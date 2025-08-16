import { notFound } from "next/navigation";
import { getClassById } from "@/actions/classActions";
import { ClassDetailClient } from "./components/class-detail-client";

interface ClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassDetailPage({
  params,
}: ClassDetailPageProps) {
  try {
    // Next.js 15에서 params를 await해야 함
    const { id } = await params;

    // 클래스 기본 정보만 서버에서 조회
    const classData = await getClassById(id);

    return (
      <div className="container mx-auto px-4 py-8">
        <ClassDetailClient classData={classData.data} classId={id} />
      </div>
    );
  } catch (error) {
    console.error("클래스 상세 페이지 로드 오류:", error);
    notFound();
  }
}
