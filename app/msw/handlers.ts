// MSW 핸들러 설정: http 메서드별로 mock API 응답을 정의
// 예시:
// http.get('/api/users', () => {
//   return HttpResponse.json([{ id: 1, name: '홍길동' }]);
// })
import { HttpResponse, http } from "msw";
 
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const handlers = [
  // 로그인
  http.post(`${API_URL}/login`, () => {
    return HttpResponse.json({ accessToken: "mocked-spring-jwt-token" });
  }),
];