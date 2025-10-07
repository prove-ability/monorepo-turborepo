import { type InferSelectModel } from "drizzle-orm";
import { type news } from "@repo/db/schema";

export type News = InferSelectModel<typeof news>;
