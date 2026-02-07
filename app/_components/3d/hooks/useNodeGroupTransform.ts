import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SelectedNode } from './useClickHandler';

interface UseNodeGroupTransformProps {
  selectionGroupRef: React.MutableRefObject<THREE.Group | null>;
  selectedNodesRef: React.MutableRefObject<SelectedNode[] | null>;
  selectedNodesVersion: number;
  transformControlsRef: React.MutableRefObject<any>;
}

/**
 * 여러 노드 선택 시 그룹 변환을 각 노드에 적용합니다.
 */
export function useNodeGroupTransform({
  selectionGroupRef,
  selectedNodesRef,
  selectedNodesVersion,
  transformControlsRef,
}: UseNodeGroupTransformProps) {
  useFrame(() => {
    if (!transformControlsRef.current?.dragging) {
      return;
    }

    const group = selectionGroupRef.current;
    const nodes = selectedNodesRef.current || [];
    if (!group || nodes.length <= 1) return;

    group.updateMatrixWorld(true);
    const groupMatrix = group.matrixWorld;
    const groupPosition = new THREE.Vector3().setFromMatrixPosition(groupMatrix);
    const groupRotation = new THREE.Euler().setFromRotationMatrix(groupMatrix);
    const groupScale = new THREE.Vector3().setFromMatrixScale(groupMatrix);
    const groupQuaternion = new THREE.Quaternion().setFromEuler(groupRotation);

    nodes.forEach((node) => {
      const obj = node.nodeRef;
      if (obj.userData.nodeSelectionVersion !== selectedNodesVersion) {
        return;
      }
      const relativePos = obj.userData.nodeSelectionRelativePos?.clone();
      const initialQuaternion = obj.userData.nodeSelectionInitialQuaternion?.clone();
      const initialScale = obj.userData.nodeSelectionInitialScale?.clone();

      if (!relativePos || !initialQuaternion || !initialScale) return;

      relativePos.applyQuaternion(groupQuaternion);
      relativePos.multiply(groupScale);
      const nextWorldPos = groupPosition.clone().add(relativePos);
      if (obj.parent) {
        const localPos = obj.parent.worldToLocal(nextWorldPos.clone());
        obj.position.copy(localPos);
      } else {
        obj.position.copy(nextWorldPos);
      }

      obj.quaternion.copy(groupQuaternion).multiply(initialQuaternion);
      obj.scale.set(
        initialScale.x * groupScale.x,
        initialScale.y * groupScale.y,
        initialScale.z * groupScale.z
      );

      if (!obj.userData.userModifiedPosition) {
        obj.userData.userModifiedPosition = new THREE.Vector3();
      }
      if (!obj.userData.userModifiedRotation) {
        obj.userData.userModifiedRotation = new THREE.Euler();
      }
      if (!obj.userData.userModifiedScale) {
        obj.userData.userModifiedScale = new THREE.Vector3();
      }
      obj.userData.userModifiedPosition.copy(obj.position);
      obj.userData.userModifiedRotation.copy(obj.rotation);
      obj.userData.userModifiedScale.copy(obj.scale);
      obj.userData.isUserModified = true;
    });
  });
}
