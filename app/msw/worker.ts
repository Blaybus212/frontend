// MSW 워커 설정: 브라우저 환경에서 API 요청을 가로채기 위한 mock 서버
import { setupWorker } from "msw/browser";
import { handlers } from './handlers';
 
export const worker = setupWorker(...handlers);