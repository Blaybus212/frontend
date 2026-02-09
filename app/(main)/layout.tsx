'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
// import SaveStatus from '@/components/SaveStatus';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isViewer = pathname.startsWith('/viewer');
  const isHome = pathname.startsWith('/home');
  const isLoggedIn = !pathname.startsWith('/login');

  const router = useRouter();
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  return (
    <div className={`${isViewer ? 'h-screen' : 'min-h-screen'} flex flex-col bg-surface`}>
      <nav className={`${isHome && 'fixed w-full z-100'} h-16 flex items-center justify-between px-12 bg-surface border-b border-[#1E2939] shrink-0`}>
        {/* 좌측: 로고 (고정) */}
        <div 
          onClick={()=>router.push('/home')}
          className="flex items-center gap-2 cursor-pointer">
          <Image 
            src="/images/logo.svg" 
            unoptimized
            alt="로고" 
            width={24}
            height={24}
          />
          <span className="font-rem text-b-xl font-semibold text-white">SIMVEX</span>
        </div>

        {/* 중앙: 뷰어 경로일 때만 상태 구독 컴포넌트 마운트 */}
        {isViewer && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="flex items-center gap-2 text-b-sm text-text-title">
              <span className="w-3 h-3 rounded-full bg-point-500" aria-hidden />
              <span className="font-weight-semibold">Auto Save</span>
              <span className="text-sub2">{timeLabel}</span>
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-md bg-point-500 text-base-black text-b-sm font-weight-semibold hover:bg-selected transition-colors"
            >
              저장하기
            </button>
          </div>
        )}

        {/* 우측: 프로필 (고정) */}
        {
          isLoggedIn &&
          <Image 
            src="/images/profile.svg" 
            unoptimized
            alt="프로필" 
            width={34}
            height={34}
            className='cursor-pointer'
            onClick={async ()=>{
              await signOut();
            }}
          />
        }
      </nav>

      <main className={`flex-1 ${isViewer ? 'overflow-hidden' : 'overflow-auto'} ${isHome && 'pt-16'}`}>
        {children}
      </main>
    </div>
  );
}