"use client";

import { useState, useMemo } from "react";
import { Button } from "@repo/ui";
import { ArrowLeft, Search, Users, Calendar, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassData {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  manager_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
  managers: { id: string; name: string } | null;
}

interface Student {
  id: string;
  name: string;
  phone: string;
  grade: number;
  school_name: string;
  login_id: string;
  pw: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string } | null;
  classes: {
    id: string;
    name: string;
    start_date: string;
    end_date?: string;
  } | null;
}

interface ClassDetailClientProps {
  classData: ClassData;
  initialStudents: Student[];
}

export function ClassDetailClient({ classData, initialStudents }: ClassDetailClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // 검색 기능
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return initialStudents;

    const term = searchTerm.toLowerCase();
    return initialStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.phone.includes(term) ||
        student.school_name.toLowerCase().includes(term) ||
        student.login_id.toLowerCase().includes(term)
    );
  }, [initialStudents, searchTerm]);

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
                {classData.clients?.name || "미지정"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">매니저</p>
              <p className="font-semibold">
                {classData.managers?.name || "미지정"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">수업 기간</p>
              <p className="font-semibold">
                {formatDate(classData.start_date)} ~{" "}
                {classData.end_date ? formatDate(classData.end_date) : "진행중"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 목록 섹션 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              등록된 학생 ({filteredStudents.length}명)
            </h2>
          </div>

          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="학생 이름, 전화번호, 학교명, 로그인ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 학생 목록 */}
        <div className="p-6">
          {filteredStudents.length === 0 ? (
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
                      로그인 정보
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
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {student.school_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.grade}학년
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {student.login_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            비밀번호: {student.pw}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.created_at)}
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
