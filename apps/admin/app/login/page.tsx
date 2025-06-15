import { redirect } from "next/navigation";
import { supabase } from "@repo/utils";
import { Button } from "@repo/ui/button";

export default async function LoginPage() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-6">Login</h1>
      <Button appName="Login">123</Button>
    </div>
  );
}
