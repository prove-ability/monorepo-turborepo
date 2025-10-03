"use client";

import { FormEvent, useState } from "react";
import { createManager } from "@/actions/managerActions";
import { Manager } from "@/types/manager";
import { Button } from "@repo/ui";

export function AddManagerForm({
  clientId,
  onManagerAdded,
}: {
  clientId: string;
  onManagerAdded: (manager: Manager) => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("mobile_phone", mobile);
    formData.append("email", email);
    const result: any = await createManager(clientId, formData);
    setLoading(false);
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error
    ) {
      setError(
        typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", ")
      );
    } else {
      setMsg(result.message);
      setName("");
      setMobile("");
      setEmail("");
      // 새로 추가된 매니저를 부모 컴포넌트에 전달
      if (result && result.data) {
        onManagerAdded(result.data);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
      <input
        className="border p-1 rounded"
        placeholder="이름"
        name="name"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="border p-1 rounded"
        id="phone"
        name="phone"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <input
        className="border p-1 rounded"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "저장 중..." : "매니저 저장"}
      </Button>
      {msg && <div className="text-green-600 text-sm mt-1">{msg}</div>}
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </form>
  );
}
