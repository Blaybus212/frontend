/**
 * GLTF/GLB 모델의 개별 노드를 렌더링하는 컴포넌트
 * 
 * 하나의 GLTF 파일에서 특정 노드(객체)만 추출하여 렌더링합니다.
 * nodePath를 사용하여 정확한 노드를 찾고, 복제하여 원본을 유지합니다.
 * 
 * 주요 기능:
 * - GLTF 파일에서 특정 노드 추출
 * - 노드 복제 (원본 유지)
 * - 클릭 감지를 위한 userData 설정
 * - 정점 노말 계산 (조명 계산용)
 * - 선택 상태에 따른 재질 강조
 */

'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Model 컴포넌트의 props 인터페이스
 */
interface ModelProps {
  /** GLTF/GLB 파일의 URL 경로 */
  url: string;
  /** 노드 인덱스 (nodePath가 없을 때 사용하는 하위 호환 방식) */
  nodeIndex: number;
  /** 노드 경로 (예: "0/1/2" - scene의 첫 번째 자식의 두 번째 자식의 세 번째 자식) */
  nodePath?: string;
  /** 이 모델이 선택되었는지 여부 */
  isSelected: boolean;
  /** 모델 그룹의 참조를 전달하는 콜백 함수 (선택적) */
  onRef?: (ref: THREE.Group | null) => void;
}

/**
 * GLTF/GLB 모델의 개별 노드를 렌더링하는 컴포넌트
 * 
 * 이 컴포넌트는 다음과 같은 작업을 수행합니다:
 * 1. GLTF 파일을 로드합니다
 * 2. nodePath 또는 nodeIndex를 사용하여 특정 노드를 찾습니다
 * 3. 노드를 복제하여 렌더링합니다 (원본은 유지)
 * 4. 모든 하위 객체에 userData를 설정하여 클릭 감지를 가능하게 합니다
 * 5. 정점 노말을 계산하여 조명이 올바르게 적용되도록 합니다
 * 6. 선택 상태에 따라 재질을 강조합니다
 * 
 * @param props - 컴포넌트의 props
 * @param props.url - GLTF/GLB 파일의 URL
 * @param props.nodeIndex - 노드 인덱스 (하위 호환성)
 * @param props.nodePath - 노드 경로 (우선 사용)
 * @param props.isSelected - 선택 상태
 * @param props.onRef - 참조 콜백 함수
 * 
 * @example
 * ```tsx
 * <Model
 *   url="/models/scene.gltf"
 *   nodeIndex={0}
 *   nodePath="0/1/2"
 *   isSelected={true}
 *   onRef={(ref) => console.log('Model ref:', ref)}
 * />
 * ```
 */
