"use client";

import { useMemo } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  Star,
  ArrowRight,
  Gamepad2,
} from "lucide-react";
import Link from "next/link";
import { getDashboardAll } from "@/actions/dashboardActions";
import { useQuery } from "@tanstack/react-query";

// 최소 응답 타입 정의 (컴포넌트에서 사용하는 필드만)
type RecentClass = {
  id: string;
  name: string;
  createdAt: string | Date;
  client: { name: string };
  manager: { name: string };
};
type ClassProgressItem = {
  id: string;
  name: string;
  currentDay: number;
  client: { name: string };
};
type RecentGuest = {
  id: string;
  name: string;
  createdAt: string | Date;
  class?: { name: string } | null;
};
type RecentSurvey = {
  id: string;
  rating: number;
  feedback?: string | null;
  createdAt: string | Date;
  guest?: { name?: string | null } | null;
  class?: { name?: string | null } | null;
};
type DashboardAllSuccess = {
  success: true;
  data: {
    stats: {
      totalClients: number;
      totalClasses: number;
      totalGuests: number;
      totalSurveys: number;
      totalTransactions: number;
      activeGames: number;
      averageRating: number;
      recentClassesCount: number;
    };
    recentClasses: RecentClass[];
    recentGuests: RecentGuest[];
    classProgress: ClassProgressItem[];
    recentSurveys: RecentSurvey[];
  };
};
type DashboardAll = Awaited<ReturnType<typeof getDashboardAll>>;

export function DashboardClient() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard", "all"],
    queryFn: () => getDashboardAll(),
    staleTime: 60_000,
  });

  console.log(data);

  const loading = useMemo(() => isLoading, [isLoading]);
  const payload = data?.success
    ? (data.data as DashboardAllSuccess["data"])
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 mt-2">
          주식 게임 시스템 전체 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 주요 통계 카드 */}
      {payload && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 총 클라이언트 수 */}
          <Link href="/protected/clients">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                총 클라이언트
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {payload.stats.totalClients}
              </p>
            </div>
          </Link>

          {/* 총 클래스 수 */}
          <Link href="/protected/classes">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                총 클래스
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {payload.stats.totalClasses}
              </p>
              <p className="text-xs text-green-700 mt-2">
                최근 7일: +{payload.stats.recentClassesCount}
              </p>
            </div>
          </Link>

          {/* 총 학생 수 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-900 mb-1">
              총 학생 수
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {payload.stats.totalGuests}
            </p>
            <p className="text-xs text-purple-700 mt-2">
              거래 {payload.stats.totalTransactions.toLocaleString()}건
            </p>
          </div>

          {/* 활성 게임 */}
          <Link href="/protected/game-management">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-sm font-medium text-orange-900 mb-1">
                활성 게임
              </h3>
              <p className="text-3xl font-bold text-orange-600">
                {payload.stats.activeGames}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* 서베이 통계 및 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 서베이 통계 */}
        {payload && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                서베이 통계
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">총 응답 수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {payload.stats.totalSurveys}
                  </p>
                </div>
                <MessageSquare className="w-12 h-12 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">평균 평점</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {payload.stats.averageRating}
                    </p>
                    <span className="text-sm text-gray-600">/ 5.0</span>
                  </div>
                </div>
                <Star className="w-12 h-12 text-yellow-500" />
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">만족도</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full"
                      style={{
                        width: `${(payload.stats.averageRating / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {Math.round((payload.stats.averageRating / 5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 클래스 진행 상황 */}
        {payload && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                클래스 진행 상황
              </h2>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {payload.classProgress
                .slice(0, 5)
                .map((classItem: ClassProgressItem) => (
                  <Link
                    key={classItem.id}
                    href={`/protected/classes/${classItem.id}`}
                  >
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {classItem.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {classItem.client.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">진행 Day</p>
                          <p className="text-lg font-bold text-blue-600">
                            {classItem.currentDay}
                          </p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 최근 클래스 및 학생 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 생성된 클래스 */}
        {payload && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  최근 클래스
                </h2>
              </div>
              <Link
                href="/protected/classes"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-3">
              {payload.recentClasses.map((classItem: RecentClass) => (
                <Link
                  key={classItem.id}
                  href={`/protected/classes/${classItem.id}`}
                >
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {classItem.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {classItem.client.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {classItem.manager.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(classItem.createdAt).toLocaleDateString(
                          "ko-KR",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 최근 등록된 학생 */}
        {payload && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                최근 등록 학생
              </h2>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {payload.recentGuests.map((guest: RecentGuest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {guest.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {guest.class?.name || "클래스 없음"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(guest.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 최근 서베이 응답 */}
      {payload && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              최근 서베이 응답
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payload.recentSurveys.map((survey: RecentSurvey) => (
              <div
                key={survey.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {survey.guest?.name || "익명"}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {survey.class?.name}
                    </p>
                  </div>
                  {renderStars(survey.rating)}
                </div>
                {survey.feedback && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {survey.feedback}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(survey.createdAt).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
