/**
 * 노드 변환 정보 저장 유틸리티
 * 
 * 사용자가 변경한 노드의 위치, 회전, 스케일 정보를 저장하고
 * 나중에 서버에 전송할 수 있도록 합니다.
 */

import * as THREE from 'three';

/**
 * 노드 변환 정보 인터페이스
 */
export interface NodeTransformData {
  /** 노드 ID (userData.nodeId) */
  nodeId: string;
  /** 노드 이름 */
  nodeName: string;
  /** 모델 인덱스 */
  modelIndex: number;
  /** 위치 (로컬 좌표계) */
  position: { x: number; y: number; z: number };
  /** 회전 (오일러 각도, 도 단위) */
  rotation: { x: number; y: number; z: number };
  /** 스케일 */
  scale: { x: number; y: number; z: number };
  /** 4x4 변환 매트릭스 (16개 요소 배열) */
  matrix: number[];
}

/**
 * 카메라 시점 정보 인터페이스
 */
export interface CameraState {
  /** 카메라 위치 */
  position: { x: number; y: number; z: number };
  /** 카메라 타겟 (OrbitControls target) */
  target: { x: number; y: number; z: number };
}

/**
 * 씬 상태 정보 인터페이스 (서버에 전송할 전체 데이터)
 */
export interface SceneState {
  /** 노드 변환 정보 배열 */
  nodeTransforms: NodeTransformData[];
  /** 카메라 시점 정보 */
  camera: CameraState;
  /** 조립/분해 값 (0-100) */
  assemblyValue: number;
}

/**
 * 모든 노드의 변환 정보를 추출합니다
 * 
 * @param modelRefs - 모델 참조 맵
 * @returns 노드 변환 정보 배열
 */
export function extractAllNodeTransforms(
  modelRefs: Map<number, THREE.Group>
): NodeTransformData[] {
  const transforms: NodeTransformData[] = [];
  
  modelRefs.forEach((modelRef, modelIndex) => {
    if (!modelRef) return;
    
    modelRef.traverse((node) => {
      // 선택 가능한 노드만 추출 (userData에 nodeId가 있는 노드)
      if (node.userData && node.userData.nodeId && node.userData.selectable === true) {
        // 사용자가 수정한 위치가 있으면 그것을 사용, 없으면 현재 위치 사용
        const position = node.userData.isUserModified && node.userData.userModifiedPosition
          ? node.userData.userModifiedPosition.clone()
          : node.position.clone();
        
        const rotation = node.userData.isUserModified && node.userData.userModifiedRotation
          ? node.userData.userModifiedRotation.clone()
          : node.rotation.clone();
        
        const scale = node.userData.isUserModified && node.userData.userModifiedScale
          ? node.userData.userModifiedScale.clone()
          : node.scale.clone();
        
        // 매트릭스 계산
        const tempObject = new THREE.Object3D();
        tempObject.position.copy(position);
        tempObject.rotation.copy(rotation);
        tempObject.scale.copy(scale);
        tempObject.updateMatrix();
        const matrix = tempObject.matrix.toArray();
        
        transforms.push({
          nodeId: node.userData.nodeId,
          nodeName: node.userData.nodeName || node.name || '',
          modelIndex: modelIndex,
          position: { x: position.x, y: position.y, z: position.z },
          rotation: {
            x: THREE.MathUtils.radToDeg(rotation.x),
            y: THREE.MathUtils.radToDeg(rotation.y),
            z: THREE.MathUtils.radToDeg(rotation.z),
          },
          scale: { x: scale.x, y: scale.y, z: scale.z },
          matrix: matrix,
        });
      }
    });
  });
  
  return transforms;
}

/**
 * 카메라 상태를 추출합니다
 * 
 * @param camera - Three.js 카메라 객체
 * @param orbitControlsTarget - OrbitControls의 타겟 위치
 * @returns 카메라 상태 정보
 */
export function extractCameraState(
  camera: THREE.Camera,
  orbitControlsTarget?: THREE.Vector3
): CameraState {
  return {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    },
    target: orbitControlsTarget
      ? { x: orbitControlsTarget.x, y: orbitControlsTarget.y, z: orbitControlsTarget.z }
      : { x: 0, y: 0, z: 0 },
  };
}

/**
 * 전체 씬 상태를 추출합니다
 * 
 * @param modelRefs - 모델 참조 맵
 * @param camera - Three.js 카메라 객체
 * @param orbitControlsTarget - OrbitControls의 타겟 위치
 * @param assemblyValue - 조립/분해 값 (0-100)
 * @returns 씬 상태 정보
 */
export function extractSceneState(
  modelRefs: Map<number, THREE.Group>,
  camera: THREE.Camera,
  orbitControlsTarget?: THREE.Vector3,
  assemblyValue: number = 0
): SceneState {
  return {
    nodeTransforms: extractAllNodeTransforms(modelRefs),
    camera: extractCameraState(camera, orbitControlsTarget),
    assemblyValue: assemblyValue,
  };
}

/**
 * 로컬 스토리지에 씬 상태를 저장합니다
 * 
 * @param sceneState - 저장할 씬 상태
 * @param key - 저장 키 (기본값: 'scene3d_state')
 */
export function saveSceneStateToLocalStorage(
  sceneState: SceneState,
  key: string = 'scene3d_state'
): void {
  try {
    const json = JSON.stringify(sceneState);
    localStorage.setItem(key, json);
  } catch (error) {
    console.error('Failed to save scene state to localStorage:', error);
  }
}

/**
 * 로컬 스토리지에서 씬 상태를 불러옵니다
 * 
 * @param key - 저장 키 (기본값: 'scene3d_state')
 * @returns 씬 상태 정보 또는 null
 */
export function loadSceneStateFromLocalStorage(
  key: string = 'scene3d_state'
): SceneState | null {
  try {
    const json = localStorage.getItem(key);
    if (!json) return null;
    return JSON.parse(json) as SceneState;
  } catch (error) {
    console.error('Failed to load scene state from localStorage:', error);
    return null;
  }
}
