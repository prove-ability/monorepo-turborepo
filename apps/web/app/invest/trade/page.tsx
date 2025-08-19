import TradeClient from "@/components/TradeClient";
import { Suspense } from "react";

export default function TradePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TradeClient />
    </Suspense>
  );
}
