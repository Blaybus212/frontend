import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * 모델 목록 API 라우트
 * 
 * public/Assets 폴더에서 OBJ 및 GLB 파일 목록을 읽어 반환합니다.
 * 
 * @route GET /api/models
 * @returns {Promise<NextResponse>} 모델 파일 목록을 포함한 JSON 응답
 * 
 * 응답 형식:
 * {
 *   models: [
 *     {
 *       name: string,      // 파일명에서 확장자 제거 후 언더스코어를 공백으로 변환
 *       path: string,      // /Assets/파일명 형식의 경로
 *       filename: string,   // 원본 파일명
 *       type: 'glb' | 'obj' // 파일 형식
 *     }
 *   ]
 * }
 * 
 * @example
 * GET /api/models
 * Response: {
 *   models: [
 *     { name: "Wolf Blender 2.82a", path: "/Assets/Wolf-Blender-2.82a.glb", filename: "Wolf-Blender-2.82a.glb", type: "glb" }
 *   ]
 * }
 */
export async function GET() {
  try {
    /**
     * Assets 폴더 경로 생성
     * process.cwd()는 Next.js 프로젝트의 루트 디렉토리를 반환합니다.
     */
    const assetsPath = join(process.cwd(), 'public', 'Assets');
    
    /**
     * Assets 폴더의 모든 파일 읽기
     * readdir은 비동기적으로 디렉토리 내용을 읽습니다.
     */
    const files = await readdir(assetsPath);
    
    /**
     * OBJ 및 GLB 파일 필터링 및 변환
     * 
     * 처리 과정:
     * 1. 파일명을 소문자로 변환하여 확장자 확인
     * 2. .obj 또는 .glb 확장자를 가진 파일만 필터링
     * 3. 각 파일을 모델 객체로 변환
     *    - name: 파일명에서 확장자 제거 후 언더스코어를 공백으로 변환
     *    - path: /Assets/파일명 형식의 경로
     *    - filename: 원본 파일명
     *    - type: 파일 형식 ('glb' 또는 'obj')
     * 4. 이름순으로 정렬
     */
    const modelFiles = files
      .filter((file) => {
        const lower = file.toLowerCase();
        return lower.endsWith('.obj') || lower.endsWith('.glb');
      })
      .map((file) => {
        const lower = file.toLowerCase();
        const extension = lower.endsWith('.glb') ? '.glb' : '.obj';
        return {
          name: file.replace(extension, '').replace(/_/g, ' '),
          path: `/Assets/${file}`,
          filename: file,
          type: extension === '.glb' ? 'glb' : 'obj',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models: modelFiles });
  } catch (error) {
    /**
     * 에러 처리
     * 파일 읽기 실패 시 500 에러와 함께 에러 메시지를 반환합니다.
     */
    console.error('모델 목록 읽기 실패:', error);
    return NextResponse.json(
      { error: '모델 목록을 읽을 수 없습니다.' },
      { status: 500 }
    );
  }
}

