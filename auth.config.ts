/**
 * [Auth 설정 구성 파일]
 * 1. 역할: 프록시(proxy.ts)에서 공통으로 사용할 인증 규칙 및 세션/토큰 커스텀 정의
 * 2. 특징: 'Edge Runtime' 호환성을 위해 실제 Provider(Credentials 등)와 분리하여 작성
 */
import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    /** [authorized 콜백]
     * @param auth - 현재 세션 정보 (로그인 여부 확인용)
     * @param nextUrl - 사용자가 가려고 하는 목적지 주소
     * @returns true (요청한 주소로 이동) / false (signIn page로 이동)
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith('/test')) return true;

      if (pathname.startsWith('/login')) {
        if (isLoggedIn) return Response.redirect(new URL('/home', nextUrl));
        return true; // 미로그인 유저는 로그인 페이지 접근 허용
      }

      if (pathname === "/") {
        return Response.redirect(new URL('/login', nextUrl));
      }

      return isLoggedIn;
    },
    /**
     * [jwt 콜백: 서버용 통행증 만들기]
     * 1. 실행 시점: 로그인 성공 시, 또는 세션이 체크될 때마다 실행
     * 2. 역할: DB나 백엔드에서 받은 정보를 '암호화된 쿠키(JWT)'에 저장함
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.loginUser = user.loginUser;
      }

      if (trigger === "update" && session?.loginUser) {
        token.loginUser = session.loginUser;
        // 만약 accessToken도 업데이트 된다면 여기서 처리
      }

      return token;
    },
    /**
     * [session 콜백: 클라이언트용 신분증 만들기]
     * 1. 실행 시점: 클라이언트(useSession)나 서버(auth())에서 세션에 접근할 때 호출
     * 2. 역할: JWT 토큰에 들어있는 안전한 정보를 실제 화면에서 쓸 수 있게 공개함
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.loginUser = token.loginUser as LoginUser;
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 60 }, // 30분 유지
  providers: [],
} satisfies NextAuthConfig;