import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith('/test')) return true;

      if (pathname.startsWith('/login')) {
        if (isLoggedIn) return Response.redirect(new URL('/home', nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) token.accessToken = (user as any).accessToken;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 60 }, // 30분 유지
  providers: [],
} satisfies NextAuthConfig;