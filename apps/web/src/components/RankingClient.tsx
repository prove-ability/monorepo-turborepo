"use client";

import { useState, useEffect } from 'react';
import { getRankingByClass } from '@/actions/userActions';
import { Trophy } from 'lucide-react';
import { Ranking } from '@/types/ranking';

interface RankingClientProps {
  classId: string;
}

const RankingSkeleton = () => (
  <div className="w-full min-h-screen p-4 animate-pulse">
    <div className="bg-gray-200 rounded-lg h-24 mb-6" />
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center justify-between bg-white p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default function RankingClient({ classId }: RankingClientProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const data = await getRankingByClass(classId);
        setRankings(data);
      } catch (error) {
        console.error('랭킹 정보 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [classId]);

  if (isLoading) {
    return <RankingSkeleton />;
  }

  return (
    <div className="w-full min-h-screen">
      <main className="space-y-5 pb-24">
        <div className="bg-blue-900 text-white p-4 rounded-xl flex items-center gap-3">
          <Trophy className="h-6 w-6 flex-shrink-0 text-yellow-400" />
          <div>
            <h2 className="font-bold text-lg">투자 랭킹</h2>
            <p className="text-base text-blue-200 mt-1">
              지금 TOP 10 순위를 확인하세요!
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {rankings.map((ranking: Ranking, index: number) => (
            <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg w-6 text-center">{ranking.rank}</span>
                <span className="font-semibold text-gray-800">
                  {ranking.nickname ? (
                    ranking.nickname
                  ) : (
                    <span className="text-gray-500 italic">닉네임 없음</span>
                  )}
                </span>
              </div>
              <span className="font-bold text-gray-900">
                {ranking.totalAsset.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
