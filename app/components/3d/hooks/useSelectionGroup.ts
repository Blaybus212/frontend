/**
 * 다중 선택 그룹 관리 훅
 * 
 * 여러 객체가 선택되었을 때, 이들을 하나의 그룹으로 관리하여
 * 함께 이동, 회전, 스케일 조작이 가능하도록 합니다.
 * 선택된 객체들의 중심점을 계산하고, 각 객체의 상대 위치를 저장합니다.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * useSelectionGroup 훅의 매개변수 인터페이스
 */
interface UseSelectionGroupProps {
  /** 선택된 모델의 인덱스 배열 */
  selectedIndices: number[];
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
  /** Three.js 씬 객체 */
  scene: THREE.Scene;
}

/**
 * 다중 선택된 객체들을 그룹으로 관리하는 훅
 * 
 * 이 훅은 다음과 같은 작업을 수행합니다:
 * 1. 선택된 객체가 2개 이상일 때 그룹을 생성합니다
 * 2. 선택된 객체들의 중심점을 계산합니다
 * 3. 각 객체의 그룹 중심점으로부터의 상대 위치를 저장합니다
 * 4. 각 객체의 초기 회전(쿼터니언)과 스케일을 저장합니다
 * 
 * 단일 선택 시에는 그룹을 제거하고 저장된 데이터를 정리합니다.
 * 
 * @param props - 훅의 매개변수 객체
 * @param props.selectedIndices - 현재 선택된 모델 인덱스 배열
 * @param props.modelRefs - 모델 객체 참조 맵
 * @param props.scene - Three.js 씬 객체
 * @returns 선택 그룹의 참조 (THREE.Group 또는 null)
 * 
 * @example
 * ```tsx
 * const selectionGroupRef = useSelectionGroup({
 *   selectedIndices: [0, 1, 2],
 *   modelRefs: modelRefs,
 *   scene: scene,
 * });
 * ```
 */
export function useSelectionGroup({
  selectedIndices,
  modelRefs,
  scene,
}: UseSelectionGroupProps) {
  /** 선택 그룹의 참조 (다중 선택 시 생성되는 그룹) */
  const selectionGroupRef = useRef<THREE.Group | null>(null);

  /**
   * 선택된 인덱스가 변경될 때마다 그룹을 업데이트합니다
   * 
   * - 단일 선택 또는 선택 없음: 그룹을 제거하고 저장된 데이터 정리
   * - 다중 선택: 그룹을 생성/업데이트하고 각 객체의 상대 위치 저장
   */
  useEffect(() => {
    // 단일 선택 또는 선택 없음인 경우
    if (selectedIndices.length <= 1) {
      // 기존 그룹이 있으면 씬에서 제거
      if (selectionGroupRef.current) {
        scene.remove(selectionGroupRef.current);
        selectionGroupRef.current = null;
      }
      
      // 단일 선택 시 저장된 상대 위치 데이터 정리
      if (selectedIndices.length === 1) {
        const obj = modelRefs.current.get(selectedIndices[0]);
        if (obj) {
          delete obj.userData.initialRelativePos;
          delete obj.userData.initialQuaternion;
        }
      }
      return;
    }

    // 다중 선택인 경우: 선택된 객체들의 중심점 계산
    const selectedObjects: THREE.Group[] = [];
    const positions: THREE.Vector3[] = [];
    
    // 선택된 각 객체의 월드 좌표 위치를 수집
    selectedIndices.forEach(index => {
      const obj = modelRefs.current.get(index);
      if (obj) {
        selectedObjects.push(obj);
        obj.updateMatrixWorld(true); // 월드 매트릭스 업데이트
        positions.push(new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld));
      }
    });

    if (selectedObjects.length === 0) return;

    // 모든 객체 위치의 평균을 계산하여 중심점 구하기
    const center = new THREE.Vector3();
    positions.forEach(pos => center.add(pos));
    center.divideScalar(positions.length);

    // 그룹이 없으면 새로 생성하고 씬에 추가
    if (!selectionGroupRef.current) {
      selectionGroupRef.current = new THREE.Group();
      selectionGroupRef.current.name = 'SelectionGroup';
      scene.add(selectionGroupRef.current);
    }

    // 그룹의 위치를 중심점으로 설정하고 회전/스케일 초기화
    selectionGroupRef.current.position.copy(center);
    selectionGroupRef.current.rotation.set(0, 0, 0);
    selectionGroupRef.current.scale.set(1, 1, 1);

    // 각 객체의 그룹 중심점으로부터의 상대 위치를 계산하여 저장
    // 이 상대 위치는 나중에 그룹이 이동/회전/스케일될 때 사용됩니다
    selectedObjects.forEach((obj) => {
      // 객체의 월드 위치에서 그룹 중심점을 빼서 상대 위치 계산
      const relativePos = new THREE.Vector3().subVectors(
        new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),
        center
      );
      
      // 각 객체의 초기 상태를 저장 (나중에 그룹 변환 시 사용)
      obj.userData.initialRelativePos = relativePos.clone(); // 상대 위치
      obj.userData.initialQuaternion = obj.quaternion.clone(); // 초기 회전 (쿼터니언, 김벌락 방지)
      obj.userData.initialScale = obj.scale.clone(); // 초기 스케일
    });
  }, [selectedIndices, scene, modelRefs]);

  return selectionGroupRef;
}
