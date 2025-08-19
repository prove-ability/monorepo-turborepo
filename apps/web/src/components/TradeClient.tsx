"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Delete } from "lucide-react";
import { executeTrade } from "@/actions/investActions";
import { createWebClientByClientSide } from "@/lib/supabase/client";

export default function TradeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stockId = searchParams.get("stockId");
  const stockName = searchParams.get("stockName");
  const price = searchParams.get("price");
  const action = searchParams.get("action");

  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassInfo = async () => {
      const supabase = createWebClientByClientSide();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: student } = await supabase
          .from("users")
          .select("class_id")
          .eq("user_id", session.user.id)
          .single();
        if (student) {
          setClassId(student.class_id);
        }
      }
    };
    fetchClassInfo();
  }, []);

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      setQuantity((prev) => prev.slice(0, -1));
    } else if (quantity.length < 5) {
      setQuantity((prev) => prev + key);
    }
  };

  const handleTrade = async () => {
    if (
      !stockId ||
      !price ||
      !action ||
      !classId ||
      !quantity ||
      parseInt(quantity) === 0
    ) {
      alert("거래 정보가 올바르지 않습니다.");
      return;
    }

    const confirmMessage = `[${action === "buy" ? "매수" : "매도"} 확인]\n종목: ${stockName}\n수량: ${quantity}주\n가격: ${Number(price).toLocaleString()}원\n\n정말로 진행하시겠습니까?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    const result = await executeTrade({
      stockId,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      action: action as "buy" | "sell",
    });

    setIsLoading(false);
    if (result.success) {
      alert(`${action === "buy" ? "매수" : "매도"}가 완료되었습니다.`);
      router.push("/invest");
    } else {
      alert(`[거래 실패] ${result.error}`);
    }
  };

  const numericKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 flex items-center border-b bg-white">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-bold text-lg">{stockName}</h1>
          <p className="text-gray-500">{Number(price).toLocaleString()}원</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-8 text-center">
        <div className="bg-blue-900 text-white p-6 rounded-lg w-full max-w-sm">
          <p className="text-lg">수량</p>
          <h2 className="text-4xl font-bold my-2 h-12">{quantity || "0"}</h2>
          <p className="text-blue-200">{`몇 주 ${action === "buy" ? "매수" : "매도"}할까요?`}</p>
        </div>
      </main>

      <footer className="bg-gray-200 p-2">
        <div className="grid grid-cols-3 gap-2">
          {numericKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="p-4 text-2xl font-bold bg-white rounded-lg hover:bg-gray-100"
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleKeyPress("backspace")}
            className="p-4 flex justify-center items-center bg-white rounded-lg hover:bg-gray-100"
          >
            <Delete size={28} />
          </button>
        </div>
        <button
          onClick={handleTrade}
          disabled={isLoading || !quantity}
          className={`w-full p-4 mt-2 text-white font-bold rounded-lg transition-colors ${
            action === "buy"
              ? "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
              : "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
          }`}
        >
          {isLoading
            ? "거래 중..."
            : `${quantity}주 ${action === "buy" ? "매수하기" : "매도하기"}`}
        </button>
      </footer>
    </div>
  );
}