export function Model({ 
  url, 
  nodeIndex,
  nodePath,
  isSelected,
  onRef 
}: ModelProps) {
  /** GLTF 파일을 로드한 결과 (씬 객체) */
  const { scene } = useGLTF(url);
  /** 모델 그룹의 참조 (렌더링된 노드를 담는 컨테이너) */
  const modelRef = useRef<THREE.Group>(null);
  
  /**
   * 모델 그룹의 참조를 외부로 전달합니다
   * 
   * 컴포넌트가 마운트되면 참조를 전달하고,
   * 언마운트되면 null을 전달하여 정리합니다.
   */
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

  /**
   * 특정 노드를 추출하여 그룹으로 렌더링합니다
   * 
   * nodePath가 있으면 경로를 따라 노드를 찾고,
   * 없으면 nodeIndex를 사용하여 재귀적으로 탐색합니다.
   * 찾은 노드를 복제하여 렌더링합니다 (원본은 유지).
   */
  React.useEffect(() => {
    if (!scene || !modelRef.current) return;

    // 기존 자식 제거 (이전 노드 정리)
    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0]);
    }

    let targetNode: THREE.Object3D | null = null;

    // 방법 1: nodePath를 사용하여 노드 찾기 (우선순위, 더 정확함)
    // nodePath는 "0/1/2" 형식으로, scene의 첫 번째 자식의 두 번째 자식의 세 번째 자식을 의미
    if (nodePath) {
      const pathParts = nodePath.split('/').map(Number); // ["0", "1", "2"] -> [0, 1, 2]
      let current: THREE.Object3D = scene;
      
      // 경로를 따라 노드를 찾습니다
      for (const index of pathParts) {
        if (current.children[index]) {
          current = current.children[index];
        } else {
          // 경로가 유효하지 않으면 null로 설정
          current = null as any;
          break;
        }
      }
      
      if (current) {
        targetNode = current;
      }
    } else {
      // 방법 2: nodePath가 없으면 기존 방식으로 찾기 (하위 호환성)
      // 모든 노드를 재귀적으로 탐색하여 nodeIndex번째 노드를 찾습니다
      // 이름이 있거나 메시를 포함한 노드만 카운트합니다
      let currentIndex = 0;
      
      /**
       * 재귀적으로 노드를 탐색하여 nodeIndex번째 노드를 찾는 함수
       * 
       * @param object - 탐색할 객체
       * @returns 찾은 노드 또는 null
       */
      const findNodeByIndex = (object: THREE.Object3D): THREE.Object3D | null => {
        // 이름이 있거나 메시를 포함한 노드만 카운트
        const hasName = object.name && object.name.trim() !== '';
        const hasMeshValue = object instanceof THREE.Mesh || 
          (object.children.length > 0 && object.children.some(child => child instanceof THREE.Mesh));
        
        if (hasName || hasMeshValue) {
          if (currentIndex === nodeIndex) {
            return object; // 찾은 노드 반환
          }
          currentIndex++; // 다음 노드로 이동
        }
        
        // 자식 노드들을 재귀적으로 탐색
        for (const child of object.children) {
          const found = findNodeByIndex(child);
          if (found) return found;
        }
        
        return null;
      };
      
      // scene의 직접 자식들부터 시작하여 탐색
      for (const child of scene.children) {
        const found = findNodeByIndex(child);
        if (found) {
          targetNode = found;
          break;
        }
      }
    }

    // 노드를 찾은 경우 복제하여 렌더링
    if (targetNode) {
      // 노드를 깊은 복제하여 추가 (원본은 유지)
      // clone(true)는 모든 하위 객체도 함께 복제합니다
      const cloned = targetNode.clone(true);
      
      // 클릭 감지를 위해 모든 하위 객체에 userData 추가
      // 이렇게 하면 어떤 하위 객체를 클릭해도 모델을 찾을 수 있습니다
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          child.userData.modelRef = modelRef.current;
        }
      });
      
      modelRef.current.add(cloned);
    }
  }, [scene, url, nodeIndex, nodePath]);

  /**
   * 지오메트리의 정점 노말을 계산합니다
   * 
   * 정점 노말은 조명 계산에 사용되며, 면의 방향을 나타냅니다.
   * GLTF 파일에 노말 정보가 없거나 불완전한 경우를 대비하여
   * 지오메트리에서 자동으로 계산합니다.
   * 
   * 노드가 추가된 후에 실행되어야 하므로 별도의 useEffect로 분리했습니다.
   */
  React.useEffect(() => {
    if (modelRef.current && modelRef.current.children.length > 0) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            // 정점 노말 계산 (조명 계산에 필요)
            child.geometry.computeVertexNormals();
          }
        }
      });
    }
  }, [scene, url, nodeIndex]);

  /**
   * 선택 상태에 따라 재질을 강조합니다
   * 
   * 모델이 선택되면 emissive(자체 발광) 속성을 설정하여
   * 약간 밝게 표시하여 선택 상태를 시각적으로 나타냅니다.
   */
  React.useEffect(() => {
    if (!modelRef.current) return;
    
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (isSelected) {
          // 선택된 경우: 약간의 발광 효과 추가
          child.material.emissive.setHex(0x1a1a1a); // 어두운 회색 발광
          child.material.emissiveIntensity = 0.3; // 30% 강도
        } else {
          // 선택되지 않은 경우: 발광 효과 제거
          child.material.emissive.setHex(0x000000); // 검은색 (발광 없음)
          child.material.emissiveIntensity = 0; // 강도 0
        }
      }
    });
  }, [isSelected]);

  return (
    <group ref={modelRef} />
  );
}
