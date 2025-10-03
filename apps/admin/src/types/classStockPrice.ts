import { type InferSelectModel } from "drizzle-orm";
import { type classStockPrices } from "@repo/db/schema";

export type ClassStockPrice = InferSelectModel<typeof classStockPrices>;

export type ClassStockPriceInput = {
  id?: string;
  classId: string;
  stockId: string;
  day: number;
  price: string;
};
