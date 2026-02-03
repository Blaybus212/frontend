/**
 * 3D 씬 관련 타입 정의
 */

export interface ObjectInfo {
  matrix: number[];
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  meshes: Array<{
    name: string;
    vertices: number;
    faces: number;
    material?: {
      name?: string;
      color?: string;
      metalness?: number;
      roughness?: number;
    };
  }>;
}

export interface Model {
  url: string;
  id: string;
  name?: string;
  nodeIndex?: number; // scene에서의 순서 인덱스
  nodePath?: string; // 노드를 찾기 위한 경로 (예: "0/1/2")
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface Transform {
  position?: { x?: number; y?: number; z?: number };
  rotation?: { x?: number; y?: number; z?: number };
  scale?: { x?: number; y?: number; z?: number };
}

export interface Scene3DRef {
  exportScene: () => void;
  updateObjectTransform: (transform: Transform) => void;
  setTransformMode: (mode: TransformMode) => void;
}

export interface SceneContentProps {
  models: Model[];
  selectedModelIndices: number[]; // 선택된 모델 인덱스 배열 (단일 선택 시 배열의 마지막 요소가 활성 인덱스)
  onModelSelect: (indices: number[]) => void; // 선택 변경 콜백 (항상 배열로 전달)
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}
