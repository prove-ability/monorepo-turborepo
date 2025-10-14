"use client";

import { useEffect, useState } from "react";
import { ClassDetailClient } from "./class-detail-client";
import { Button } from "@repo/ui";

type GetClassByIdAction = (id: string) => Promise<any>;

interface ClassDetailPageClientProps {
  classId: string;
  getClassByIdAction: GetClassByIdAction;
}

export function ClassDetailPageClient({
  classId,
  getClassByIdAction,
}: ClassDetailPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      setClassData(null);
      try {
        const res = await getClassByIdAction(classId);
        if (!res || !("data" in res) || !res.data) {
          if (!cancelled) setError("클래스 정보를 불러올 수 없습니다.");
          return;
        }
        if (!cancelled) setClassData(res.data);
      } catch (e) {
        if (!cancelled) setError("클래스 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
    // 의존성은 classId만: 서버 액션 참조의 정체성 변화를 피함
  }, [classId]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* 카드 스켈레톤 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-5 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        {/* 본문 로딩 */}
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">데이터를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600 text-white">
          다시 시도
        </Button>
      </div>
    );
  }

  return <ClassDetailClient classData={classData} classId={classId} />;
}
