"use client";

import { useEffect, useState, useRef } from "react";
import { getClassRanking, type RankingEntry } from "@/actions/ranking";
import PageLoading from "@/components/PageLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Trophy, Users } from "lucide-react";

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
    return <PageLoading title="랭킹" />;
  }

  const top10 = rankings.slice(0, 10);
  const myRanking = rankings.find((r) => r.isCurrentUser);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Pull-to-refresh 인디케이터 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <PageHeader
          title="랭킹"
          description="TOP 10 수익률 순위"
          icon={<Trophy className="h-7 w-7 text-blue-600" />}
        />

      {/* 내 순위 표시 (상위 10위 밖일 경우) */}
      {myRanking && myRanking.rank > 10 && (
        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-yellow-700">
                내 순위: {myRanking.rank}위
              </div>
              <div className="text-sm text-gray-700">
                {myRanking.nickname || "닉네임 없음"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">보유 금액</div>
              <div className="text-lg font-bold text-gray-900">
                {myRanking.totalAssets.toLocaleString()}원
              </div>
              <div className="text-xs text-gray-500">
                수익률: {myRanking.profitRate >= 0 ? "+" : ""}
                {myRanking.profitRate.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Rankings */}
      <div className="space-y-3">
        {top10.length === 0 ? (
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="아직 참가자가 없어요"
            description="게임에 참가한 학생들의 랭킹이 여기에 표시됩니다. 첫 거래를 시작해보세요!"
          />
        ) : (
          top10.map((entry) => {
            const isMe = entry.isCurrentUser;
            const isTop3 = entry.rank <= 3;

            return (
              <div
                key={entry.guestId}
                ref={isMe ? myRankRef : null}
                className={`rounded-lg transition-all ${
                  isTop3 && entry.rank === 1
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg"
                    : isTop3
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-md"
                      : isMe
                        ? "bg-yellow-50 border-2 border-yellow-400 p-4"
                        : "bg-white border border-gray-200 p-4"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 순위와 닉네임 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl font-bold ${
                        isTop3 ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {entry.rank === 1 && isTop3 && (
                        <span className="mr-2">🏆</span>
                      )}
                      {entry.rank}
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${
                          isTop3
                            ? "text-white text-lg"
                            : isMe
                              ? "text-yellow-800"
                              : "text-gray-800"
                        }`}
                      >
                        {entry.nickname || "닉네임 없음"}
                        {isMe && (
                          <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded">
                            나
                          </span>
                        )}
                      </div>
                      {isTop3 && (
                        <div className="text-xs text-white/80 mt-1">
                          지금 TOP 10 수위를 달리고있습니다!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 보유 금액 */}
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        isTop3 ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {entry.totalAssets.toLocaleString()}원
                    </div>
                    <div
                      className={`text-sm ${
                        isTop3 ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      수익률: {entry.profitRate >= 0 ? "+" : ""}
                      {entry.profitRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 설명 문구 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p>
          - 랭킹 화면은 참가자들의 성과를 닉네임 기준으로 보여주며,{" "}
          <strong>상위 10명만</strong> 공개됩니다.
        </p>
      </div>
      </div>
    </div>
  );
}
