import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest, { params }: { params: Promise<{ sceneId: string }> }) {
  // Next.js 15: params를 await로 unwrap
  const { sceneId } = await params;

  // 1. 클라이언트가 보낸 Authorization 헤더 확인
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Authorization 헤더가 없으면 세션에서 토큰 가져오기
  if (!token) {
    const session = await auth();
    token = session?.accessToken as string | undefined;
  }

  // 3. 세션도 없으면 JWT 토큰 확인
  if (!token) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (secret) {
      const sessionToken = await getToken({ req: request, secret });
      token = sessionToken?.accessToken as string | undefined;
    }
  }

  if (!token) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') ?? 'both';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  
  const backendUrl = `${apiBaseUrl}/scenes/${encodeURIComponent(sceneId)}/viewer?target=${encodeURIComponent(target)}`;

  const response = await fetch(backendUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const errorText = await response.text();
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '백엔드 인증 실패', detail: errorText },
      { status: 401 }
    );
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
    },
  });
}
