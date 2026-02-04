/**
 * 다중 선택 그룹 변환 적용 훅
 * 
 * 사용자가 TransformControls로 그룹을 조작할 때,
 * 그룹의 변환(이동, 회전, 스케일)을 각 개별 객체에 올바르게 적용합니다.
 * 
 * 각 객체는 그룹 중심점으로부터의 상대 위치를 유지하면서
 * 그룹의 변환을 따라 움직입니다.
 */

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useGroupTransform 훅의 매개변수 인터페이스
 */
interface UseGroupTransformProps {
  /** 선택 그룹의 참조 */
  selectionGroupRef: React.MutableRefObject<THREE.Group | null>;
  /** 선택된 모델 인덱스 배열 */
  selectedIndices: number[];
  /** 모델 객체들의 참조 맵 */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
}

/**
 * TransformControls가 그룹을 조작할 때 각 객체에 변환을 적용하는 훅
 * 
 * 이 훅은 매 프레임마다 다음 작업을 수행합니다:
 * 1. 그룹의 현재 변환(위치, 회전, 스케일)을 읽어옵니다
 * 2. 각 객체의 저장된 상대 위치에 그룹의 회전과 스케일을 적용합니다
 * 3. 그룹의 위치에 변환된 상대 위치를 더하여 최종 위치를 계산합니다
 * 4. 쿼터니언을 사용하여 회전을 합성합니다 (김벌락 방지)
 * 5. 초기 스케일과 그룹 스케일을 곱하여 최종 스케일을 계산합니다
 * 
 * @param props - 훅의 매개변수 객체
 * @param props.selectionGroupRef - 선택 그룹의 참조
 * @param props.selectedIndices - 선택된 모델 인덱스 배열
 * @param props.modelRefs - 모델 객체 참조 맵
 * 
 * @example
 * ```tsx
 * useGroupTransform({
 *   selectionGroupRef: selectionGroupRef,
 *   selectedIndices: [0, 1, 2],
 *   modelRefs: modelRefs,
 * });
 * ```
 */
export function useGroupTransform({
  selectionGroupRef,
  selectedIndices,
  modelRefs,
}: UseGroupTransformProps) {
  /**
   * 매 프레임마다 그룹의 변환을 각 객체에 적용합니다
   * 
   * useFrame은 React Three Fiber의 렌더링 루프에서 매 프레임 호출됩니다.
   * 이 함수는 그룹이 TransformControls로 조작될 때 각 객체의 위치를 업데이트합니다.
   */
  useFrame(() => {
    // 그룹이 없거나 단일 선택인 경우 처리하지 않음
    if (!selectionGroupRef.current || selectedIndices.length <= 1) return;

    const group = selectionGroupRef.current;
    group.updateMatrixWorld(true); // 그룹의 월드 매트릭스 업데이트
    
    // 그룹의 현재 변환 정보 추출
    const groupMatrix = group.matrixWorld;
    const groupPosition = new THREE.Vector3().setFromMatrixPosition(groupMatrix); // 그룹의 위치
    const groupRotation = new THREE.Euler().setFromRotationMatrix(groupMatrix); // 그룹의 회전 (오일러)
    const groupScale = new THREE.Vector3().setFromMatrixScale(groupMatrix); // 그룹의 스케일

    // 선택된 각 객체에 그룹의 변환을 적용
    selectedIndices.forEach(index => {
      const obj = modelRefs.current.get(index);
      if (obj && obj.userData.initialRelativePos) {
        // 저장된 초기 상태 가져오기
        const relativePos = obj.userData.initialRelativePos.clone(); // 그룹 중심으로부터의 상대 위치
        const initialQuaternion = obj.userData.initialQuaternion || new THREE.Quaternion(); // 초기 회전 (쿼터니언)
        const initialScale = obj.userData.initialScale || new THREE.Vector3(1, 1, 1); // 초기 스케일
        
        // 그룹의 회전을 쿼터니언으로 변환 (오일러 -> 쿼터니언)
        const groupQuaternion = new THREE.Quaternion().setFromEuler(groupRotation);
        
        // 상대 위치에 그룹의 회전과 스케일을 적용
        // 1. 회전 적용: 상대 위치를 그룹이 회전한 만큼 회전시킴
        relativePos.applyQuaternion(groupQuaternion);
        // 2. 스케일 적용: 상대 위치를 그룹의 스케일만큼 확대/축소
        relativePos.multiply(groupScale);
        
        // 최종 위치 계산: 그룹의 위치 + 변환된 상대 위치
        obj.position.copy(groupPosition.clone().add(relativePos));
        
        // 회전 합성: 쿼터니언 곱셈을 사용하여 그룹 회전과 초기 회전을 합성
        // 쿼터니언 곱셈은 회전의 합성을 나타냅니다 (순서 중요: group * initial)
        // 김벌락(Gimbal Lock) 현상을 방지하기 위해 오일러 각을 직접 더하지 않고 쿼터니언 사용
        const initialQuaternionForRotation = initialQuaternion.clone();
        obj.quaternion.copy(groupQuaternion).multiply(initialQuaternionForRotation);
        
        // 스케일 합성: 초기 스케일과 그룹 스케일을 곱하여 최종 스케일 계산
        obj.scale.set(
          initialScale.x * groupScale.x,
          initialScale.y * groupScale.y,
          initialScale.z * groupScale.z
        );
      }
    });
  });
}
