'use server';

import { $fetch } from '@/app/_utils/fetch';
import { auth } from '@/auth';

/**
 * AI 대화 전용 fetch 함수 (response.json()을 한 번만 호출)
 */
async function conversationFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  console.log('🔵 conversationFetch:', {
    url: `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    method: options.method || 'GET',
    hasBody: !!options.body,
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log('📥 conversationFetch 응답:', {
    status: response.status,
    ok: response.ok,
  });

  if (response.status === 401) {
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
    throw new Error(`API 요청 실패 (${response.status}): ${errorData.message}`);
  }

  // ✅ response.json()을 한 번만 호출
  const data = await response.json();
  console.log('✅ conversationFetch 데이터:', data);
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
    throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/scenes/${encodeURIComponent(sceneId)}/viewer?target=${encodeURIComponent(target)}`;
  
  console.log('🟢 fetchZipData 토큰:', token);
  console.log('📦 fetchZipData - 서버 액션 실행:', {
    url,
    hasToken: !!token,
    tokenPreview: token.substring(0, 20) + '...',
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store', // 캐시 비활성화 - 항상 최신 데이터 가져오기
    next: { revalidate: 0 }, // Next.js 캐시도 비활성화
  });

  console.log('📡 백엔드 응답:', {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
  });

  if (response.status === 401) {
    const errorText = await response.text();
    console.error('❌ 인증 오류:', errorText);
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
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
    throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
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
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  return response.json();
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
 * 메시지 전송
 */
export async function sendMessage(
  sceneId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  console.log('🚀 sendMessage 호출:', { sceneId, request });
  
  const response = await conversationFetch<SendMessageResponse>(`/scenes/${encodeURIComponent(sceneId)}/conversation/messages`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  
  console.log('✅ sendMessage 응답:', response);
  return response;
}
