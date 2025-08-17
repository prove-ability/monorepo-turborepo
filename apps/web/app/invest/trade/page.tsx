"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useCallback } from "react";
import { createWebClientByClientSide } from "@/lib/supabase/client";
import { executeTrade } from "@/actions/investActions";
import { ChevronLeft } from "lucide-react";

function TradePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const stockId = searchParams.get("stockId");
  const stockName = searchParams.get("stockName");
  const price = searchParams.get("price");
  const action = searchParams.get("action"); // 'buy' or 'sell'

  const handleNumberClick = (num: string) => {
    if (quantity === "0" && num !== "00") {
      setQuantity(num);
    } else if (quantity !== "0" && quantity.length < 5) {
      setQuantity(quantity + num);
    }
  };

  const handleBackspace = () => {
    if (quantity.length > 1) {
      setQuantity(quantity.slice(0, -1));
    } else {
      setQuantity("0");
    }
  };

  const handleConfirm = async () => {
    if (isLoading || !stockId || !price || !action || (action !== 'buy' && action !== 'sell')) {
      alert("잘못된 접근입니다.");
      return;
    }

    if (Number(quantity) <= 0) {
      alert("수량을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    const supabase = createWebClientByClientSide();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("class_id")
        .eq("user_id", user.id)
        .single();

      if (userError || !userData?.class_id) {
        throw new Error("클래스 정보를 찾을 수 없습니다.");
      }

      const tradeResult = await executeTrade({
        stockId,
        quantity: Number(quantity),
        price: Number(price),
        action,
        classId: userData.class_id,
      });

      alert(tradeResult.message);

      if (tradeResult.success) {
        router.push("/invest");
      }
    } catch (error) { 
      console.error("Trade failed:", error);
      alert(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const numpadKeys = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "00", "0", "←",
  ];

  return (
    <div className="w-full bg-gray-100 flex flex-col h-screen">
      <header className="flex items-center p-4 bg-white shadow-sm">
        <button onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="text-center flex-grow">
          <h1 className="font-bold text-lg">{stockName}</h1>
          <p className="text-sm text-gray-500">{Number(price).toLocaleString()}원</p>
        </div>
        <div className="w-6"></div> {/* For alignment */}
      </header>

      <main className="flex-grow flex flex-col justify-between p-4">
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">몇 주 {action === 'buy' ? '매수' : '매도'}할까요?</p>
          <p className="text-sm text-gray-400">매수 가능 1,000,000원 | 최대 20주</p>
          <div className="text-4xl font-bold my-4 h-12">
            {quantity || "0"}<span className="ml-2 text-2xl font-normal">주</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {numpadKeys.map((key) => (
            <button
              key={key}
              onClick={() => (key === "←" ? handleBackspace() : handleNumberClick(key))}
              className="bg-white text-2xl font-semibold rounded-lg p-4 h-16 flex items-center justify-center shadow-sm"
            >
              {key}
            </button>
          ))}
        </div>
      </main>

      <footer className="p-4 bg-white">
        {Number(quantity) > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-center">구매를 확정해 주세요</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">{stockName}</span>
              <span className="font-bold">{quantity}주 {action === 'buy' ? '매수' : '매도'}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={isLoading || !quantity || Number(quantity) === 0}
          className={`w-full font-bold py-3 rounded-lg ${action === 'buy' ? 'bg-blue-600' : 'bg-red-500'} text-white disabled:bg-gray-300`}
        >
          {isLoading ? '주문 중...' : (action === 'buy' ? '매수하기' : '매도하기')}
        </button>
      </footer>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TradePageContent />
    </Suspense>
  );
}
