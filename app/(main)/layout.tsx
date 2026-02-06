'use client';

import { usePathname } from 'next/navigation';
// import SaveStatus from '@/components/SaveStatus';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // const isViewer = pathname.startsWith('/viewer');

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1014]">
      <nav className="h-16 flex items-center justify-between px-6 bg-[#1a1b23] border-b border-white/5">
        {/* 좌측: 로고 (고정) */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#d9f99d] rounded-lg flex items-center justify-center">
             <span className="text-black font-black text-xs">S</span>
          </div>
          <span className="font-bold text-white tracking-wider">SIMVEX</span>
        </div>

        {/* 중앙: 뷰어 경로일 때만 상태 구독 컴포넌트 마운트 */}
        {/* isViewer ? <SaveStatus /> : <div /> */}

        {/* 우측: 프로필 (고정) */}
        <div className="w-9 h-9 rounded-full bg-gray-800 border border-white/10 overflow-hidden" />
      </nav>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}