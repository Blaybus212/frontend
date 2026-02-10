import type { SelectablePart } from '@/app/_components/3d/types';
import type { ObjectData } from '../types';

type SceneInfoShape = {
  title: string;
  engTitle: string;
  description: string;
  isSceneInformation?: boolean;
};

export const removeTrailingNumbers = (text: string) => text.replace(/\d+$/, '');

export const buildObjectDataFromPart = (part: SelectablePart): ObjectData => ({
  korean: part.originalName || part.nodeId,
  english: removeTrailingNumbers(part.nodeName),
  description: part.partDescription || '부품 설명이 없습니다.',
  materials: part.texture ? part.texture.split(',').map((m) => m.trim()) : [],
  applications: [],
});

export const buildObjectDataFromScene = (sceneInfo: SceneInfoShape): ObjectData => ({
  korean: sceneInfo.title,
  english: sceneInfo.engTitle,
  description: sceneInfo.description,
  isSceneInformation: sceneInfo.isSceneInformation,
});
