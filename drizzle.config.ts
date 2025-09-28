import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({
  path: "./packages/db/.env",
});

export default {
  schema: "./packages/db/src/schema.ts",
  out: "./packages/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
