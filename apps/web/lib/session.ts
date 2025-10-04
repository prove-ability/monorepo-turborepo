import "server-only";
import { cookies } from "next/headers";
import { User } from "./auth";

const SESSION_COOKIE_NAME = "guests_session";

export async function createSession(user: User) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify(user);

  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const user = JSON.parse(sessionCookie.value) as User;
    return user;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
