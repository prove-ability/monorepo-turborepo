import { createClientByServerSide } from "@repo/utils";
import { Button } from "@repo/ui";
import { env } from "../../env";

export default async function LoginPage() {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const {
    data: { session },
  } = await (
    await createClientByServerSide(baseUrl, anonKey)
  ).auth.getSession();

  console.log("session", session);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-6">Login</h1>
      <Button>123</Button>
    </div>
  );
}
