'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  nodeIndex: number; // 노드 인덱스
  nodePath?: string; // 노드 경로 (예: "0/1/2")
  isSelected: boolean;
  onRef?: (ref: THREE.Group | null) => void;
}

/**
 * GLTF/GLB 모델의 개별 노드를 렌더링하는 컴포넌트
 */
export function Model({ 
  url, 
  nodeIndex,
  nodePath,
  isSelected,
  onRef 
}: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  
  React.useEffect(() => {
    if (modelRef.current && onRef) {
      onRef(modelRef.current);
    }
    return () => {
      if (onRef) {
        onRef(null);
      }
    };
  }, [onRef]);

  // 특정 노드를 추출하여 그룹으로 만들기
  React.useEffect(() => {
    if (!scene || !modelRef.current) return;

    // 기존 자식 제거
    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0]);
    }

    let targetNode: THREE.Object3D | null = null;

    // nodePath를 사용하여 노드 찾기 (우선순위)
    if (nodePath) {
      const pathParts = nodePath.split('/').map(Number);
      let current: THREE.Object3D = scene;
      
      for (const index of pathParts) {
        if (current.children[index]) {
          current = current.children[index];
        } else {
          current = null as any;
          break;
        }
      }
      
      if (current) {
        targetNode = current;
      }
    } else {
      // nodePath가 없으면 기존 방식으로 찾기 (하위 호환성)
      // 모든 노드를 재귀적으로 탐색하여 nodeIndex번째 노드 찾기
      let currentIndex = 0;
      const findNodeByIndex = (object: THREE.Object3D): THREE.Object3D | null => {
        const hasName = object.name && object.name.trim() !== '';
        const hasMeshValue = object instanceof THREE.Mesh || 
          (object.children.length > 0 && object.children.some(child => child instanceof THREE.Mesh));
        
        if (hasName || hasMeshValue) {
          if (currentIndex === nodeIndex) {
            return object;
          }
          currentIndex++;
        }
        
        for (const child of object.children) {
          const found = findNodeByIndex(child);
          if (found) return found;
        }
        
        return null;
      };
      
      // scene의 직접 자식들부터 시작
      for (const child of scene.children) {
        const found = findNodeByIndex(child);
        if (found) {
          targetNode = found;
          break;
        }
      }
    }

    if (targetNode) {
      // 노드를 복제하여 추가 (원본은 유지)
      const cloned = targetNode.clone(true);
      
      // 클릭 감지를 위해 모든 하위 객체에 userData 추가
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          child.userData.modelRef = modelRef.current;
        }
      });
      
      modelRef.current.add(cloned);
    }
  }, [scene, url, nodeIndex, nodePath]);

  // 지오메트리 정규화 (노드가 추가된 후에 실행)
  React.useEffect(() => {
    if (modelRef.current && modelRef.current.children.length > 0) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }
        }
      });
    }
  }, [scene, url, nodeIndex]);

  // 선택 상태에 따른 재질 강조
  React.useEffect(() => {
    if (!modelRef.current) return;
    
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (isSelected) {
          child.material.emissive.setHex(0x1a1a1a);
          child.material.emissiveIntensity = 0.3;
        } else {
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [isSelected]);

  return (
    <group ref={modelRef} />
  );
}
