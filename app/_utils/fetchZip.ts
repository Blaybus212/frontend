/**
 * [fetchZip 유틸리티]
 * ZIP 바이너리 요청 전용 - Next.js API Route를 통해 간접 호출
 */
export async function fetchZip(url: string): Promise<Blob> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  return response.blob();
}
