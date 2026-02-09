/**
 * 조립/분해 훅
 *
 * 슬라이더 값에 따라 모델의 노드들을 조립/분해 상태로 이동시킵니다.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isSelectablePart } from '../utils/nodeSelection';

interface NodeDisassemblyData {
  /** 노드 참조 */
  node: THREE.Object3D;
  /** 초기 위치 (조립 상태) */
  initialPosition: THREE.Vector3;
  /** 초기 회전 (조립 상태) */
  initialRotation: THREE.Euler;
  /** 초기 스케일 (조립 상태) */
  initialScale: THREE.Vector3;
  /** 분해 방향 벡터 (정규화됨) */
  direction: THREE.Vector3;
  /** 분해 거리 (노드 크기에 비례) */
  distance: number;
}

interface UseAssemblyDisassemblyProps {
  /** 모델 그룹의 참조 맵 (인덱스 -> THREE.Group) */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
  /** 조립/분해 슬라이더 값 (0-100, 0=조립 상태, 100=분해 상태) */
  assemblyValue: number;
  /** TransformControls의 참조 (드래그 중인지 확인하기 위해) */
  transformControlsRef?: React.MutableRefObject<any>;
  /** 모델 참조 변경 트리거 */
  modelRefsVersion?: number;
}

interface UseAssemblyDisassemblyReturn {
  /** 현재 조립/분해 값 기준으로 위치를 초기 상태로 되돌림 */
  resetToAssembly: () => void;
}

/**
 * 슬라이더 값에 따라 모델의 노드를 조립/분해 상태로 이동시킵니다.
 *
 * - 0%: 초기 위치(조립)
 * - 100%: 분해 방향으로 이동
 */
