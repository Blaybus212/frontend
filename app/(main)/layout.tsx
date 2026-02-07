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

  return (
    <div className=
      {`
        ${isViewer ? 'h-screen' : 'min-h-screen'} 
        ${isHome && 'fixed w-full z-100'}
        flex flex-col bg-surface
      `}>
      <nav className="h-16 flex items-center justify-between px-12 bg-surface border-b border-[#1E2939] shrink-0">
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
          <span className="text-b-xl font-semibold text-white">SIMVEX</span>
        </div>

        {/* 중앙: 뷰어 경로일 때만 상태 구독 컴포넌트 마운트 */}
        {/* isViewer ? <SaveStatus /> : <div /> */}

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

      <main className={`flex-1 ${isViewer ? 'overflow-hidden' : 'overflow-auto'}`}>
        {children}
      </main>
    </div>
  );
}