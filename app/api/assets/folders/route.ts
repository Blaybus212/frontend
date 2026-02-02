import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';

// 재귀적으로 폴더 탐색
async function findFoldersWithFiles(dirPath: string, basePath: string = ''): Promise<Array<{ name: string; path: string }>> {
  const folders: Array<{ name: string; path: string }> = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // 현재 폴더에 GLTF/GLB 파일이 있는지 확인
    const hasModelFiles = entries.some(entry => {
      if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        return lower.endsWith('.gltf') || lower.endsWith('.glb');
      }
      return false;
    });
    
    // 모델 파일이 있는 폴더만 추가
    if (hasModelFiles) {
      const relativePath = basePath ? `${basePath}/${basename(dirPath)}` : basename(dirPath);
      folders.push({
        name: relativePath,
        path: `/Assets/${relativePath}`,
      });
    }
    
    // 하위 폴더 재귀 탐색
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = join(dirPath, entry.name);
        const subBasePath = basePath ? `${basePath}/${basename(dirPath)}` : basename(dirPath);
        const subFolders = await findFoldersWithFiles(subDirPath, subBasePath);
        folders.push(...subFolders);
      }
    }
  } catch (error) {
    // 폴더 접근 권한 없음 등 무시
  }
  
  return folders;
}

export async function GET() {
  try {
    const assetsPath = join(process.cwd(), 'public', 'Assets');
    
    // Assets 폴더가 없으면 빈 배열 반환
    try {
      const folders = await findFoldersWithFiles(assetsPath);
      return NextResponse.json({ folders });
    } catch (error) {
      // 폴더가 없으면 빈 배열 반환
      return NextResponse.json({ folders: [] });
    }
  } catch (error) {
    console.error('Error reading assets folders:', error);
    return NextResponse.json({ error: 'Failed to read folders' }, { status: 500 });
  }
}
