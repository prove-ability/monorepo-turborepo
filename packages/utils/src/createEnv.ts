/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

// createEnv 함수가 받을 스키마의 타입을 정의합니다.
type EnvSchema<T extends z.ZodObject<any>> = {
  /**
   * 서버에서만 사용되는 환경 변수 스키마입니다.
   * `NEXT_PUBLIC_` 접두사가 없어야 합니다.
   */
  server: T;
  /**
   * 클라이언트(브라우저)에 노출될 환경 변수 스키마입니다.
   * `NEXT_PUBLIC_` 접두사가 반드시 있어야 합니다.
   */
  client: T;
};

export function createEnv<
  TServer extends z.ZodObject<any>,
  TClient extends z.ZodObject<any>,
>(schema: EnvSchema<TServer | TClient>) {
  // 서버와 클라이언트 스키마를 하나로 합칩니다.
  const envSchema = schema.server.merge(schema.client);

  const runtimeEnv = process.env;

  // 스키마를 사용해 환경 변수를 파싱합니다.
  const parsed = envSchema.safeParse(runtimeEnv);

  // 파싱에 실패하면 상세한 에러 메시지와 함께 프로세스를 종료합니다.
  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  // 성공하면, 타입이 완벽하게 추론된 env 객체를 반환합니다.
  return parsed.data;
}
