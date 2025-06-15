import { createEnv } from "@repo/utils";
import { z } from "zod";

export const env = createEnv({
  // 서버 스키마
  server: z.object({}),
  // 클라이언트 스키마
  client: z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  }),
});
