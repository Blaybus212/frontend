'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// GLTF 모델 컴포넌트
function Model({ 
  url, 
  position, 
  isSelected,
  onRef 
}: { 
  url: string; 
  position: [number, number, number]; 
  isSelected: boolean;
  onRef?: (ref: THREE.Group | null) => void;
}) {
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

  // 모델 크기 정규화
  React.useEffect(() => {
    if (scene && modelRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (maxDim > 0) {
        const center = box.getCenter(new THREE.Vector3());
        const scale = 3 / maxDim;
        scene.scale.setScalar(scale);
        scene.position.sub(center.multiplyScalar(scale));
      }

      // 재질 설정
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(isSelected ? 0x8b5cf6 : 0xffffff);
            child.material.emissive.setHex(isSelected ? 0x1a1a1a : 0x000000);
          }
        }
      });
    }
  }, [scene, isSelected]);

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      position={position}
    />
  );
}

// 씬 내부 컨텐츠
function SceneContent({ 
  models, 
  selectedModelIndex,
  onModelSelect 
}: { 
  models: Array<{ url: string; id: string }>;
  selectedModelIndex: number | null;
  onModelSelect: (index: number | null) => void;
}) {
  const { camera, gl, scene } = useThree();
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());

  // TransformControls 드래그 중 OrbitControls 비활성화
  useFrame(() => {
    if (transformControlsRef.current) {
      const isDragging = transformControlsRef.current.dragging || false;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !isDragging;
      }
      if (isDragging !== !orbitControlsEnabled) {
        setOrbitControlsEnabled(!isDragging);
      }
    }
  });

  // 마우스 클릭 이벤트
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (transformControlsRef.current?.dragging) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      
      // 모든 모델과 교차 검사
      const objects: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
          objects.push(obj);
        }
      });

      const intersects = raycaster.current.intersectObjects(objects, true);
      
      if (intersects.length > 0) {
        // 클릭한 모델 찾기
        const clickedObject = intersects[0].object;
        let foundIndex = -1;
        
        // 모델 refs를 통해 클릭한 객체가 어느 모델에 속하는지 찾기
        modelRefs.current.forEach((group, index) => {
          if (group && (group === clickedObject || group.getObjectById(clickedObject.id))) {
            foundIndex = index;
          }
        });
        
        if (foundIndex >= 0) {
          onModelSelect(foundIndex);
        }
      } else {
        onModelSelect(null);
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl, scene, models, onModelSelect]);

  const selectedModel = selectedModelIndex !== null ? models[selectedModelIndex] : null;
  const selectedObjectRef = selectedModelIndex !== null ? modelRefs.current.get(selectedModelIndex) || null : null;

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />

      {/* 헬퍼 */}
      <gridHelper args={[20, 20]} />
      <axesHelper args={[5]} />

      {/* OrbitControls */}
      <OrbitControls
        ref={orbitControlsRef}
        enabled={orbitControlsEnabled}
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
      />

      {/* TransformControls */}
      {selectedModel && selectedObjectRef && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedObjectRef}
          mode="translate"
        />
      )}

      {/* 로드된 모델들 */}
      {models.map((model, index) => {
        const offset = index * 3;
        return (
          <Suspense key={model.id} fallback={null}>
            <Model
              url={model.url}
              position={[offset, 0, 0]}
              isSelected={selectedModelIndex === index}
              onRef={(ref) => {
                if (ref) {
                  modelRefs.current.set(index, ref);
                } else {
                  modelRefs.current.delete(index);
                }
              }}
            />
          </Suspense>
        );
      })}
    </>
  );
}

interface Scene3DProps {
  models: Array<{ url: string; id: string }>;
  selectedModelIndex: number | null;
  onModelSelect: (index: number | null) => void;
}

export default function Scene3D({ models, selectedModelIndex, onModelSelect }: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 50 }}
      gl={{ antialias: true }}
      style={{ background: '#1a1a1a', width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContent
          models={models}
          selectedModelIndex={selectedModelIndex}
          onModelSelect={onModelSelect}
        />
      </Suspense>
    </Canvas>
  );
}
