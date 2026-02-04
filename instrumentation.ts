/**
 * [Next.js Instrumentation 설정]
 * 1. 역할: Next.js 서버가 시작될 때(Bootstrapping) 환경을 초기화하는 함수
 * 2. 특징: 서버 컴포넌트나 API Route가 실행되기 "전"에 실행되어야 하는 설정을 담당
 * 3. 핵심: 여기에서 MSW를 띄워야 서버 사이드 fetch(Server Component)를 가로챌 수 있음
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initMsw } = await import('@/app/msw/init');
    
    await initMsw();
  }
}