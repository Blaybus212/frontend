import React, { useCallback, useRef } from 'react';
import * as THREE from 'three';
import type { SelectedNode } from './useClickHandler';

interface UseSelectionOutlineProps {
  selectedNodesRef: React.MutableRefObject<SelectedNode[] | null>;
  selectedNodesVersion: number;
  selectedIndices: number[];
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
}

/**
 * 선택된 오브젝트에 테두리(Outline) 라인을 렌더링합니다.
 * 선택 상태가 바뀌면 이전 라인을 정리하고 새로 생성합니다.
 */
export function useSelectionOutline({
  selectedNodesRef,
  selectedNodesVersion,
  selectedIndices,
  modelRefs,
}: UseSelectionOutlineProps) {
  const previousOutlinedRef = useRef<THREE.Object3D[]>([]);

  const clearOutline = useCallback((targets: THREE.Object3D[]) => {
    targets.forEach((target) => {
      target.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.selectionOutline) {
          const outline = child.userData.selectionOutline as THREE.LineSegments;
          child.remove(outline);
          if (outline.geometry) outline.geometry.dispose();
          if (outline.material) {
            const materials = Array.isArray(outline.material) ? outline.material : [outline.material];
            materials.forEach((mat) => mat.dispose());
          }
          delete child.userData.selectionOutline;
        }
      });
    });
  }, []);

  const applyOutline = useCallback((targets: THREE.Object3D[]) => {
    targets.forEach((target) => {
      target.traverse((child) => {
        if (child instanceof THREE.Mesh && !child.userData.selectionOutline) {
          const edges = new THREE.EdgesGeometry(child.geometry, 40);
          const material = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
          });
          const outline = new THREE.LineSegments(edges, material);
          outline.scale.set(1.01, 1.01, 1.01);
          outline.renderOrder = 10;
          child.add(outline);
          child.userData.selectionOutline = outline;
        }
      });
    });
  }, []);

  React.useEffect(() => {
    const targets: THREE.Object3D[] = [];
    if (selectedNodesRef.current && selectedNodesRef.current.length > 0) {
      selectedNodesRef.current.forEach((node) => {
        if (node.nodeRef) targets.push(node.nodeRef);
      });
    } else if (selectedIndices.length > 0) {
      selectedIndices.forEach((index) => {
        const model = modelRefs.current.get(index);
        if (model) targets.push(model);
      });
    }

    clearOutline(previousOutlinedRef.current);
    applyOutline(targets);
    previousOutlinedRef.current = targets;
    return () => {
      clearOutline(targets);
    };
  }, [applyOutline, clearOutline, selectedIndices, selectedNodesRef, selectedNodesVersion, modelRefs]);
}
