"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithStack } from "@/actions/userActions";
import { toast } from "sonner";

const userSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserManagement({ classId }: { classId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: UserFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("classId", classId);

    const result = await createUserWithStack(formData);

    if (result.success) {
      toast.success(result.message);
      reset();
    } else {
      if (result.error) {
        for (const [key, value] of Object.entries(result.error)) {
          setError(key as keyof UserFormData, {
            type: "manual",
            message: value!.join(", "),
          });
        }
      }
      toast.error("학생 생성에 실패했습니다.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>학생 계정 관리</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일 (로그인 ID)</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">초기 비밀번호</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "학생 계정 생성"}
          </Button>
        </form>

        <div className="mt-8">
          <h4 className="font-semibold mb-4">생성된 학생 목록</h4>
          {/* TODO: Display list of users for the class */}
          <div className="border rounded-md p-4 text-center text-muted-foreground">
            <p>아직 생성된 학생이 없습니다.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
