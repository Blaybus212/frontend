/**
 * 개별 노드 변환 적용 훅
 * 
 * TransformControls로 개별 노드를 조작할 때,
 * 노드의 변환(위치, 회전, 스케일)을 직접 적용합니다.
 */

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SelectedNode } from './useClickHandler';

/**
 * useNodeTransform 훅의 매개변수 인터페이스
 */
interface UseNodeTransformProps {
  /** 선택된 노드들의 참조 */
  selectedNodesRef: React.MutableRefObject<SelectedNode[] | null>;
  /** TransformControls의 참조 */
  transformControlsRef: React.MutableRefObject<any>;
}

/**
 * TransformControls가 개별 노드를 조작할 때 노드의 변환을 직접 적용하는 훅
 * 
 * 이 훅은 매 프레임마다 다음 작업을 수행합니다:
 * 1. TransformControls가 드래그 중인지 확인
 * 2. 선택된 노드가 하나인 경우에만 처리
 * 3. TransformControls가 변경한 변환을 노드에 직접 적용
 * 
 * @param props - 훅의 매개변수 객체
 * @param props.selectedNodesRef - 선택된 노드들의 참조
 * @param props.transformControlsRef - TransformControls 참조
 * 
 * @example
 * ```tsx
 * useNodeTransform({
 *   selectedNodesRef: selectedNodesRef,
 *   transformControlsRef: transformControlsRef,
 * });
 * ```
 */
export function useNodeTransform({
  selectedNodesRef,
  transformControlsRef,
}: UseNodeTransformProps) {
  /**
   * 매 프레임마다 TransformControls의 변환을 노드에 적용합니다
   * 
   * useFrame은 React Three Fiber의 렌더링 루프에서 매 프레임 호출됩니다.
   * 이 함수는 TransformControls가 노드를 조작할 때 노드의 변환을 직접 업데이트합니다.
   */
  useFrame(() => {
    // TransformControls가 없거나 드래그 중이 아니면 처리하지 않음
    if (!transformControlsRef.current || !transformControlsRef.current.dragging) {
      return;
    }

    // 선택된 노드가 하나인 경우에만 처리
    if (!selectedNodesRef.current || selectedNodesRef.current.length !== 1) {
      return;
    }

    const selectedNode = selectedNodesRef.current[0];
    const node = selectedNode.nodeRef;

    // TransformControls가 연결된 객체 가져오기
    const controlledObject = transformControlsRef.current.object;
    if (!controlledObject || controlledObject !== node) {
      return;
    }

    // TransformControls가 변경한 변환을 노드에 직접 복사
    // TransformControls는 객체의 로컬 position, rotation, scale을 직접 변경합니다
    
    // 드래그 시작 위치와 비교하여 실제 변경 확인
    const controlledDragStartLocalPos = controlledObject.userData.dragStartLocalPos || controlledObject.position.clone();
    
    // TransformControls가 실제로 변경했는지 확인
    const controlledLocalChanged = !controlledDragStartLocalPos.equals(controlledObject.position);
    
    if (!controlledLocalChanged) {
      // TransformControls가 변경하지 않았으면 처리하지 않음
      return;
    }
    
    // TransformControls가 변경한 로컬 position을 노드에 직접 적용
    node.position.copy(controlledObject.position);
    node.rotation.copy(controlledObject.rotation);
    node.scale.copy(controlledObject.scale);
    
    // 매트릭스 업데이트
    node.updateMatrix();
    node.updateMatrixWorld(true);
    
    // 사용자가 변경한 위치를 userData에 저장 (useAssemblyDisassembly가 덮어쓰지 않도록)
    if (!node.userData.userModifiedPosition) {
      node.userData.userModifiedPosition = new THREE.Vector3();
    }
    node.userData.userModifiedPosition.copy(node.position);
    
    if (!node.userData.userModifiedRotation) {
      node.userData.userModifiedRotation = new THREE.Euler();
    }
    node.userData.userModifiedRotation.copy(node.rotation);
    
    if (!node.userData.userModifiedScale) {
      node.userData.userModifiedScale = new THREE.Vector3();
    }
    node.userData.userModifiedScale.copy(node.scale);
    
    // 사용자가 수정했음을 표시
    node.userData.isUserModified = true;
  });
}
