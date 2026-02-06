'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
// import SaveStatus from '@/components/SaveStatus';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  // const isViewer = pathname.startsWith('/viewer');
  const isLoggined = !pathname.startsWith('/login');

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1014]">
      <nav className="h-16 flex items-center justify-between px-12 bg-surface border-b border-[#1E2939]">
        {/* 좌측: 로고 (고정) */}
        <div className="flex items-center gap-2">
          <Image 
            src="/images/logo.svg" 
            unoptimized
            alt={"로고"} 
            width={24}
            height={24}
          />
          <span className="text-b-xl font-semibold text-white">SIMVEX</span>
        </div>

        {/* 중앙: 뷰어 경로일 때만 상태 구독 컴포넌트 마운트 */}
        {/* isViewer ? <SaveStatus /> : <div /> */}

        {/* 우측: 프로필 (고정) */}
        {
          isLoggined &&
          <Image 
            src="/images/profile.svg" 
            unoptimized
            alt={"로고"} 
            width={34}
            height={34}
          />
        }
      </nav>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}