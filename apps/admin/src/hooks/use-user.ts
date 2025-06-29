"use client";

import { useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { createClientByClientSide } from "@repo/utils";

export function useUser() {
  const supabase = createClientByClientSide();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 현재 사용자 정보를 비동기적으로 가져옵니다.
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("2", user);
      setUser(user);
      setIsLoading(false);
    };

    fetchUser();

    // auth 상태 변경(SIGNED_IN, SIGNED_OUT)을 감지하는 리스너를 설정합니다.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // 세션 정보가 변경될 때마다 user 상태를 업데이트합니다.
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // 컴포넌트가 언마운트될 때 리스너를 정리(cleanup)합니다.
    // 이렇게 하지 않으면 메모리 누수가 발생할 수 있습니다.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return { user, isLoading };
}
