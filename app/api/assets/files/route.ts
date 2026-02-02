import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get('folder');

    if (!folderName) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // 중첩된 경로 지원 (예: "Drone/Arm")
    const folderPath = join(process.cwd(), 'public', 'Assets', ...folderName.split('/'));
    
    try {
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
    } catch (error) {
      console.error('Error reading folder:', error);
      return NextResponse.json({ files: [] });
    }
  } catch (error) {
    console.error('Error reading assets files:', error);
    return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
  }
}
