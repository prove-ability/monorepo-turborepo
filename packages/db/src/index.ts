import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// HTTP 모드: 빠른 단순 쿼리용 (READ 작업에 최적)
const httpClient = neon(connectionString);
export const db = drizzleHttp(httpClient, { schema });

// WebSocket 모드: 트랜잭션 지원 (복잡한 WRITE 작업용)
const pool = new Pool({ connectionString });
export const dbWithTransaction = drizzleServerless(pool, { schema });

export * from "./schema";
