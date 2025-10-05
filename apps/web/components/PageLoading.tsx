export default function PageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    </div>
  );
}
