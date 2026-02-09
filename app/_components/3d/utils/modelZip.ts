'use client';

import JSZip from 'jszip';
import * as THREE from 'three';

interface ZipManifestFile {
  filename: string;
  type: 'model' | 'texture' | 'metadata';
  size: number;
}

interface ZipManifest {
  files: ZipManifestFile[];
}

interface ModelZipResult {
  defaultUrl: string | null;
  customUrl: string | null;
  revoke: () => void;
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
  apiBaseUrl: string;
  accessToken: string;
  sceneId: string;
  target?: 'both' | 'default' | 'custom';
  signal?: AbortSignal;
}): Promise<ModelZipResult> {
  const { apiBaseUrl, accessToken, sceneId, target = 'both', signal } = params;
  const response = await fetch(
    `${apiBaseUrl}/scenes/${encodeURIComponent(sceneId)}/viewer?target=${target}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`viewer 모델 다운로드 실패 (${response.status})`);
  }

  const zipBlob = await response.blob();
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

  setUrlMap(urlMap);

  return {
    defaultUrl,
    customUrl,
    revoke: () => {
      revokeUrls.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}
