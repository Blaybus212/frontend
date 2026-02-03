'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  position: [number, number, number];
  isSelected: boolean;
  onRef?: (ref: THREE.Group | null) => void;
}

/**
 * GLTF/GLB 모델을 로드하고 렌더링하는 컴포넌트
 */
export function Model({ 
  url, 
  position, 
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

  // 모델 크기 정규화 (한 번만 실행, 원본 위치 유지)
  // 주의: GLTF 파일에 매트릭스가 이미 설정되어 있으면 정규화를 건너뜀
  const normalizedRef = useRef(false);
  React.useEffect(() => {
    if (scene && modelRef.current && !normalizedRef.current) {
      // 모든 모델에 대해 크기/위치/회전 정규화 비활성화
      // GLTF 파일에 저장된 원본 매트릭스 값을 그대로 사용
      // (크기 정규화 제거 - 원본 크기 유지)

      // 지오메트리 정규화만 수행 (재질은 원본 유지)
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }
        }
      });
      
      normalizedRef.current = true;
    }
  }, [scene, url]);

  // 선택 상태에 따른 재질 강조 (원본 색상 유지)
  React.useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // 원본 재질 유지, 선택 시에만 emissive로 약간 강조
        if (isSelected) {
          child.material.emissive.setHex(0x1a1a1a);
          child.material.emissiveIntensity = 0.3;
        } else {
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [scene, isSelected]);

  return (
    <primitive 
      ref={modelRef} 
      object={scene}
      // position prop 제거 - 원본 위치 유지
    />
  );
}
