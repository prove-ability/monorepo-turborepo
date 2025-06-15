import { createEnv } from "@repo/utils";
import { z } from "zod";

export const env = createEnv({
  server: z.object({}),
  client: z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  }),
});
