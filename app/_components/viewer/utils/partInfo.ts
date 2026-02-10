import type { SelectablePart } from '@/app/_components/3d/types';
import type { ObjectData } from '../types';

interface SceneInfoShape {
  title: string;
  engTitle: string;
  description: string;
  isSceneInformation?: boolean;
}

/** 문자열 끝 숫자 제거 (예: "Link1" → "Link") */
export const removeTrailingNumbers = (text: string) => text.replace(/\d+$/, '');

/** 부품 → ObjectData 변환 */
export const buildObjectDataFromPart = (part: SelectablePart): ObjectData => ({
  korean: part.originalName || part.nodeId,
  english: removeTrailingNumbers(part.nodeName),
  description: part.partDescription || '부품 설명이 없습니다.',
  materials: part.texture ? part.texture.split(',').map((m) => m.trim()) : [],
  applications: [],
  isSceneInformation: false,
});

/** 씬 정보 → ObjectData 변환 */
export const buildObjectDataFromScene = (sceneInfo: SceneInfoShape): ObjectData => ({
  korean: sceneInfo.title,
  english: sceneInfo.engTitle,
  description: sceneInfo.description,
  isSceneInformation: true,
});
