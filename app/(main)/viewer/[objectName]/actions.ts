'use server';

import { $fetch } from '@/app/_utils/fetch';
import { auth } from '@/auth';

const throwAuthError = () => {
  throw new Error('AUTH_EXPIRED');
};

/**
 * AI 대화 전용 fetch 함수 (response.json()을 한 번만 호출)
 */
async function conversationFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throwAuthError();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
    throw new Error(`API 요청 실패 (${response.status}): ${errorData.message}`);
  }

  // ✅ response.json()을 한 번만 호출
  const data = await response.json();
  return data;
}

export interface SceneInfo {
  title: string;
  engTitle: string;
  description: string;
  isSceneInformation: boolean;
}

// AI 대화 관련 타입
export interface ComponentInfo {
  name: string;
  description: string;
  texture: string;
  usage: string;
}

export interface ConversationMessage {
  sender: 'USER' | 'ASSISTANT';
  content: string;
  postedAt: string;
  references: Record<string, ComponentInfo>;
}

export interface ConversationResponse {
  messages: ConversationMessage[];
  pages: {
    prevCursor: string | null;
    nextCursor: string | null;
    hasPrevious: boolean;
    hasNext: boolean;
    limit: number;
  };
}

export interface ConversationSummary {
  summary: string;
  totalConversations: number;
  totalMessages: number;
}

export interface SendMessageRequest {
  content: string;
  references?: Array<{ componentId: number }>;
}

export interface SendMessageResponse {
  sender: 'ASSISTANT';
  content: string;
  postedAt: string;
  references: Record<string, ComponentInfo>;
}

export type QuizType = 'SELECT' | 'INPUT';

export interface SceneQuiz {
  id: number;
  targetPurpose: string;
  type: QuizType;
  question: string;
  choice: string | null;
}

export interface QuizUserProgress {
  userProgressId: number;
  lastQuizId: number | null;
  totalQuestions: number;
  success: number;
  failure: number;
  isComplete?: boolean;
}

export interface SceneQuizResponse {
  sceneInfoId: number;
  userProgress: QuizUserProgress;
  quizzes: SceneQuiz[];
}

export interface QuizProgressRequest {
  lastQuizId: number | null;
  totalQuestions: number;
  success: number;
  failure: number;
  solveTime: number;
  isComplete: boolean;
}

export interface GradeResponse {
  correct: boolean;
  score: number;
  correctAnswer: string;
}

export async function syncSceneState(sceneId: string, payload: unknown) {
  await $fetch(`/scenes/${encodeURIComponent(sceneId)}/sync`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * ZIP 파일 다운로드 (서버 액션)
 * $fetch와 동일한 인증 방식 사용
 */
export async function fetchZipData(
  sceneId: string,
  target: 'both' | 'default' | 'custom' = 'both'
): Promise<{ data: ArrayBuffer; filename: string | null }> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/scenes/${encodeURIComponent(sceneId)}/viewer?target=${encodeURIComponent(target)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store', // 캐시 비활성화 - 항상 최신 데이터 가져오기
    next: { revalidate: 0 }, // Next.js 캐시도 비활성화
  });

  if (response.status === 401) {
    const errorText = await response.text();
    console.error('❌ 인증 오류:', errorText);
    throwAuthError();
  }

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  // Content-Disposition 헤더에서 파일명 추출
  const contentDisposition = response.headers.get('content-disposition');
  let filename: string | null = null;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }
  
  // 파일명이 없으면 sceneId를 사용
  if (!filename) {
    filename = `scene_${sceneId}.zip`;
  }

  // ArrayBuffer와 파일명 반환
  const data = await response.arrayBuffer();
  return { data, filename };
}

/**
 * 씬 정보를 가져오는 서버 액션
 */
export async function fetchSceneInfo(sceneId: string): Promise<SceneInfo> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/scenes/${encodeURIComponent(sceneId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store', // 캐시 비활성화
    next: { revalidate: 0 },
  });

  if (response.status === 401) {
    throwAuthError();
  }

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  return response.json();
}

export interface DisassemblyLevelResponse {
  disassemblyLevel: number;
}

