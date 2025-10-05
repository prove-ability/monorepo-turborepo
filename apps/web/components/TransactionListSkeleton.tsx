export default function TransactionListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-4 shadow border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Day 정보 스켈레톤 */}
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-100 rounded w-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              {/* 주식명 스켈레톤 */}
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              {/* 수량/가격 스켈레톤 */}
              <div className="h-4 bg-gray-100 rounded w-40"></div>
            </div>
            <div className="text-right">
              {/* 금액 스켈레톤 */}
              <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
              {/* 시간 스켈레톤 */}
              <div className="h-3 bg-gray-100 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
