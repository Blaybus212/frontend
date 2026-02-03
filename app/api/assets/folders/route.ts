import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';

// 재귀적으로 하위 폴더에 모델 파일이 있는지 확인
async function hasModelFilesRecursive(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // 현재 폴더에 GLTF/GLB 파일이 있는지 확인
    const hasFiles = entries.some(entry => {
      if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        return lower.endsWith('.gltf') || lower.endsWith('.glb');
      }
      return false;
    });
    
    if (hasFiles) return true;
    
    // 하위 폴더 재귀 탐색
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = join(dirPath, entry.name);
        if (await hasModelFilesRecursive(subDirPath)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// 재귀적으로 폴더 탐색 (최상위 폴더 포함)
async function findFoldersWithFiles(dirPath: string, basePath: string = ''): Promise<Array<{ name: string; path: string }>> {
  const folders: Array<{ name: string; path: string }> = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const currentFolderName = basename(dirPath);
    const relativePath = basePath ? `${basePath}/${currentFolderName}` : currentFolderName;
    
    // 현재 폴더 또는 하위 폴더에 모델 파일이 있는지 확인
    const hasModels = await hasModelFilesRecursive(dirPath);
    
    // 모델 파일이 있으면 최상위 폴더도 추가
    if (hasModels) {
      folders.push({
        name: relativePath,
        path: `/Assets/${relativePath}`,
      });
    }
    
    // 하위 폴더 재귀 탐색 (개별 하위 폴더는 이미 위에서 처리됨)
    // 최상위 폴더만 반환하도록 하므로 하위 폴더는 별도로 추가하지 않음
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
      const entries = await readdir(assetsPath, { withFileTypes: true });
      const folders: Array<{ name: string; path: string }> = [];
      
      // Assets 폴더의 직접 하위 폴더들만 탐색
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = join(assetsPath, entry.name);
          // 해당 폴더 또는 하위 폴더에 모델 파일이 있는지 확인
          const hasModels = await hasModelFilesRecursive(folderPath);
          
          if (hasModels) {
            folders.push({
              name: entry.name,
              path: `/Assets/${entry.name}`,
            });
          }
        }
      }
      
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
