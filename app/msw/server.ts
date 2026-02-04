// MSW 서버 설정: SSR/테스트 환경에서 API 요청을 가로채기 위한 mock 서버
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
 
export const server = setupServer(...handlers);