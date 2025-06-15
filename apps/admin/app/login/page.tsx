import { redirect } from "next/navigation";
import { createClientByServerSide } from "@repo/utils";
import { Button } from "@repo/ui";

export default async function LoginPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error("Missing environment variables for Supabase client.");
  }

  const {
    data: { session },
  } = await (
    await createClientByServerSide(baseUrl, anonKey)
  ).auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-6">Login</h1>
      <Button>123</Button>
    </div>
  );
}
