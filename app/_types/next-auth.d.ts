import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    loginUser?: LoginUser;
  };
  interface User {
    accessToken?: string;
    loginUser?: LoginUser;
  };
}