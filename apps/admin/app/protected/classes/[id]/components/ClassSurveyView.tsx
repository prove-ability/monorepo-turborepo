"use client";

import { useState, useEffect } from "react";
import { getSurveysByClass } from "@/actions/surveyActions";
import {
  Star,
  MessageSquare,
  BarChart3,
  User,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface ClassSurveyViewProps {
  classId: string;
}

type SurveyData = Awaited<ReturnType<typeof getSurveysByClass>>;

export function ClassSurveyView({ classId }: ClassSurveyViewProps) {
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const result = await getSurveysByClass(classId);
        setData(result);
        if (!result.success) {
          setError(result.error || "데이터를 불러오는데 실패했습니다");
        }
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
        setError("서베이 데이터를 불러오는 중 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [classId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">서베이 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500">서베이 데이터가 없습니다</p>
      </div>
    );
  }

  const { surveys, statistics } = data.data;

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          아직 제출된 서베이가 없습니다
        </h3>
        <p className="text-gray-500">
          학생들이 서베이를 제출하면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 총 응답 수 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">총 응답 수</h3>
          </div>
          <p className="text-4xl font-bold text-blue-600">
            {statistics.total}
            <span className="text-lg ml-2">건</span>
          </p>
        </div>

        {/* 평균 평점 */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-6 h-6 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-900">평균 평점</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-yellow-600">
              {statistics.averageRating}
            </p>
            <span className="text-lg text-yellow-700">/ 5.0</span>
          </div>
        </div>

        {/* 만족도 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">만족도</h3>
          </div>
          <p className="text-4xl font-bold text-green-600">
            {Math.round((statistics.averageRating / 5) * 100)}
            <span className="text-lg ml-1">%</span>
          </p>
        </div>
      </div>

      {/* 평점 분포 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">평점 분포</h3>
        </div>
        <div className="space-y-3">
          {statistics.ratingDistribution.reverse().map((item) => {
            const percentage =
              statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
            return (
              <div key={item.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm font-medium text-gray-700">
                    {item.rating}점
                  </span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {item.count > 0 && (
                      <span className="text-xs font-medium text-white">
                        {item.count}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 w-16 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 서베이 목록 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            학생 피드백 ({surveys.length}건)
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {survey.guest?.name || "익명"}
                      </h4>
                      {survey.guest?.nickname && (
                        <p className="text-sm text-gray-500">
                          {survey.guest.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(survey.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="mb-3">{renderStars(survey.rating)}</div>

                {survey.feedback && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {survey.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
