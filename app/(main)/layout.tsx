'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { SaveStatusProvider, useSaveStatus } from '@/app/_contexts/SaveStatusContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isViewer = pathname.startsWith('/viewer');
  const isHome = pathname.startsWith('/home');
  const isLoggedIn = !pathname.startsWith('/login');


  const router = useRouter();
  

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
        {isViewer && <AutoSaveStatus />}

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

function AutoSaveStatus() {
  const { status, elapsedSeconds, triggerSave, isAutoSaveVisible } = useSaveStatus();
  const [isSaving, setIsSaving] = useState(false);

  if (!isAutoSaveVisible) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualSave = async () => {
    if (!triggerSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await triggerSave();
    } finally {
      setIsSaving(false);
    }
  };

  const isButtonDisabled = status === 'saving' || isSaving;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
      <div className="flex items-center gap-2 text-b-sm text-text-title">
        {/* 저장 상태 아이콘 */}
        {status === 'saving' ? (
          <svg
            className="w-3 h-3 animate-spin text-point-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : status === 'saved' ? (
          <svg
            className="w-3 h-3 text-point-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="w-3 h-3 rounded-full bg-sub3" aria-hidden />
        )}
        
        <span className="font-weight-semibold">Auto Save</span>
        <span className="text-sub2">{formatTime(elapsedSeconds)}</span>
      </div>
      
      <button
        type="button"
        onClick={handleManualSave}
        disabled={isButtonDisabled}
        className="h-8 px-3 rounded-md bg-point-500 text-base-black text-b-sm font-weight-semibold hover:bg-selected transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        저장하기
      </button>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SaveStatusProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SaveStatusProvider>
  );
}