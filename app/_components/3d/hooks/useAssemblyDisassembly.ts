/**
 * 조립/분해 훅
 * 
 * 슬라이더 값에 따라 모델의 노드들을 조립/분해 상태로 이동시킵니다.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 노드의 초기 위치와 분해 방향을 저장하는 인터페이스
 */
interface NodeDisassemblyData {
  /** 노드 참조 */
  node: THREE.Object3D;
  /** 초기 위치 (조립 상태) */
  initialPosition: THREE.Vector3;
  /** 분해 방향 벡터 (정규화됨) */
  direction: THREE.Vector3;
  /** 분해 거리 (노드 크기에 비례) */
  distance: number;
}

/**
 * 조립/분해 훅의 Props 인터페이스
 */
interface UseAssemblyDisassemblyProps {
  /** 모델 그룹의 참조 맵 (인덱스 -> THREE.Group) */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
  /** 조립/분해 슬라이더 값 (0-100, 0=조립 상태, 100=분해 상태) */
  assemblyValue: number;
  /** TransformControls의 참조 (드래그 중인지 확인하기 위해) */
  transformControlsRef?: React.MutableRefObject<any>;
}

/**
 * 조립/분해 훅
 * 
 * 모델의 각 노드를 추출하고, 슬라이더 값에 따라 조립/분해 상태로 이동시킵니다.
 * 
 * **동작 방식:**
 * 1. 모델이 로드되면 모든 하위 노드(메시)를 추출
 * 2. 각 노드의 초기 위치를 저장
 * 3. 각 노드의 중심점을 기준으로 분해 방향 벡터 계산
 * 4. 슬라이더 값(0-100)에 따라 각 노드를 이동
 *    - 0%: 조립 상태 (초기 위치)
 *    - 100%: 분해 상태 (분해 방향으로 최대 거리만큼 이동)
 * 
 * @param props - 훅의 props
 * 
 * @example
 * ```tsx
 * useAssemblyDisassembly({
 *   modelRefs,
 *   assemblyValue: 50, // 50% 분해 상태
 * });
 * ```
 */
