import { type InferSelectModel } from "drizzle-orm";
import { type clients } from "@repo/db/schema";

export type Client = InferSelectModel<typeof clients>;
