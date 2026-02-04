// 사용자가 페이지를 요청하기 전, Next.js 서버 프로세스가 딱 켜지는 그 시점에 한 번만 실행
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initMsw } = await import('@/app/msw/init');
    await initMsw();
  }
}