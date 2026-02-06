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
  /** 렌더링 모드 */
  renderMode: 'normal' | 'wireframe';
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
  renderMode,
  onRef 
}: ModelProps) {
  /** GLTF 파일을 로드한 결과 (씬 객체) */
  const { scene } = useGLTF(url);
  /** 모델 그룹의 참조 (렌더링된 노드를 담는 컨테이너) */
  const modelRef = useRef<THREE.Group>(null);
  /** 최신 onRef 콜백을 보관하여 불필요한 재클론 방지 */
  const onRefLatest = useRef<ModelProps['onRef']>(onRef);

  React.useEffect(() => {
    onRefLatest.current = onRef;
  }, [onRef]);
  
  /**
   * 모델 그룹의 참조를 외부로 전달합니다
   * 
   * 컴포넌트가 마운트되면 참조를 전달하고,
   * 언마운트되면 null을 전달하여 정리합니다.
   * 모델이 로드된 후에도 참조를 다시 전달합니다.
   */
  React.useEffect(() => {
    if (modelRef.current && onRefLatest.current) {
      onRefLatest.current(modelRef.current);
    }
    return () => {
      if (onRefLatest.current) {
        onRefLatest.current(null);
      }
    };
  }, [scene]); // scene이 변경되면 참조를 다시 전달

  /**
   * 전체 GLTF 씬을 로드하고 모든 노드를 개별적으로 선택 가능하게 렌더링합니다
   * 
   * 각 노드에 고유 ID를 부여하고 userData에 저장하여 개별 선택이 가능하도록 합니다.
   */
  React.useEffect(() => {
    if (!scene || !modelRef.current) {
      return;
    }

    // 기존 자식 제거 (이전 노드 정리)
    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0]);
    }

    // 전체 씬을 복제하여 추가
    const clonedScene = scene.clone(true);
    
    // 모든 노드를 순회하며 개별 선택 가능하도록 설정
    // 선택 가능한 노드: 이름이 있고, "Solid"로 시작하지 않으며, children이 있는 부품 노드
    let nodeIdCounter = 0;
    const selectableParts: Array<{ name: string; nodeId: string; type: string }> = [];
    let totalNodes = 0;
    let nodesWithName = 0;
    let nodesWithChildren = 0;
    
    clonedScene.traverse((child) => {
      totalNodes++;
      const hasName = child.name && child.name.trim() !== '';
      const name = child.name?.trim() || '';
      
      if (hasName) {
        nodesWithName++;
      }
      
      if (child.children.length > 0) {
        nodesWithChildren++;
      }
      
      // "Solid"로 시작하는 노드는 선택 불가능 (메시 그룹화 노드)
      if (name.startsWith('Solid')) {
        // Solid 노드는 선택 불가능하도록 표시
        child.userData.selectable = false;
        return;
      }
      
      // 선택 가능한 노드 조건:
      // 1. 이름이 있어야 함
      // 2. children이 있어야 함 (부품 노드)
      // 3. "Solid"로 시작하지 않아야 함
      const hasChildren = child.children.length > 0;
      const isSelectablePart = hasName && hasChildren && !name.startsWith('Solid');
      
      if (isSelectablePart) {
        // 각 노드에 고유 ID 부여
        const nodeId = `node_${nodeIdCounter++}`;
        
        // 선택 가능한 부품 목록에 추가
        selectableParts.push({
          name: child.name || nodeId,
          nodeId: nodeId,
          type: child.type,
        });
        
        // userData에 모델 참조와 노드 ID 저장
        child.userData.modelRef = modelRef.current;
        child.userData.nodeId = nodeId;
        child.userData.nodeName = child.name || nodeId;
        child.userData.selectable = true;
        
        // 모든 하위 객체에도 동일한 정보 전파
        child.traverse((descendant) => {
          if (descendant instanceof THREE.Mesh || descendant instanceof THREE.Group || descendant instanceof THREE.Object3D) {
            if (!descendant.userData.modelRef) {
              descendant.userData.modelRef = modelRef.current;
            }
            if (!descendant.userData.nodeId) {
              descendant.userData.nodeId = nodeId;
            }
            if (!descendant.userData.nodeName) {
              descendant.userData.nodeName = child.name || nodeId;
            }
            descendant.userData.selectable = true;
          }
        });
      } else {
        // 선택 불가능한 노드는 표시만
        child.userData.selectable = false;
      }
    });
    
    modelRef.current.add(clonedScene);
    
    // 모델이 추가된 후 참조를 다시 전달
    if (onRefLatest.current && modelRef.current) {
      // 다음 프레임에 참조 전달 (렌더링 완료 후)
      requestAnimationFrame(() => {
        if (onRefLatest.current && modelRef.current) {
          onRefLatest.current(modelRef.current);
        }
      });
    }
  }, [scene, url]);

  /**
   * 렌더링 품질 향상을 위한 재질/그림자 설정
   */
  React.useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 그림자 품질 향상
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            // 광택감 향상 (과도한 변화 방지)
            material.metalness = Math.max(material.metalness ?? 0, 0.2);
            material.roughness = Math.min(material.roughness ?? 1, 0.4);
            material.envMapIntensity = Math.max(material.envMapIntensity ?? 0.8, 0.8);
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, url]);

  /**
   * 렌더링 모드(일반/와이어프레임)를 적용합니다
   */
  React.useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        const materialAny = material as THREE.Material & {
          wireframe?: boolean;
          color?: THREE.Color;
        };

        if (!materialAny.userData) {
          materialAny.userData = {};
        }

        if (renderMode === 'wireframe') {
          if (materialAny.userData.originalWireframe === undefined) {
            materialAny.userData.originalWireframe = materialAny.wireframe ?? false;
          }
          if (materialAny.userData.originalColor === undefined && materialAny.color) {
            materialAny.userData.originalColor = materialAny.color.clone();
          }
          materialAny.wireframe = true;
          if (materialAny.color) {
            materialAny.color.set('#cfd6df');
          }
        } else {
          if (materialAny.userData.originalWireframe !== undefined) {
            materialAny.wireframe = materialAny.userData.originalWireframe;
          } else {
            materialAny.wireframe = false;
          }
          if (materialAny.userData.originalColor && materialAny.color) {
            materialAny.color.copy(materialAny.userData.originalColor);
          }
        }

        materialAny.needsUpdate = true;
      });
    });
  }, [renderMode]);

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
