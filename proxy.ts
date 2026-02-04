import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // static 파일, api 경로는 미들웨어가 무시하도록 설정
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)"],
};
