import { type InferSelectModel } from "drizzle-orm";
import { type managers } from "@repo/db/schema";

export type Manager = InferSelectModel<typeof managers>;
