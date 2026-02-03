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
  selectedModelIndex: number | null;
  selectedModelIndices?: number[]; // 다중 선택 지원
  onModelSelect: (index: number | null) => void;
  onModelSelectMultiple?: (indices: number[]) => void; // 다중 선택 콜백
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}
