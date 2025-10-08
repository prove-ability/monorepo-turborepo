"use client";

import { useEffect, useState, useRef } from "react";
import { getClassRanking, type RankingEntry } from "@/actions/ranking";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Users } from "lucide-react";

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const myRankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRankings();
  }, []);

  // 내 순위로 자동 스크롤
  useEffect(() => {
    if (rankings.length > 0 && myRankRef.current) {
      // 내가 상위 3위 안에 없으면 스크롤
      const myRank = rankings.find((r) => r.isCurrentUser);
      if (myRank && myRank.rank > 3) {
        setTimeout(() => {
          myRankRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      }
    }
  }, [rankings]);

  const loadRankings = async () => {
    setIsLoading(true);
    try {
      const data = await getClassRanking();
      setRankings(data);
    } catch (error) {
      console.error("Failed to load rankings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh 기능
  const { isRefreshing } = usePullToRefresh(async () => {
    await loadRankings();
  });

  if (isLoading) {
    return <PageLoading />;
  }

  const top10 = rankings.slice(0, 10);
  const myRanking = rankings.find((r) => r.isCurrentUser);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh 인디케이터 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-emerald-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader
          title="랭킹"
          description="오늘의 투자순위, 투자왕은 누구일까요?"
        />

        {/* TOP 10 안내 */}
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <p className="text-xs text-emerald-900">
              <strong className="font-bold">상위 10명</strong>의 랭킹이 공개돼요
            </p>
          </div>
        </div>

        {/* 내 순위 표시 (상위 10위 밖일 경우) */}
        {myRanking && myRanking.rank > 10 && (
          <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-base font-semibold text-emerald-900">
                  내 순위: {myRanking.rank}위
                </div>
                <div className="text-sm text-gray-700">
                  {myRanking.nickname || "닉네임 없음"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">보유 금액</div>
                <div className="text-base font-semibold text-gray-900">
                  {myRanking.totalAssets.toLocaleString()}원
                </div>
                <div className="text-xs text-gray-500">
                  {myRanking.profitRate >= 0 ? "+" : ""}
                  {myRanking.profitRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Rankings */}
        <div id="ranking-list" className="space-y-3">
          {top10.length === 0 ? (
            <EmptyState
              icon={<Users className="h-16 w-16" />}
              title="아직 참가자가 없어요"
              description="게임에 참가한 학생들의 랭킹이 여기에 표시됩니다. 첫 거래를 시작해보세요!"
            />
          ) : (
            top10.map((entry) => {
              const isMe = entry.isCurrentUser;

              return (
                <div
                  key={entry.guestId}
                  ref={isMe ? myRankRef : null}
                  className={`rounded-2xl transition-all p-4 ${
                    isMe
                      ? "bg-emerald-50 border-2 border-emerald-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* 왼쪽: 순위와 닉네임 */}
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-semibold text-gray-700">
                        {entry.rank === 1 && (
                          <span className="mr-2">🥇</span>
                        )}
                        {entry.rank === 2 && (
                          <span className="mr-2">🥈</span>
                        )}
                        {entry.rank === 3 && (
                          <span className="mr-2">🥉</span>
                        )}
                        {entry.rank}
                      </div>
                      <div>
                        <div
                          className={`font-medium text-base ${
                            isMe ? "text-emerald-900" : "text-gray-800"
                          }`}
                        >
                          {entry.nickname || "닉네임 없음"}
                          {isMe && (
                            <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-1 rounded-md">
                              나
                            </span>
                          )}
                        </div>
                        {entry.rank === 1 && (
                          <div className="text-xs text-emerald-600 mt-0.5 font-medium">
                            TOP 3 달성! 축하해요!
                          </div>
                        )}
                        {entry.rank === 2 && (
                          <div className="text-xs text-emerald-600 mt-0.5 font-medium">
                            TOP 3 달성! 축하해요!
                          </div>
                        )}
                        {entry.rank === 3 && (
                          <div className="text-xs text-emerald-600 mt-0.5 font-medium">
                            TOP 3 달성! 축하해요!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 오른쪽: 보유 금액 */}
                    <div className="text-right">
                      <div className="text-base font-semibold text-gray-900">
                        {entry.totalAssets.toLocaleString()}원
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {entry.profitRate >= 0 ? "+" : ""}
                        {entry.profitRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
