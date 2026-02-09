'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function OnboardFinishedPage() {
  const router = useRouter();
  const session = useSession();

  return (
    <main className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-surface px-4 text-center">
      {/* 중앙 아이콘 (체크 표시 등 그래픽) */}
      <div className="relative mb-10 grid place-items-center">
        {/* 모든 자식이 같은 자리에 쌓입니다. */}
        <div className="col-start-1 row-start-1 w-13.5 h-13.5 rounded-full bg-point-500/20 animate-expand" />
        <div className="col-start-1 row-start-1 w-8.5 h-8.5 rounded-full bg-point-500 animate-pulse-soft" />
      </div>

      {/* 메인 문구 */}
      <h1 className="text-h-1xl font-bold text-title mb-12">
        학습을 위한<br />
        모든 준비가 끝났어요!
      </h1>

      <button
        onClick={() => 
          
          router.push(`/home?category=${session.data?.loginUser?.preferCategory}`)

        }
        className="px-[40.5px] py-4.5 rounded-[14px] bg-point-500 text-b-xl font-semibold text-base-black"
      >
        홈 화면으로 바로가기
      </button>
    </main>
  );
}