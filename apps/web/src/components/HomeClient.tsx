"use client";

import { logoutStudent } from "@/actions/userActions";

interface User {
  user_id: string;
  login_id: string;
  class_id: string;
  nickname: string | null;
}

interface HomeData {
  currentDay: number;
  totalAssets: number;
  availableToOrder: number;
}

interface HomeClientProps {
  user: User;
  homeData: HomeData;
}

export default function HomeClient({ user, homeData }: HomeClientProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <div className="p-4 space-y-4 pb-20"> {/* 하단 네비게이션 높이만큼 패딩 추가 */}
        {/* 상단 알림 */}
        <div className="bg-blue-900 text-white p-3 rounded-lg text-sm">
          <p>
            <span className="font-bold">{user.nickname}</span>님, 오늘은 day {homeData.currentDay}입니다.
          </p>
          <p>오늘 투자 결과는 내일 9시에 확인할 수 있어요.</p>
        </div>

        {/* 계좌 요약 */}
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 보유자산</span>
            <span className="font-bold text-lg">{homeData.totalAssets.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">주문 가능 금액</span>
            <span className="font-bold text-lg text-blue-600">
              {homeData.availableToOrder.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 보유 주식 */}
        <div>
          <h2 className="text-lg font-bold mb-2">보유 주식</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-500">보유 주식이 없습니다.</p>
            {/* TODO: 보유 주식 목록 표시 */}
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t">
        <div className="flex justify-around p-2">
          {/* TODO: 아이콘 및 링크 추가 */}
          <button className="text-gray-500">홈</button>
          <button className="text-gray-500">랭킹</button>
          <button className="text-gray-500">뉴스</button>
          <button className="text-gray-500">계좌</button>
          <button onClick={() => logoutStudent()} className="text-gray-500">로그아웃</button>
        </div>
      </div>
    </div>
  );
}
