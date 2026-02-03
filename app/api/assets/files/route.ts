import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

// 재귀적으로 모든 하위 폴더의 GLTF/GLB 파일 찾기
async function findModelFilesRecursive(dirPath: string, basePath: string = ''): Promise<Array<{ name: string; path: string; type: 'gltf' | 'glb' }>> {
  const files: Array<{ name: string; path: string; type: 'gltf' | 'glb' }> = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // 현재 폴더의 파일들
    for (const entry of entries) {
      if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.gltf') || lower.endsWith('.glb')) {
          const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
          files.push({
            name: entry.name,
            path: `/Assets/${relativePath}`,
            type: lower.endsWith('.glb') ? 'glb' : 'gltf',
          });
        }
      }
    }
    
    // 하위 폴더 재귀 탐색
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = join(dirPath, entry.name);
        const subBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
        const subFiles = await findModelFilesRecursive(subDirPath, subBasePath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    // 폴더 접근 권한 없음 등 무시
  }
  
  return files;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get('folder');
    const recursive = searchParams.get('recursive') === 'true';

    if (!folderName) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // 중첩된 경로 지원 (예: "Drone/Arm")
    const folderPath = join(process.cwd(), 'public', 'Assets', ...folderName.split('/'));
    
    try {
      if (recursive) {
        // 재귀적으로 모든 하위 폴더의 파일 가져오기
        const files = await findModelFilesRecursive(folderPath, folderName);
        return NextResponse.json({ files });
      } else {
        // 현재 폴더만 탐색
        const entries = await readdir(folderPath, { withFileTypes: true });
        const allFiles = entries
          .filter(entry => entry.isFile())
          .map(entry => entry.name);
        
        // GLTF와 GLB 파일 필터링 (.bin 파일은 제외 - .gltf 파일과 함께 자동으로 로드됨)
        const modelFiles = allFiles.filter(file => {
          const lower = file.toLowerCase();
          return lower.endsWith('.gltf') || lower.endsWith('.glb');
        });
        
        const files = modelFiles.map(name => ({
          name: name,
          path: `/Assets/${folderName}/${name}`,
          type: name.toLowerCase().endsWith('.glb') ? 'glb' : 'gltf',
        }));
        
        return NextResponse.json({ files });
      }
    } catch (error) {
      console.error('Error reading folder:', error);
      return NextResponse.json({ files: [] });
    }
  } catch (error) {
    console.error('Error reading assets files:', error);
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
  }
}
