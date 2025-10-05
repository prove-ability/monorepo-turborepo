export default function StockListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* 국가 플래그 스켈레톤 */}
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                {/* 주식명 스켈레톤 */}
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
              {/* 보유 정보 스켈레톤 */}
              <div className="h-4 bg-gray-100 rounded w-20 mt-1"></div>
            </div>
            <div className="text-right">
              {/* 가격 스켈레톤 */}
              <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
              {/* 변동률 스켈레톤 */}
              <div className="h-4 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
          {/* 뉴스 배지 스켈레톤 */}
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-gray-100 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
