import { type InferSelectModel } from "drizzle-orm";
import { type stocks } from "@repo/db/schema";

export type Stock = InferSelectModel<typeof stocks>;