export function useAssemblyDisassembly({
  modelRefs,
  assemblyValue,
  transformControlsRef,
}: UseAssemblyDisassemblyProps) {
  /** 각 모델의 노드 분해 데이터를 저장하는 맵 (모델 인덱스 -> 노드 데이터 배열) */
  const disassemblyDataRef = useRef<Map<number, NodeDisassemblyData[]>>(new Map());
  /** 모델이 이미 분석되었는지 추적하는 맵 */
  const analyzedRef = useRef<Map<number, boolean>>(new Map());

  /**
   * 모델의 모든 하위 노드를 분석하여 분해 데이터를 생성합니다
   * 
   * 각 노드는 원점(0,0,0)에서 멀어지는 방향으로 분해됩니다.
   * 
   * @param modelRef - 분석할 모델 그룹
   * @param modelIndex - 모델 인덱스
   */
  const analyzeModel = (modelRef: THREE.Group, modelIndex: number) => {
    if (analyzedRef.current.get(modelIndex)) return; // 이미 분석됨

    // 모델이 완전히 로드되었는지 확인 (자식이 있어야 함)
    if (!modelRef || modelRef.children.length === 0) {
      return;
    }

    const nodes: NodeDisassemblyData[] = [];
    const origin = new THREE.Vector3(0, 0, 0); // 원점

    // 모든 노드를 찾아서 분해 데이터 생성
    modelRef.updateMatrixWorld(true); // 매트릭스 업데이트
    
    // 이름이 있거나 메시를 포함한 노드만 개별 부품으로 인식
    modelRef.traverse((child) => {
      const hasName = child.name && child.name.trim() !== '';
      const hasMesh = child instanceof THREE.Mesh || 
        (child.children.length > 0 && child.children.some(c => c instanceof THREE.Mesh));
      
      // 개별 부품 노드인 경우만 처리
      if (hasName || hasMesh) {
        // 노드의 월드 위치 계산
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);
        
        // 노드의 바운딩 박스 계산
        const box = new THREE.Box3().setFromObject(child);
        if (!box.isEmpty()) {
          const size = box.getSize(new THREE.Vector3());
          const maxSize = Math.max(size.x, size.y, size.z);

          // 원점에서 노드 중심으로의 벡터 (분해 방향)
          const nodeCenter = box.getCenter(new THREE.Vector3());
          const direction = new THREE.Vector3()
            .subVectors(nodeCenter, origin)
            .normalize();

          // 분해 거리 계산 (노드 크기에 비례)
          const distance = maxSize * 2; // 노드 크기의 2배

          // 초기 위치를 로컬 좌표로 저장
          const initialLocalPosition = child.position.clone();

          nodes.push({
            node: child,
            initialPosition: initialLocalPosition, // 로컬 좌표로 저장
            direction: direction.length() > 0.01 ? direction : new THREE.Vector3(1, 0, 0), // 방향이 없으면 기본 방향
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

  /**
   * 슬라이더 값에 따라 노드들을 이동시킵니다
   * 
   * 각 노드는 원점(0,0,0)에서 멀어지는 방향으로 이동합니다.
   * 
   * @param modelIndex - 모델 인덱스
   * @param value - 슬라이더 값 (0-100)
   */
  const applyDisassembly = (modelIndex: number, value: number) => {
    const nodes = disassemblyDataRef.current.get(modelIndex);
    if (!nodes || nodes.length === 0) return;

    const modelRef = modelRefs.current.get(modelIndex);
    if (!modelRef) return;

    // 모델의 매트릭스 업데이트
    modelRef.updateMatrixWorld(true);

    const factor = value / 100; // 0.0 (조립) ~ 1.0 (분해)

    nodes.forEach(({ node, initialPosition, direction, distance }) => {
      // 사용자가 TransformControls로 변경한 위치가 있으면 그 위치를 기준으로 분해
      // 없으면 초기 위치를 기준으로 분해
      const isUserModified = node.userData.isUserModified && node.userData.userModifiedPosition;
      const basePosition = isUserModified
        ? node.userData.userModifiedPosition.clone()
        : initialPosition.clone();
      
      // 원점(0,0,0)에서 멀어지는 방향으로 이동
      // 분해 방향을 로컬 공간으로 변환
      if (node.parent) {
        // 부모의 월드 매트릭스를 사용하여 방향 벡터를 로컬 공간으로 변환
        const parentWorldMatrix = node.parent.matrixWorld.clone();
        const parentRotation = new THREE.Quaternion();
        parentWorldMatrix.decompose(new THREE.Vector3(), parentRotation, new THREE.Vector3());
        
        // 방향 벡터를 부모의 회전에 맞춰 로컬 공간으로 변환
        const localDirection = direction.clone().applyQuaternion(parentRotation.clone().invert());
        
        // 기준 위치에서 분해 방향으로 이동
        const offset = localDirection.multiplyScalar(distance * factor);
        const newLocalPosition = basePosition.clone().add(offset);
        
        node.position.copy(newLocalPosition);
      } else {
        // 부모가 없으면 직접 이동
        const offset = direction.clone().multiplyScalar(distance * factor);
        const newPosition = basePosition.clone().add(offset);
        node.position.copy(newPosition);
      }
      
    });
  };

  /**
   * 모델이 변경되면 분석을 다시 수행합니다
   * 모델이 완전히 로드된 후에 분석하도록 약간의 지연을 둡니다
   */
  useEffect(() => {
    const analyzeAllModels = () => {
      // 모든 모델 분석
      modelRefs.current.forEach((modelRef, modelIndex) => {
        if (modelRef && !analyzedRef.current.get(modelIndex)) {
          // 모델이 완전히 로드되었는지 확인
          if (modelRef.children.length > 0) {
            analyzeModel(modelRef, modelIndex);
          }
        }
      });
    };

    // 즉시 시도
    analyzeAllModels();

    // 모델 로드 후 재시도 (지연)
    const timeoutId1 = setTimeout(analyzeAllModels, 300);
    const timeoutId2 = setTimeout(analyzeAllModels, 1000); // 추가 재시도

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [modelRefs]);

  /**
   * 슬라이더 값이 변경되면 노드들을 이동시킵니다
   * TransformControls가 드래그 중일 때는 실행하지 않습니다
   */
  useEffect(() => {
    // TransformControls가 드래그 중이면 분해 로직을 실행하지 않음
    if (transformControlsRef?.current?.dragging) {
      return;
    }
    
    // 모든 모델에 대해 분해 적용
    modelRefs.current.forEach((modelRef, modelIndex) => {
      if (modelRef) {
        // 모델이 아직 분석되지 않았으면 분석 시도
        if (!analyzedRef.current.get(modelIndex) && modelRef.children.length > 0) {
          analyzeModel(modelRef, modelIndex);
        }
        // 분해 적용
        applyDisassembly(modelIndex, assemblyValue);
      }
    });
  }, [assemblyValue, modelRefs, transformControlsRef]);
}
