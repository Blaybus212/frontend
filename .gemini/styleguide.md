# 프로젝트 스타일 가이드

이 문서는 blaybus 프론트엔드 프로젝트의 코드 스타일과 베스트 프랙티스를 정의합니다.

## 일반 원칙

1. **명확성 우선**: 코드는 읽기 쉽고 이해하기 쉬워야 합니다.
2. **일관성**: 프로젝트 전반에 걸쳐 일관된 코딩 스타일을 유지합니다.
3. **타입 안정성**: TypeScript의 타입 시스템을 적극 활용합니다.
4. **성능**: 불필요한 리렌더링과 연산을 최소화합니다.

## TypeScript/JavaScript 규칙

### 변수 및 함수 네이밍

- **변수**: `camelCase` 사용
  ```typescript
  const userName = 'John';
  const isActive = true;
  ```

- **함수**: `camelCase` 사용, 동사로 시작
  ```typescript
  function getUserData() {}
  const handleSubmit = () => {};
  ```

- **컴포넌트**: `PascalCase` 사용
  ```typescript
  function UserProfile() {}
  const NavigationBar = () => {};
  ```

- **상수**: `UPPER_SNAKE_CASE` 사용
  ```typescript
  const MAX_RETRY_COUNT = 3;
  const API_BASE_URL = 'https://api.example.com';
  ```

### 타입 정의

- 인터페이스는 `PascalCase`로 명명하고 `I` 접두사는 사용하지 않습니다.
- 타입은 가능한 한 명시적으로 정의합니다.

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type ApiResponse<T> = {
  data: T;
  status: number;
};
```

### 함수 작성 규칙

- 함수는 단일 책임 원칙을 따릅니다.
- 함수는 가능한 한 작고 집중적으로 작성합니다.
- 매개변수는 3개 이하로 유지합니다.

```typescript
// 좋은 예
function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 나쁜 예
function processOrder(user, items, payment, shipping, discount) {
  // 너무 많은 매개변수
}
```

## React/Next.js 규칙

### 컴포넌트 구조

- 컴포넌트는 함수형 컴포넌트를 사용합니다.
- 컴포넌트는 한 파일에 하나씩 정의합니다.
- 파일명은 컴포넌트명과 일치시킵니다.

```typescript
// components/UserCard.tsx
export function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

### Hooks 사용

- 커스텀 훅은 `use` 접두사를 사용합니다.
- 훅은 컴포넌트 최상위에서만 호출합니다.

```typescript
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return user;
}
```

### Props 타입 정의

- Props는 인터페이스나 타입으로 명시적으로 정의합니다.
- Optional props는 `?`를 사용합니다.

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, disabled, variant = 'primary' }: ButtonProps) {
  // ...
}
```

### 상태 관리

- 로컬 상태는 `useState`를 사용합니다.
- 복잡한 상태는 `useReducer`를 고려합니다.
- 전역 상태는 필요할 때만 사용합니다.

### 이벤트 핸들러

- 이벤트 핸들러는 `handle` 접두사를 사용합니다.

```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  // ...
}
```

## 파일 구조

```
app/
  ├── components/     # 재사용 가능한 컴포넌트
  ├── lib/            # 유틸리티 함수
  ├── hooks/          # 커스텀 훅
  ├── types/          # TypeScript 타입 정의
  └── styles/         # 스타일 파일
```

## 에러 처리

- 에러는 명시적으로 처리합니다.
- 사용자에게 의미 있는 에러 메시지를 제공합니다.

```typescript
try {
  const data = await fetchData();
} catch (error) {
  console.error('데이터 로딩 실패:', error);
  // 사용자에게 알림 표시
}
```

## 주석 및 문서화

- 복잡한 로직에는 주석을 추가합니다.
- 함수는 JSDoc 형식으로 문서화합니다.

```typescript
/**
 * 사용자 데이터를 가져옵니다.
 * @param userId - 사용자 ID
 * @returns 사용자 데이터 또는 null
 */
async function fetchUser(userId: string): Promise<User | null> {
  // ...
}
```

## 성능 최적화

- 불필요한 리렌더링을 방지하기 위해 `React.memo`를 적절히 사용합니다.
- 큰 리스트는 가상화를 고려합니다.
- 이미지는 Next.js의 `Image` 컴포넌트를 사용합니다.

## 접근성 (A11y)

- 시맨틱 HTML을 사용합니다.
- ARIA 속성을 적절히 사용합니다.
- 키보드 네비게이션을 지원합니다.

## 보안

- 사용자 입력은 항상 검증합니다.
- 민감한 정보는 클라이언트에 저장하지 않습니다.
- API 키는 환경 변수로 관리합니다.

## 테스트

- 중요한 비즈니스 로직은 테스트를 작성합니다.
- 컴포넌트는 가능한 한 테스트 가능하게 작성합니다.

