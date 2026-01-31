'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// R3F 컴포넌트 ref 타입 정의
interface TransformControlsRef {
  setMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  addEventListener: (type: 'dragging-changed', listener: (event: { value: boolean }) => void) => void;
  removeEventListener: (type: 'dragging-changed', listener: (event: { value: boolean }) => void) => void;
  dragging?: boolean;
}

interface OrbitControlsRef {
  enabled: boolean;
}

interface LoadedObject {
  id: string;
  name: string;
  path: string;
  group: THREE.Group;
}

interface TooltipData {
  name: string;
  x: number;
  y: number;
}

// 모델 컴포넌트
function Model({ 
  url, 
  position, 
  onSelect, 
  isSelected,
  id 
}: { 
  url: string; 
  position: [number, number, number];
  onSelect: () => void;
  isSelected: boolean;
  id: string;
}) {
  const obj = useLoader(OBJLoader, url) as THREE.Group;
  const groupRef = useRef<THREE.Group>(null);
  const normalizedRef = useRef(false);

  // 크기 정규화는 한 번만 실행
  useEffect(() => {
    if (!obj || !groupRef.current || normalizedRef.current) return;

    // 재질 적용
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingBox();
        }
        const material = new THREE.MeshStandardMaterial({
          color: 0x8b5cf6,
          emissive: 0x000000,
          side: THREE.DoubleSide,
        });
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 크기 정규화 (한 번만 실행)
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim > 0) {
      const center = box.getCenter(new THREE.Vector3());
      const scale = 3 / maxDim;
      obj.scale.setScalar(scale);
      obj.position.sub(center.multiplyScalar(scale));
    }

    if (!groupRef.current.children.includes(obj)) {
      groupRef.current.add(obj);
    }

    normalizedRef.current = true;
  }, [obj]);

  // 선택 상태에 따른 재질 변경만 별도로 처리
  useEffect(() => {
    if (!obj) return;
    
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.color.setHex(isSelected ? 0x8b5cf6 : 0x8b5cf6);
        // 선택 시 약간 밝게
        child.material.emissive.setHex(isSelected ? 0x1a1a1a : 0x000000);
      }
    });
  }, [obj, isSelected]);

  // groupRef에 userData 설정
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.objectId = id;
    }
  }, [id]);

  return (
    <group ref={groupRef} position={position} onClick={onSelect}>
      {obj && <primitive object={obj} />}
    </group>
  );
}

