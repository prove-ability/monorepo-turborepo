"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, Wallet, Activity } from "lucide-react";
import { getStudentGameHistory } from "@/actions/userActions";

interface StudentHistoryModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

type GameHistoryData = Awaited<ReturnType<typeof getStudentGameHistory>>;

export function StudentHistoryModal({
  studentId,
  studentName,
  onClose,
}: StudentHistoryModalProps) {
  const [data, setData] = useState<GameHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const result = await getStudentGameHistory(studentId);
        setData(result);
        if (!result.success) {
          setError(result.error || "데이터를 불러오는데 실패했습니다");
        }
      } catch (err) {
        console.error("Failed to fetch student history:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const formatNumber = (value: string | number) => {
    return Number(value).toLocaleString();
  };

  const getTransactionTypeLabel = (
    type: string,
    subType: string
  ): { label: string; color: string } => {
    if (subType === "benefit") {
      return { label: "지원금", color: "text-green-600 bg-green-50" };
    }
    if (type === "deposit" && subType === "sell") {
      return { label: "매도", color: "text-blue-600 bg-blue-50" };
    }
    if (type === "withdrawal" && subType === "buy") {
      return { label: "매수", color: "text-red-600 bg-red-50" };
    }
    return { label: "기타", color: "text-gray-600 bg-gray-50" };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{studentName}</h2>
            <p className="text-sm text-gray-500 mt-1">게임 참여 이력</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-red-500 mb-4">
                <X className="w-16 h-16" />
              </div>
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          ) : data?.success && data.data ? (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 현재 Day */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-blue-900">
                      진행 상황
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    Day {data.data.currentDay}
                  </p>
                </div>

                {/* 현재 잔액 */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-900">
                      현재 잔액
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(data.data.guest.wallet?.balance || "0")}
                    <span className="text-lg ml-1">원</span>
                  </p>
                </div>

                {/* 보유 주식 수 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-medium text-purple-900">
                      보유 주식
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {data.data.holdings.length}
                    <span className="text-lg ml-1">종목</span>
                  </p>
                </div>
              </div>

              {/* 보유 주식 목록 */}
              {data.data.holdings.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      보유 주식 현황
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      {data.data.holdings.map((holding) => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {holding.stock?.name || "알 수 없음"}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              평균 매수가:{" "}
                              {formatNumber(holding.averagePurchasePrice)}원
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {formatNumber(holding.quantity)}주
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatNumber(
                                Number(holding.averagePurchasePrice) *
                                  holding.quantity
                              )}
                              원
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 거래 내역 */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    거래 내역 ({data.data.transactions.length}건)
                  </h3>
                </div>
                <div className="p-6">
                  {data.data.transactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      거래 내역이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.data.transactions.map((transaction) => {
                        const typeInfo = getTransactionTypeLabel(
                          transaction.type,
                          transaction.subType
                        );
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                              >
                                {typeInfo.label}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {transaction.stock?.name || "지갑"}
                                  </h4>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    Day {transaction.day}
                                  </span>
                                </div>
                                {transaction.quantity > 0 && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {formatNumber(transaction.quantity)}주 ×{" "}
                                    {formatNumber(transaction.price)}원
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  transaction.type === "deposit"
                                    ? "text-blue-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "deposit" ? "+" : "-"}
                                {formatNumber(
                                  transaction.quantity > 0
                                    ? Number(transaction.price) *
                                        transaction.quantity
                                    : transaction.price
                                )}
                                원
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  transaction.createdAt
                                ).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">데이터가 없습니다</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
