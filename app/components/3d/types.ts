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
