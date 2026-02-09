/**
 * GLTF/GLB 모델의 개별 노드를 렌더링합니다.
 *
 * 노드를 복제해 렌더링하고, 선택/클릭을 위한 userData와 렌더 품질 설정을 적용합니다.
 */

'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { isSelectablePart } from './utils/nodeSelection';

interface ModelProps {
  /** GLTF/GLB 파일의 URL 경로 */
  url: string;
  /** 이 모델이 선택되었는지 여부 */
  isSelected: boolean;
  /** 렌더링 모드 */
  renderMode: 'normal' | 'wireframe';
  /** 모델 그룹의 참조를 전달하는 콜백 함수 (선택적) */
  onRef?: (ref: THREE.Group | null) => void;
}

/**
 * GLTF/GLB 모델을 로드하고 노드 선택/렌더링 설정을 적용합니다.
 *
 * @param props.url - GLTF/GLB 파일 경로
 * @param props.isSelected - 선택 상태
 * @param props.renderMode - 렌더 모드
 * @param props.onRef - 모델 그룹 ref 콜백
 */
export function Model({ 
  url, 
  isSelected,
  renderMode,
  onRef 
}: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const onRefLatest = useRef<ModelProps['onRef']>(onRef);

  React.useEffect(() => {
    onRefLatest.current = onRef;
  }, [onRef]);
  
  /** 모델 그룹 ref를 외부로 전달합니다. */
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

  /** 씬을 복제하고 선택 가능한 노드 정보를 userData에 부여합니다. */
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
    
    // 선택 가능한 노드: 이름이 있고, "Solid"가 아니며, children이 있는 부품 노드
    let nodeIdCounter = 0;
    
    clonedScene.traverse((child) => {
      // 씬 자체는 선택 대상에서 제외
      if (child === clonedScene || child.parent === null) {
        child.userData.selectable = false;
        return;
      }
      
      // 이 조건을 제거! 최상위 children도 부품이 될 수 있음
      // (Base_Plate1, Pin1 등이 최상위 children임)

      if (isSelectablePart(child)) {
        // 각 노드에 고유 ID 부여
        const nodeId = `node_${nodeIdCounter++}`;
        
        // userData에 모델 참조와 노드 ID 저장
        child.userData.modelRef = modelRef.current;
        child.userData.nodeId = nodeId;
        // extras.description 우선 사용, 없으면 노드 이름, 그것도 없으면 nodeId
        child.userData.nodeName = child.userData.description || child.name || nodeId;
        // GLTF 원본 name을 originalName에 저장 (영문 이름)
        child.userData.originalName = child.name;
        // 최초 로드 기준 로컬 변환값 저장 (조립 기준)
        if (!child.userData.initialPosition) {
          child.userData.initialPosition = child.position.clone();
        }
        if (!child.userData.initialRotation) {
          child.userData.initialRotation = child.rotation.clone();
        }
        if (!child.userData.initialScale) {
          child.userData.initialScale = child.scale.clone();
        }
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
              descendant.userData.nodeName = child.userData.description || child.name || nodeId;
            }
            if (!descendant.userData.originalName) {
              descendant.userData.originalName = child.name;
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

  /** 렌더 품질(그림자/광택) 기본값을 적용합니다. */
  React.useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = Math.max(material.metalness ?? 0, 0.2);
            material.roughness = Math.min(material.roughness ?? 1, 0.4);
            material.envMapIntensity = Math.max(material.envMapIntensity ?? 0.8, 0.8);
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [scene, url]);

  /** 렌더링 모드(일반/와이어프레임)를 적용합니다. */
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
   * 정점 노말을 계산해 조명 품질을 보정합니다.
   * (GLTF에 노말이 없거나 불완전한 경우 대비)
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
  }, [scene, url]);

  /** 선택 상태에 따라 emissive를 조정해 시각적으로 강조합니다. */
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