export function useAssemblyDisassembly({
  modelRefs,
  assemblyValue,
  transformControlsRef,
  modelRefsVersion,
}: UseAssemblyDisassemblyProps): UseAssemblyDisassemblyReturn {
  const disassemblyDataRef = useRef<Map<number, NodeDisassemblyData[]>>(new Map());
  const analyzedRef = useRef<Map<number, boolean>>(new Map());
  const lastModelRefsVersionRef = useRef<number | undefined>(modelRefsVersion);

  /**
   * 모델을 분석해 분해 데이터(초기 위치/방향/거리)를 생성합니다.
   */
  const analyzeModel = (modelRef: THREE.Group, modelIndex: number) => {
    if (analyzedRef.current.get(modelIndex)) return; // 이미 분석됨

    // 모델이 완전히 로드되었는지 확인 (자식이 있어야 함)
    if (!modelRef || modelRef.children.length === 0) {
      return;
    }

    const nodes: NodeDisassemblyData[] = [];
    const origin = new THREE.Vector3(0, 0, 0);

    modelRef.updateMatrixWorld(true);
    
    modelRef.traverse((child) => {
      if (isSelectablePart(child)) {
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);
        
        const box = new THREE.Box3().setFromObject(child);
        if (!box.isEmpty()) {
          const size = box.getSize(new THREE.Vector3());
          const maxSize = Math.max(size.x, size.y, size.z);

          const nodeCenter = box.getCenter(new THREE.Vector3());
          const direction = new THREE.Vector3()
            .subVectors(nodeCenter, origin)
            .normalize();

          const distance = maxSize * 2;

        const initialLocalPosition = (child.userData?.initialPosition as THREE.Vector3 | undefined)?.clone()
          ?? child.position.clone();
        const initialLocalRotation = (child.userData?.initialRotation as THREE.Euler | undefined)?.clone()
          ?? child.rotation.clone();
        const initialLocalScale = (child.userData?.initialScale as THREE.Vector3 | undefined)?.clone()
          ?? child.scale.clone();

          nodes.push({
            node: child,
            initialPosition: initialLocalPosition, // 로컬 좌표로 저장
            initialRotation: initialLocalRotation,
            initialScale: initialLocalScale,
            direction: direction.length() > 0.0001 ? direction : new THREE.Vector3(1, 0, 0),
            distance,
          });
        }
      }
    });

    if (nodes.length > 0) {
      disassemblyDataRef.current.set(modelIndex, nodes);
      analyzedRef.current.set(modelIndex, true);
    }
  };

  const ensureAnalyzed = () => {
    modelRefs.current.forEach((modelRef, modelIndex) => {
      if (modelRef && !analyzedRef.current.get(modelIndex) && modelRef.children.length > 0) {
        analyzeModel(modelRef, modelIndex);
      }
    });
  };

  /** 슬라이더 값에 따라 노드를 이동시킵니다. */
  const applyDisassembly = (modelIndex: number, value: number) => {
    const nodes = disassemblyDataRef.current.get(modelIndex);
    if (!nodes || nodes.length === 0) return;

    const modelRef = modelRefs.current.get(modelIndex);
    if (!modelRef) return;

    modelRef.updateMatrixWorld(true);

    const factor = value / 100;

    nodes.forEach(({ node, initialPosition, initialRotation, initialScale, direction, distance }) => {
      const isUserModified = node.userData.isUserModified && node.userData.userModifiedPosition;
      const basePosition = isUserModified
        ? node.userData.userModifiedPosition.clone()
        : initialPosition.clone();
      const baseRotation = node.userData.isUserModified && node.userData.userModifiedRotation
        ? node.userData.userModifiedRotation.clone()
        : initialRotation.clone();
      const baseScale = node.userData.isUserModified && node.userData.userModifiedScale
        ? node.userData.userModifiedScale.clone()
        : initialScale.clone();
      
      if (node.parent) {
        const parentWorldMatrix = node.parent.matrixWorld.clone();
        const parentRotation = new THREE.Quaternion();
        parentWorldMatrix.decompose(new THREE.Vector3(), parentRotation, new THREE.Vector3());
        
        const localDirection = direction.clone().applyQuaternion(parentRotation.clone().invert());
        
        const offset = localDirection.multiplyScalar(distance * factor);
        const newLocalPosition = basePosition.clone().add(offset);
        
        node.position.copy(newLocalPosition);
      } else {
        const offset = direction.clone().multiplyScalar(distance * factor);
        const newPosition = basePosition.clone().add(offset);
        node.position.copy(newPosition);
      }

      node.rotation.copy(baseRotation);
      node.scale.copy(baseScale);
      
    });
  };

  /**
   * 현재 조립/분해 값 기준으로 모든 노드 위치를 초기 상태로 되돌립니다.
   */
  const resetToAssembly = () => {
    ensureAnalyzed();

    disassemblyDataRef.current.forEach((nodes, modelIndex) => {
      nodes.forEach(({ node }) => {
        node.userData.isUserModified = false;
        delete node.userData.userModifiedPosition;
        delete node.userData.userModifiedRotation;
        delete node.userData.userModifiedScale;
      });

      applyDisassembly(modelIndex, assemblyValue);
      const modelRef = modelRefs.current.get(modelIndex);
      if (modelRef) {
        modelRef.updateMatrixWorld(true);
      }
    });
  };

  /** 모델이 로드되면 분석을 수행합니다. */
  useEffect(() => {
    if (modelRefsVersion !== lastModelRefsVersionRef.current) {
      disassemblyDataRef.current.clear();
      analyzedRef.current.clear();
      lastModelRefsVersionRef.current = modelRefsVersion;
    }

    const analyzeAllModels = () => {
      ensureAnalyzed();
    };

    analyzeAllModels();

    const timeoutId1 = setTimeout(analyzeAllModels, 300);
    const timeoutId2 = setTimeout(analyzeAllModels, 1000);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [modelRefs, modelRefsVersion]);

  /** 슬라이더 값 변경에 따라 노드를 이동시킵니다. */
  useEffect(() => {
    if (modelRefsVersion !== lastModelRefsVersionRef.current) {
      disassemblyDataRef.current.clear();
      analyzedRef.current.clear();
      lastModelRefsVersionRef.current = modelRefsVersion;
    }

    modelRefs.current.forEach((modelRef, modelIndex) => {
      if (modelRef) {
        if (!analyzedRef.current.get(modelIndex) && modelRef.children.length > 0) {
          analyzeModel(modelRef, modelIndex);
        }
        applyDisassembly(modelIndex, assemblyValue);
      }
    });
  }, [assemblyValue, modelRefs, modelRefsVersion]);

  return { resetToAssembly };
}
