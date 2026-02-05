'use client';

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    // signOut을 호출하여 세션 삭제하고 리다이렉트
    await signOut({ 
      redirect: false,
      callbackUrl: "/login" 
    });
    // 클라이언트 사이드 라우팅으로 이동
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#12141c] text-white">
      <div className="rounded-3xl bg-[#1c1f2a] p-12 shadow-2xl border border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full rounded-xl bg-[#d4ff59] py-4 font-bold text-black hover:bg-[#c2eb4c] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}