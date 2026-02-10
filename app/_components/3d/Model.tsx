'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { isSelectablePart } from './utils/nodeSelection';

/** Model 컴포넌트 props */
interface ModelProps {
  url: string;
  isSelected: boolean;
  renderMode: 'normal' | 'wireframe';
  onRef?: (ref: THREE.Group | null) => void;
}

/**
 * GLTF/GLB 모델 로드 및 노드별 userData 설정 (선택/변환용)
 * @param props - url, isSelected, renderMode, onRef
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

  React.useEffect(() => {
    if (modelRef.current && onRefLatest.current) {
      onRefLatest.current(modelRef.current);
    }
    return () => {
      if (onRefLatest.current) {
        onRefLatest.current(null);
      }
    };
  }, [scene]);

  React.useEffect(() => {
    if (!scene || !modelRef.current) {
      return;
    }

    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0]);
    }

    // 전체 씬을 복제하여 추가
    const clonedScene = scene.clone(true);
    let nodeIdCounter = 0;

    clonedScene.traverse((child) => {
      if (child === clonedScene || child.parent === null) {
        child.userData.selectable = false;
        return;
      }

      if (isSelectablePart(child)) {
        const nodeId = `node_${nodeIdCounter++}`;
        child.userData.modelRef = modelRef.current;
        child.userData.nodeId = nodeId;
        child.userData.nodeName = child.userData.description || child.name || nodeId;
        child.userData.originalName = child.name;
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
        child.userData.selectable = false;
      }
    });
    
    modelRef.current.add(clonedScene);

    if (onRefLatest.current && modelRef.current) {
      requestAnimationFrame(() => {
        if (onRefLatest.current && modelRef.current) {
          onRefLatest.current(modelRef.current);
        }
      });
    }
  }, [scene, url]);

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
  }, [scene, url]);

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
