// MSW 초기화: SSR/테스트 환경에서는 server, 브라우저에서는 worker 실행
export async function initMsw() {
  if (typeof window === 'undefined') {
    const { server } = await import('@/src/msw/server');
    server.listen();
  } else {
    const { worker } = await import('@/src/msw/worker');
    await worker.start();
  }
}