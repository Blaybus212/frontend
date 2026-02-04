import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * [ FETCH INTERCEPTOR ]
 * - 세션 토큰 주입
 * - 401 만료 시 자동 리다이렉트
 */
export async function $fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await auth();
  const token = session?.accessToken;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    redirect("/login?error=SessionExpired");
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 세션 만료(401) 처리
  if (response.status === 401) {
    redirect("/login?error=SessionExpired");
  }

  if (!response.ok) throw new Error("API 요청 실패");

  return response.json();
}