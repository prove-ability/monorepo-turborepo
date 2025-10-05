export default function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 bg-gray-200 rounded-lg" />
      
      {/* Progress Card Skeleton */}
      <div className="bg-gray-200 rounded-lg h-32" />
      
      {/* Assets Card Skeleton */}
      <div className="bg-gray-200 rounded-lg h-40" />
      
      {/* Ranking Card Skeleton */}
      <div className="bg-gray-200 rounded-lg h-24" />
      
      {/* Holdings Skeleton */}
      <div className="bg-gray-200 rounded-lg h-48" />
    </div>
  );
}
