import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * 아래 경로에서는 authConfig의 authorized()함수가 실행되지 않도록 설정:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - mockServiceWorker.js (MSW 사용 시)
     * - public 폴더 내의 정적 이미지나 파일들 (.png, .jpg, .svg 등)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js|.*\\.png$|.*\\.jpg$|robots.txt).*)",
  ],
};
