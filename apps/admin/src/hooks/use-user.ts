"use client";

import useSWR from "swr";
import { type InferSelectModel } from "drizzle-orm";
import { type admins } from "@repo/db/schema";

// Infer the type from the Drizzle schema and add the auth user properties.
export type UserWithRole = InferSelectModel<typeof admins> & {
  app_metadata: { [key: string]: any };
  user_metadata: { [key: string]: any };
};

// The API response shape.
interface UserResponse {
  user: UserWithRole | null;
}

// A simple fetcher function that fetches JSON data.
const fetcher = async (url: string): Promise<UserResponse> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    const errorInfo = await res.json();
    console.error(errorInfo);
    throw error;
  }

  return res.json();
};

export function useUser() {
  // Use SWR to fetch the user data from our API route.
  const { data, error, isLoading } = useSWR<UserResponse>(
    "/api/auth/user",
    fetcher,
    {
      // Re-fetch on window focus to keep data fresh.
      revalidateOnFocus: true,
    }
  );

  return {
    user: data?.user ?? null,
    isLoading,
    isError: error,
  };
}
