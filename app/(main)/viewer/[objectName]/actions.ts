'use server';

import { $fetch } from '@/app/_utils/fetch';
import { auth } from '@/auth';

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
