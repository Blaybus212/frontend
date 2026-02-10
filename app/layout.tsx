import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { REM } from 'next/font/google';

export const metadata: Metadata = {
  title: "SIMVEX",
  description: "나에게 쉽게 보이는, 3D 학습 플랫폼 SIMVEX",
};

// REM font-family
const rem = REM({
  variable: "--font-rem",
  weight: "600",
});

// 프리텐다드 font-family
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} ${rem.variable}`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}