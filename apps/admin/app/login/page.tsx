import { redirect } from "next/navigation";
import { createClientByServerSide } from "@repo/utils";
import { Button } from "@repo/ui";

export default async function LoginPage() {
  const {
    data: { session },
  } = await (await createClientByServerSide()).auth.getSession();

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
