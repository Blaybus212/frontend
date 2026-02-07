/**
 * 3D 씬 관련 타입 정의
 * 
 * 이 파일은 3D 씬 컴포넌트에서 사용하는 모든 타입과 인터페이스를 정의합니다.
 */

/**
 * 3D 객체의 정보를 담는 인터페이스
 * 
 * 객체의 변환 정보(위치, 회전, 스케일, 매트릭스)와 메시 정보를 포함합니다.
 */
export interface ObjectInfo {
  /** 4x4 변환 매트릭스 (16개 요소 배열, 행 우선 순서) */
  matrix: number[];
  /** 객체의 위치 (X, Y, Z 좌표) */
  position: { x: number; y: number; z: number };
  /** 객체의 회전 (X, Y, Z 축 회전 각도, 도 단위) */
  rotation: { x: number; y: number; z: number };
  /** 객체의 스케일 (X, Y, Z 축 크기 비율) */
  scale: { x: number; y: number; z: number };
  /** 객체에 포함된 모든 메시 정보 배열 */
  meshes: Array<{
    /** 메시 이름 */
    name: string;
    /** 정점(vertex) 수 */
    vertices: number;
    /** 면(face) 수 (삼각형 기준) */
    faces: number;
    /** 재질 정보 (선택적) */
    material?: {
      /** 재질 이름 */
      name?: string;
      /** 색상 (16진수 문자열, 예: "#FF0000") */
      color?: string;
      /** 금속성 (0~1, 0=비금속, 1=금속) */
      metalness?: number;
      /** 거칠기 (0~1, 0=매끄러움, 1=거침) */
      roughness?: number;
    };
  }>;
}

/**
 * 3D 모델의 메타데이터 인터페이스
 * 
 * GLTF 파일에서 추출한 노드 정보를 담습니다.
 */
export interface Model {
  /** GLTF/GLB 파일의 URL 경로 */
  url: string;
  /** 모델의 고유 ID */
  id: string;
  /** 모델 이름 (선택적) */
  name?: string;
  /** scene에서의 순서 인덱스 (하위 호환성, nodePath 우선 사용) */
  nodeIndex?: number;
  /** 노드를 찾기 위한 경로 (예: "0/1/2" - scene의 첫 번째 자식의 두 번째 자식의 세 번째 자식) */
  nodePath?: string;
}

/**
 * TransformControls의 변환 모드 타입
 * 
 * 객체를 조작하는 방법을 나타냅니다.
 */
export type TransformMode = 
  /** 이동 모드: 객체의 위치를 변경 */
  | 'translate' 
  /** 회전 모드: 객체를 회전 */
  | 'rotate' 
  /** 스케일 모드: 객체의 크기를 변경 */
  | 'scale';

/**
 * 객체 변환 정보 인터페이스
 * 
 * 객체의 위치, 회전, 스케일을 업데이트할 때 사용합니다.
 * 각 속성은 선택적이며, 제공된 값만 업데이트됩니다.
 */
export interface Transform {
  /** 위치 정보 (선택적, 각 축도 선택적) */
  position?: { x?: number; y?: number; z?: number };
  /** 회전 정보 (선택적, 도 단위, 각 축도 선택적) */
  rotation?: { x?: number; y?: number; z?: number };
  /** 스케일 정보 (선택적, 각 축도 선택적) */
  scale?: { x?: number; y?: number; z?: number };
}

/**
 * 씬 상태 정보 인터페이스 (서버에 전송할 전체 데이터)
 */
export interface SceneState {
  /** 노드 변환 정보 배열 */
  nodeTransforms: Array<{
    nodeId: string;
    nodeName: string;
    modelIndex: number;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    matrix: number[];
  }>;
  /** 카메라 시점 정보 */
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  /** 조립/분해 값 (0-100) */
  assemblyValue: number;
}

/**
 * Scene3D 컴포넌트의 ref 인터페이스
 * 
 * 부모 컴포넌트에서 Scene3D의 메서드에 접근하기 위한 인터페이스입니다.
 */
export interface Scene3DRef {
  /** 씬을 GLTF/GLB 파일로 내보내는 함수 */
  exportScene: () => void;
  /** 선택된 객체의 변환을 업데이트하는 함수 */
  updateObjectTransform: (transform: Transform) => void;
  /** TransformControls의 변환 모드를 설정하는 함수 */
  setTransformMode: (mode: TransformMode) => void;
  /** 현재 씬 상태를 추출하여 반환하는 함수 (서버 전송용) */
  getSceneState: () => SceneState | null;
  /** 현재 조립/분해 값 기준으로 위치를 초기 상태로 되돌리는 함수 */
  resetToAssembly: () => void;
  /** 선택 가능한 부품 목록을 반환합니다 */
  getSelectableParts: () => SelectablePart[];
  /** nodeId 목록으로 선택 상태를 설정합니다 */
  setSelectedNodeIds: (nodeIds: string[]) => void;
  /** 카메라를 한 단계 확대합니다 */
  zoomIn: () => void;
  /** 카메라를 한 단계 축소합니다 */
  zoomOut: () => void;
  /** 부품 스냅샷 이미지를 생성합니다 */
  capturePartSnapshot: (nodeId: string) => Promise<string | null>;
  /** 모델 전체 스냅샷 이미지를 생성합니다 */
  captureModelSnapshot: (modelId: string) => Promise<string | null>;
  /** 모델 루트 이름을 반환합니다 */
  getModelRootName: () => string | null;
}

/**
 * 선택 가능한 부품 정보
 */
export interface SelectablePart {
  nodeId: string;
  nodeName: string;
  modelIndex: number;
}

/**
 * SceneContent 컴포넌트의 props 인터페이스
 * 
 * SceneContent 컴포넌트에 전달되는 모든 속성을 정의합니다.
 */
export interface SceneContentProps {
  /** 렌더링할 모델 배열 */
  models: Model[];
  /** 선택된 모델 인덱스 배열 (단일 선택 시 배열의 마지막 요소가 활성 인덱스) */
  selectedModelIndices: number[];
  /** 모델 선택이 변경될 때 호출되는 콜백 함수 (항상 배열로 전달) */
  onModelSelect: (indices: number[]) => void;
  /** 선택된 노드 id가 변경될 때 호출되는 콜백 함수 */
  onSelectedNodeIdsChange?: (nodeIds: string[]) => void;
  /** 선택된 객체의 정보가 변경될 때 호출되는 콜백 함수 (선택적) */
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
  /** 조립/분해 슬라이더 값 (0-100, 0=조립 상태, 100=분해 상태) */
  assemblyValue?: number;
}
