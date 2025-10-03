import { type InferSelectModel } from "drizzle-orm";
import { type classes } from "@repo/db/schema";

export type Class = InferSelectModel<typeof classes>;
