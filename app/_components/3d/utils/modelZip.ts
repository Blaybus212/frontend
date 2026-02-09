'use client';

import JSZip from 'jszip';
import * as THREE from 'three';
import { fetchZipData } from '@/app/(main)/viewer/[objectName]/actions';

interface ZipManifestFile {
  filename: string;
  type: 'model' | 'texture' | 'metadata';
  size: number;
}

interface ZipManifest {
  files?: ZipManifestFile[];
  default?: string;
  custom?: string;
}

interface ModelZipResult {
  defaultUrl: string | null;
  customUrl: string | null;
  revoke: () => void;
  parts: Array<{
    nodeId: string;
    nodeName: string;
    originalName?: string;
  }>;
  modelName: string;
}

let currentUrlMap: Map<string, string> | null = null;
let urlModifierInstalled = false;

const ensureUrlModifier = () => {
  if (urlModifierInstalled) return;
  THREE.DefaultLoadingManager.setURLModifier((url) => {
    if (!currentUrlMap) return url;
    const clean = url.split('?')[0] ?? url;
    const base = clean.split('/').pop() ?? clean;
    return currentUrlMap.get(clean) ?? currentUrlMap.get(base) ?? url;
  });
  urlModifierInstalled = true;
};

const setUrlMap = (map: Map<string, string>) => {
  currentUrlMap = map;
  ensureUrlModifier();
};

const getMimeType = (filename: string) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.gltf')) return 'model/gltf+json';
  if (lower.endsWith('.glb')) return 'model/gltf-binary';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bin')) return 'application/octet-stream';
  return 'application/octet-stream';
};

export async function downloadAndExtractModelZip(params: {
  sceneId: string;
  target?: 'both' | 'default' | 'custom';
  signal?: AbortSignal;
}): Promise<ModelZipResult> {
  const { sceneId, target = 'both' } = params;
  // 서버 액션으로 ZIP 데이터 가져오기
  const { data: zipArrayBuffer, filename: zipFilename } = await fetchZipData(sceneId, target);
  
  // ArrayBuffer를 Blob으로 변환
  const zipBlob = new Blob([zipArrayBuffer], { type: 'application/zip' });
  const zip = await JSZip.loadAsync(zipBlob);
  
  const manifestText = await zip.file('manifest.json')?.async('text');
  if (!manifestText) {
    throw new Error('manifest.json을 찾을 수 없습니다.');
  }
  
  const manifest = JSON.parse(manifestText) as ZipManifest;
  
  const urlMap = new Map<string, string>();
  const revokeUrls: string[] = [];

  let defaultUrl: string | null = null;
  let customUrl: string | null = null;
  let parts: Array<{ nodeId: string; nodeName: string }> = [];
  const logGltfMatrices = (label: string, gltfData: any) => {
    if (!gltfData?.nodes) return;
    const nodes = gltfData.nodes.map((node: any, index: number) => ({
      index,
      name: node.name || `Node_${index}`,
      matrix: node.matrix ?? null,
      translation: node.translation ?? null,
      rotation: node.rotation ?? null,
      scale: node.scale ?? null,
    }));
    console.log('🧩 [gltf matrices]', { label, count: nodes.length, nodes });
  };

  // 새로운 형식: { default: "default.gltf", custom: "custom.gltf" }
  if (manifest.default || manifest.custom) {
    // ZIP의 모든 파일을 처리
    const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
    
    for (const filename of fileNames) {
      if (filename === 'manifest.json') continue;
      
      const file = zip.file(filename);
      if (!file) continue;
      
      // GLTF 파일이면 부품 정보 추출
      if (filename.endsWith('.gltf')) {
        const text = await file.async('text');
        try {
          const gltfData = JSON.parse(text);
          
          // custom.gltf에서 부품 정보 추출
          if (manifest.custom && filename === manifest.custom && gltfData.nodes) {
            parts = gltfData.nodes
              .map((node: any, index: number) => ({
                nodeId: String(index),
                nodeName: node.extras?.description || node.name || `Node_${index}`,
                originalName: node.name,
              }))
              .filter((part: any) => !part.originalName?.includes('Solid'));
          }
          if (manifest.default && filename === manifest.default) {
            logGltfMatrices('default', gltfData);
          }
          if (manifest.custom && filename === manifest.custom) {
            logGltfMatrices('custom', gltfData);
          }
        } catch (e) {
          console.error(`GLTF 파싱 실패:`, e);
        }
      }
      
      const buffer = await file.async('arraybuffer');
      const blob = new Blob([buffer], { type: getMimeType(filename) });
      const url = URL.createObjectURL(blob);
      revokeUrls.push(url);
      urlMap.set(filename, url);
      
      const base = filename.split('/').pop();
      if (base) urlMap.set(base, url);

      // default/custom URL 매핑
      if (manifest.default && filename === manifest.default) {
        defaultUrl = url;
      }
      if (manifest.custom && filename === manifest.custom) {
        customUrl = url;
      }
    }
  }
  // 기존 형식: { files: [...] }
  else if (Array.isArray(manifest.files)) {
    for (const entry of manifest.files) {
    const file = zip.file(entry.filename);
    if (!file) continue;
    const buffer = await file.async('arraybuffer');
    const blob = new Blob([buffer], { type: getMimeType(entry.filename) });
    const url = URL.createObjectURL(blob);
    revokeUrls.push(url);
    urlMap.set(entry.filename, url);
    const base = entry.filename.split('/').pop();
    if (base) urlMap.set(base, url);

    const lower = entry.filename.toLowerCase();
    if (lower === 'default.gltf' || lower === 'default.glb') {
      defaultUrl = url;
    } else if (lower === 'custom.gltf' || lower === 'custom.glb') {
      customUrl = url;
    }
  }
  } else {
    throw new Error('manifest.json 형식이 올바르지 않습니다.');
  }

  setUrlMap(urlMap);

  // ZIP 파일명에서 모델 이름 추출 (.zip 확장자 제거)
  const modelName = zipFilename ? zipFilename.replace('.zip', '') : `모델_${sceneId}`;

  return {
    defaultUrl,
    customUrl,
    parts,
    modelName,
    revoke: () => {
      revokeUrls.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}
