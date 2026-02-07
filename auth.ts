/**
 * [Auth 설정 파일]
 * 1. 역할: 로그인 방식(Credentials), 세션 관리, 핸들러(GET/POST) 생성
 * 2. 흐름: 
 * - 사용자가 로그인 시도 -> authorize() 함수 실행
 * - fetch를 통해 백엔드(현재는 MSW)와 통신하여 유저 정보 확인
 * - 인증 성공 시 유저 객체 반환 -> 세션 쿠키 생성
 */
import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "SpringServer",
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        });

        const user: User = await res.json();
        if (res.ok && user) return user;
        return null;
      },
    }),
  ],
});