'use client';
 
import { useEffect, useState } from 'react';

interface MSWComponentProps {
  children: React.ReactNode;
}
 
/**
 * MSW 실행 컴포넌트
 * - 클라이언트 환경에서 MSW를 초기화한 뒤 자식 컴포넌트를 렌더링
 */
export const MSWComponent = ({ children }: MSWComponentProps) => {
  const [mswReady, setMswReady] = useState(false);
  useEffect(() => {
    const init = async () => {
      const initMsw = await import('@/app/msw/init').then((res) => res.initMsw);
      await initMsw();
      setMswReady(true);
    };
 
    if (!mswReady) {
      init();
    }
  }, [mswReady]);
 
  return <>{children}</>;
};
