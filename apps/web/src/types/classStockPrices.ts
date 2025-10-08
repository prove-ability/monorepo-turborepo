import { type InferSelectModel } from "drizzle-orm";
import { type classStockPrices } from "@repo/db/schema";

export type ClassStockPrice = InferSelectModel<typeof classStockPrices>;
