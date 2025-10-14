"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@repo/ui";
import {
  ArrowLeft,
  Search,
  Users,
  Building2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getUsersByClass, deleteGuests } from "@/actions/userActions";
import { StudentBulkUpload } from "./StudentBulkUpload";
import { StudentHistoryModal } from "./StudentHistoryModal";
import { ClassSurveyView } from "./ClassSurveyView";
import { Class, Client, Manager } from "@/types";
import { useQuery } from "@tanstack/react-query";

type Student = Awaited<ReturnType<typeof getUsersByClass>>["data"][number];
// UI에서 사용하는 최소 필드만 갖는 경량 타입 (서버 응답을 여기에 매핑)
interface StudentsLite {
  id: string;
  name: string;
  mobilePhone: string;
  affiliation: string;
  grade: string;
  classId: string;
  createdAt?: Date;
  nickname?: string;
  loginId?: string;
  password?: string;
}

interface ClassWithRelations extends Class {
  client: Client;
  manager: Manager;
}

interface ClassDetailClientProps {
  classData: ClassWithRelations;
  classId: string;
}

type TabType = "students" | "surveys";

export function ClassDetailClient({
  classData,
  classId,
}: ClassDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<StudentsLite[]>({
    queryKey: ["classes", "detail", classId, "students"],
    queryFn: async () => {
      const res = await getUsersByClass(classId);
      if (!res || !("data" in res)) {
        throw new Error("학생 목록을 불러오는 중 오류가 발생했습니다.");
      }
      const rows = res.data as Student[];
      // 서버 응답을 UI 경량 타입으로 매핑
      return rows.map((s) => ({
        id: s.id,
        name: s.name,
        mobilePhone: s.mobilePhone,
        affiliation: s.affiliation,
        grade: s.grade,
        classId: s.classId,
        createdAt: (s as any).createdAt
          ? new Date((s as any).createdAt)
          : undefined,
        nickname: (s as any).nickname,
        loginId: (s as any).loginId ?? (s as any).login_id,
        password: (s as any).password ?? (s as any).pw,
      }));
    },
  });

  const students = (data as StudentsLite[]) ?? [];

  useEffect(() => {
    if (Array.isArray(data)) {
      setError(null);
    }
  }, [data]);

  useEffect(() => {
    if (queryError instanceof Error) {
      setError(queryError.message);
    }
  }, [queryError]);

  const fetchStudents = async () => {
    await refetch();
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const term = searchTerm.toLowerCase();
    return students.filter((student) => {
      const name = student.name?.toLowerCase() || "";
      const nickname = student.nickname?.toLowerCase() || "";
      const mobilePhone = student.mobilePhone || "";
      const affiliation = student.affiliation?.toLowerCase() || "";

      return (
        name.includes(term) ||
        nickname.includes(term) ||
        mobilePhone.includes(term) ||
        affiliation.includes(term)
      );
    });
  }, [students, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 학생을 선택해주세요");
      return;
    }

    const confirmMessage = `선택한 ${selectedIds.size}명의 학생을 삭제하시겠습니까?\n\n⚠️ 다음 데이터가 함께 삭제됩니다:\n- 거래 내역\n- 보유 주식\n- 지갑 정보\n\n⚠️ 설문 응답은 보존됩니다.\n\n이 작업은 되돌릴 수 없습니다.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteGuests(Array.from(selectedIds), classId);

      if (result.success) {
        alert(result.message);
        // 즉시 반영: 캐시에서 선택된 학생 제거
        queryClient.setQueryData<StudentsLite[]>(
          ["classes", "detail", classId, "students"],
          (prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            const removeSet = new Set(selectedIds);
            return arr.filter((s) => !removeSet.has(s.id));
          }
        );
        setSelectedIds(new Set());
        // 서버 최신화 유지
        await fetchStudents();
      } else if (result.error) {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("학생 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
    }
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

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                activeTab === "students"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-5 h-5" />
              학생 관리 ({filteredStudents.length})
            </button>
            <button
              onClick={() => setActiveTab("surveys")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                activeTab === "surveys"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              서베이 결과
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === "students" ? (
          <div>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-gray-900">
                  학생 관리 ({filteredStudents.length}명)
                </h2>
                <div className="flex gap-2">
                  {selectedIds.size > 0 && (
                    <Button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      variant="destructive"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {isDeleting
                          ? "삭제 중..."
                          : `선택한 ${selectedIds.size}명 삭제`}
                      </span>
                    </Button>
                  )}
                  <StudentBulkUpload
                    classId={classId}
                    clientId={classData.clientId}
                    onCompleted={async () => {
                      await fetchStudents();
                    }}
                    onCompletedWithStudents={({ createdGuests }) => {
                      // 즉시 반영: 업로드로 생성된 학생들을 캐시에 추가 (중복 방지)
                      queryClient.setQueryData<StudentsLite[]>(
                        ["classes", "detail", classId, "students"],
                        (prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          const existingIds = new Set(arr.map((s) => s.id));
                          const toAppend = createdGuests.filter(
                            (g) => !existingIds.has(g.id)
                          );
                          // createdGuests는 StudentsLite와 동일 필드 집합
                          return [...arr, ...toAppend];
                        }
                      );
                    }}
                  />
                </div>
              </div>

              {/* 검색 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="학생 이름, 닉네임, 전화번호, 소속으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 학생 목록 */}
            <div className="p-6">
              {isLoading ? (
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
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              filteredStudents.length > 0 &&
                              selectedIds.size === filteredStudents.length
                            }
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          학생 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          로그인 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          연락처
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소속/학년
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          등록일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedIds.has(student.id) ? "bg-blue-50" : ""
                          }`}
                          onClick={(e) => {
                            // 체크박스 클릭은 무시
                            const target = e.target as HTMLInputElement;
                            if (target.type !== "checkbox") {
                              setSelectedStudent({
                                id: student.id,
                                name: student.name ?? "이름 없음",
                              });
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name ?? "이름 없음"} (
                              {student.nickname || "닉네임 없음"})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                ID: {student.loginId ?? "-"}
                              </div>
                              <div className="text-sm text-gray-500">
                                PW: {student.password ?? "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.mobilePhone ?? "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {student.affiliation ?? "-"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.grade ?? "?"}학년
                              </div>
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
        ) : (
          <ClassSurveyView classId={classId} />
        )}
      </div>

      {/* 학생 이력 모달 */}
      {selectedStudent && (
        <StudentHistoryModal
          isOpen={!!selectedStudent}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
