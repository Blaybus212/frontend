import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SelectedNode } from './useClickHandler';

interface UseNodeSelectionGroupProps {
  selectedNodesRef: React.MutableRefObject<SelectedNode[] | null>;
  selectedNodesVersion: number;
  scene: THREE.Scene;
  onGroupChanged?: () => void;
  transformControlsRef?: React.MutableRefObject<any>;
}

/**
 * 여러 노드 선택 시 전용 그룹을 생성하고 중심점을 계산합니다.
 */
export function useNodeSelectionGroup({
  selectedNodesRef,
  selectedNodesVersion,
  scene,
  onGroupChanged,
  transformControlsRef,
}: UseNodeSelectionGroupProps) {
  const selectionGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const nodes = selectedNodesRef.current || [];
    if (nodes.length <= 1) {
      if (selectionGroupRef.current) {
        scene.remove(selectionGroupRef.current);
        selectionGroupRef.current = null;
        onGroupChanged?.();
      }
      nodes.forEach((node) => {
        delete node.nodeRef.userData.nodeSelectionRelativePos;
        delete node.nodeRef.userData.nodeSelectionInitialQuaternion;
        delete node.nodeRef.userData.nodeSelectionInitialScale;
      });
      return;
    }

    const positions: THREE.Vector3[] = [];
    nodes.forEach((node) => {
      node.nodeRef.updateMatrixWorld(true);
      positions.push(new THREE.Vector3().setFromMatrixPosition(node.nodeRef.matrixWorld));
    });

    const center = new THREE.Vector3();
    positions.forEach((pos) => center.add(pos));
    center.divideScalar(positions.length);

    if (!selectionGroupRef.current) {
      selectionGroupRef.current = new THREE.Group();
      selectionGroupRef.current.name = 'NodeSelectionGroup';
      scene.add(selectionGroupRef.current);
      onGroupChanged?.();
    }

    selectionGroupRef.current.position.copy(center);
    selectionGroupRef.current.rotation.set(0, 0, 0);
    selectionGroupRef.current.scale.set(1, 1, 1);

    nodes.forEach((node, index) => {
      const relativePos = new THREE.Vector3().subVectors(positions[index], center);
      node.nodeRef.userData.nodeSelectionRelativePos = relativePos.clone();
      node.nodeRef.userData.nodeSelectionInitialQuaternion = node.nodeRef.quaternion.clone();
      node.nodeRef.userData.nodeSelectionInitialScale = node.nodeRef.scale.clone();
      node.nodeRef.userData.nodeSelectionVersion = selectedNodesVersion;
    });
  }, [selectedNodesRef, selectedNodesVersion, scene]);

  useFrame(() => {
    const nodes = selectedNodesRef.current || [];
    const group = selectionGroupRef.current;
    if (!group || nodes.length <= 1) return;
    if (transformControlsRef?.current?.dragging) return;

    const center = new THREE.Vector3();
    nodes.forEach((node) => {
      node.nodeRef.updateMatrixWorld(true);
      center.add(new THREE.Vector3().setFromMatrixPosition(node.nodeRef.matrixWorld));
    });
    center.divideScalar(nodes.length);
    group.position.copy(center);
  });

  return selectionGroupRef;
}
