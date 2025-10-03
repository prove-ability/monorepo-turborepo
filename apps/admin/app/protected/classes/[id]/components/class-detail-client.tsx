"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@repo/ui";
import { ArrowLeft, Search, Users, Calendar, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUsersByClass } from "@/actions/userActions";
import { StudentBulkUpload } from "./StudentBulkUpload";
import { Class, Client, Manager } from "@/types";

type Student = Awaited<ReturnType<typeof getUsersByClass>>["data"][number];

interface ClassWithRelations extends Class {
  client: Client;
  manager: Manager;
}

interface ClassDetailClientProps {
  classData: ClassWithRelations;
  classId: string;
}

export function ClassDetailClient({
  classData,
  classId,
}: ClassDetailClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 학생 목록 조회 함수 (재사용)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentsData = await getUsersByClass(classId);
      setStudents(studentsData.data);
    } catch (err) {
      console.error("학생 목록 조회 실패:", err);
      setError("학생 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 클라이언트에서 학생 목록 조회
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // 검색 기능
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const term = searchTerm.toLowerCase();
    return students.filter((student) => {
      const name = student.name?.toLowerCase() || "";
      const nickname = student.nickname?.toLowerCase() || "";
      const phone = student.phone || "";
      const schoolName = student.schoolName?.toLowerCase() || "";
      const authId = student.auth_id?.toLowerCase() || "";

      return (
        name.includes(term) ||
        nickname.includes(term) ||
        phone.includes(term) ||
        schoolName.includes(term) ||
        authId.includes(term)
      );
    });
  }, [students, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
        </div>
      </div>

      {/* 클래스 정보 카드 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">클라이언트</p>
              <p className="font-semibold">
                {classData.client.name || "미지정"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">매니저</p>
              <p className="font-semibold">
                {classData.manager.name || "미지정"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 목록 섹션 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              등록된 학생 ({filteredStudents.length}명)
            </h2>
            <StudentBulkUpload
              classId={classId}
              clientId={classData.clientId}
              onCompleted={async () => {
                await fetchStudents();
              }}
            />
          </div>

          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="학생 이름, 닉네임, 전화번호, 학교명, Auth ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 학생 목록 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">
                학생 목록을 불러오는 중...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                다시 시도
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? "검색 결과가 없습니다."
                  : "등록된 학생이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학생 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학교 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auth ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.name ?? "이름 없음"} (
                            {student.nickname || "닉네임 없음"})
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.phone ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {student.schoolName ?? "-"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.grade ?? "?"}학년
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.auth_id ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.createdAt
                          ? formatDate(student.createdAt.toISOString())
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
