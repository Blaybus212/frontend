// MSW 초기화: SSR/테스트 환경에서는 server, 브라우저에서는 worker 실행
export async function initMsw() {
  if (typeof window === 'undefined') {
    const { server } = await import('./server');
    // 핸들러에 등록하지 않은 외부 요청에 대한 msw 경고 무시
    server.listen({ onUnhandledRequest: 'bypass' });
    console.log('✅ MSW Server-side Started');
  } else {
    const { worker } = await import('./worker');
    worker.start();
    console.log('✅ MSW Client-side Started');
  }
}