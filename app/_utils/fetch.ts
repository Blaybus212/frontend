'use server';

import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * [$fetch 유틸리티]
 * 모든 API 요청 시 인증(토큰)과 에러(로그아웃)를 자동으로 관리함
 */
export async function $fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 1. 현재 세션에서 액세스 토큰 가져오기
  const session = await auth();
  const token = session?.accessToken;

  // 2. 기본 헤더 설정 및 토큰 주입
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    // 토큰이 아예 없으면 로그인 페이지로 강제 이동
    redirect("/login?error=SessionExpired");
  }

  // 3. 실제 API 서버로 요청 보내기
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 4. 인증 만료(401) 시 즉시 로그인 페이지로 리다이렉트
  if (response.status === 401) {
    redirect("/login?error=SessionExpired");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(`API 요청 실패 (${response.status}): ${errorData?.message}`);
  }

  return response.json().catch(() => null);
}