// 씬 내부 컴포넌트
function SceneContent({ 
  loadedObjects, 
  selectedObjectId, 
  transformMode,
  onObjectSelect,
  onTooltipChange 
}: {
  loadedObjects: LoadedObject[];
  selectedObjectId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  onObjectSelect: (id: string | null) => void;
  onTooltipChange: (tooltip: TooltipData | null) => void;
}) {
  const { camera, gl, scene } = useThree();
  // R3F 컴포넌트 ref는 실제로는 더 많은 속성을 가지지만, 우리가 사용하는 것만 타입으로 정의
  const transformControlsRef = useRef<TransformControlsRef | null>(null);
  const orbitControlsRef = useRef<OrbitControlsRef | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const selectedObjectRef = useRef<THREE.Group | null>(null);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);

  // 선택된 오브젝트 찾기
  useEffect(() => {
    if (!selectedObjectId) {
      selectedObjectRef.current = null;
      return;
    }

    // scene을 traverse해서 실제 그룹 찾기
    let foundGroup: THREE.Group | null = null;
    scene.traverse((object) => {
      if (object instanceof THREE.Group && object.userData?.objectId === selectedObjectId) {
        foundGroup = object;
      }
    });

    selectedObjectRef.current = foundGroup;
  }, [selectedObjectId, loadedObjects, scene]);

  // TransformControls 모드 변경
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // TransformControls 드래그 중 OrbitControls 비활성화
  // useFrame을 사용해서 매 프레임마다 dragging 상태 확인
  useFrame(() => {
    if (transformControlsRef.current) {
      const isDragging = transformControlsRef.current.dragging || false;
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !isDragging;
      }
      // state도 동기화 (UI 업데이트용)
      if (isDragging !== !orbitControlsEnabled) {
        setOrbitControlsEnabled(!isDragging);
      }
    } else {
      // TransformControls가 없으면 OrbitControls 활성화
      if (orbitControlsRef.current && !orbitControlsEnabled) {
        orbitControlsRef.current.enabled = true;
        setOrbitControlsEnabled(true);
      }
    }
  });

  // 마우스 이벤트 처리
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (transformControlsRef.current?.dragging) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      
      const objectsToCheck = loadedObjects.map(obj => obj.group);
      const intersects = raycaster.current.intersectObjects(objectsToCheck, true);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        let foundObject: LoadedObject | null = null;
        
        for (const obj of loadedObjects) {
          let found = false;
          obj.group.traverse((child) => {
            if (child === intersectedObject || child === intersectedObject.parent) {
              found = true;
            }
          });
          if (found) {
            foundObject = obj;
            break;
          }
        }

        if (foundObject) {
          onObjectSelect(foundObject.id);
        }
      } else {
        onObjectSelect(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (transformControlsRef.current?.dragging) {
        onTooltipChange(null);
        return;
      }

      if (loadedObjects.length === 0) {
        onTooltipChange(null);
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      
      const objectsToCheck = loadedObjects.map(obj => obj.group);
      const intersects = raycaster.current.intersectObjects(objectsToCheck, true);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        let foundObject: LoadedObject | null = null;
        
        for (const obj of loadedObjects) {
          let found = false;
          obj.group.traverse((child) => {
            if (child === intersectedObject) found = true;
          });
          if (found) {
            foundObject = obj;
            break;
          }
        }

        if (foundObject) {
          onTooltipChange({ name: foundObject.name, x: event.clientX, y: event.clientY });
        } else {
          onTooltipChange(null);
        }
      } else {
        onTooltipChange(null);
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl, loadedObjects, onObjectSelect, onTooltipChange]);

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
      {/* R3F 컴포넌트 ref 타입과 우리 인터페이스가 다르지만, 실제 사용하는 속성(enabled)은 호환됨 */}
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      <OrbitControls
        ref={orbitControlsRef as any}
        enabled={orbitControlsEnabled}
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
      />
      {/* eslint-enable @typescript-eslint/no-explicit-any */}

      {/* TransformControls */}
      {selectedObjectRef.current && (
        <>
          {/* R3F 컴포넌트 ref 타입과 우리 인터페이스가 다르지만, 실제 사용하는 메서드들은 호환됨 */}
          {/* eslint-disable @typescript-eslint/no-explicit-any */}
          <TransformControls
            ref={transformControlsRef as any}
            object={selectedObjectRef.current}
            mode={transformMode}
          />
          {/* eslint-enable @typescript-eslint/no-explicit-any */}
        </>
      )}

      {/* 로드된 모델들 */}
      {loadedObjects.map((obj, index) => {
        const offset = index * 2;
        return (
          <Suspense key={obj.id} fallback={null}>
            <Model
              url={obj.path}
              position={[offset, 0, 0]}
              onSelect={() => onObjectSelect(obj.id)}
              isSelected={selectedObjectId === obj.id}
              id={obj.id}
            />
          </Suspense>
        );
      })}
    </>
  );
}

export function ModelComposer3D({
  loadedObjects,
  selectedObjectId,
  transformMode,
  onObjectSelect,
  onTooltipChange
}: {
  loadedObjects: LoadedObject[];
  selectedObjectId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  onObjectSelect: (id: string | null) => void;
  onTooltipChange: (tooltip: TooltipData | null) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 50 }}
      gl={{ antialias: true }}
      style={{ background: '#1a1a1a' }}
    >
      <Suspense fallback={null}>
        <SceneContent
          loadedObjects={loadedObjects}
          selectedObjectId={selectedObjectId}
          transformMode={transformMode}
          onObjectSelect={onObjectSelect}
          onTooltipChange={onTooltipChange}
        />
      </Suspense>
    </Canvas>
  );
}