export async function fetchDisassemblyLevel(sceneId: string): Promise<DisassemblyLevelResponse | null> {
  return $fetch(`/scenes/${encodeURIComponent(sceneId)}/disassembly-level`, {
    method: 'GET',
  });
}

export async function updateDisassemblyLevel(sceneId: string, disassemblyLevel: number) {
  await $fetch(`/scenes/${encodeURIComponent(sceneId)}/disassembly-level`, {
    method: 'PUT',
    body: JSON.stringify({ disassemblyLevel }),
  });
}

export interface SceneNoteResponse {
  content: string;
}

export interface NoteDebugInfo {
  url: string;
  status: number;
  ok: boolean;
  contentType: string | null;
  body: string;
}

export async function fetchSceneNote(
  sceneId: string
): Promise<{ data: SceneNoteResponse | string | null; debug?: NoteDebugInfo }> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/scenes/${encodeURIComponent(sceneId)}/note`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rawText = await response.text().catch(() => '');
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_NOTE === 'true';
  const debugInfo = debugEnabled
    ? {
        url,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: rawText,
      }
    : undefined;

  if (response.status === 401) {
    throwAuthError();
  }

  if (!response.ok) {
    return { data: null, debug: debugInfo };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = rawText ? JSON.parse(rawText) : null;
    return { data, debug: debugInfo };
  }

  return { data: rawText || null, debug: debugInfo };
}

export async function updateSceneNote(
  sceneId: string,
  content: string
): Promise<{ debug?: NoteDebugInfo }> {
  const payload = JSON.stringify({ content });
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/scenes/${encodeURIComponent(sceneId)}/note`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  const rawText = await response.text().catch(() => '');
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_NOTE === 'true';
  const debugInfo = debugEnabled
    ? {
        url,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        body: rawText,
      }
    : undefined;

  if (response.status === 401) {
    throwAuthError();
  }

  return { debug: debugInfo };
}

/**
 * 대화 이력 가져오기
 */
export async function fetchConversation(
  sceneId: string,
  limit: number = 5,
  cursor?: string
): Promise<ConversationResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) {
    params.append('cursor', cursor);
  }

  return conversationFetch(`/scenes/${encodeURIComponent(sceneId)}/conversation?${params.toString()}`, {
    method: 'GET',
  });
}

/**
 * AI 대화 요약 가져오기
 */
export async function fetchConversationSummary(): Promise<ConversationSummary | null> {
  return conversationFetch(`/conversations/summary`, {
    method: 'GET',
  });
}

/**
 * 메시지 전송
 */
export async function sendMessage(
  sceneId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await conversationFetch<SendMessageResponse>(`/scenes/${encodeURIComponent(sceneId)}/conversation/messages`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response;
}

/**
 * 씬 퀴즈 목록 및 진행 정보 가져오기
 */
export async function fetchSceneQuizzes(sceneId: string): Promise<SceneQuizResponse | null> {
  return $fetch(`/scenes/${encodeURIComponent(sceneId)}/quizzes`, {
    method: 'GET',
  });
}

/**
 * 퀴즈 진행 정보 저장 (종료 시점)
 */
export async function updateQuizProgress(sceneId: string, payload: QuizProgressRequest) {
  await $fetch(`/scenes/${encodeURIComponent(sceneId)}/quizzes/progress`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * 퀴즈 답안 제출 및 채점
 */
export async function gradeQuizAnswer(
  sceneId: string,
  quizId: number,
  answer: string
): Promise<GradeResponse | null> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throwAuthError();
  }

  const requestBody = JSON.stringify({ answer: String(answer) });
  const endpoints = [
    `/scenes/${encodeURIComponent(sceneId)}/quizzes/${encodeURIComponent(String(quizId))}/grade`,
    `/scenes/${encodeURIComponent(sceneId)}/quiz/${encodeURIComponent(String(quizId))}/grade`,
  ];

  for (const endpoint of endpoints) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: requestBody,
    });

    const responseText = await response.text();

    if (response.status === 401) {
      throwAuthError();
    }

    if (!response.ok) {
      continue;
    }

    const data = responseText ? JSON.parse(responseText) : null;
    if (data) {
      return data as GradeResponse;
    }
  }

  return null;
}
