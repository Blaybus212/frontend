'use client';

import React, { Suspense, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Model } from './Model';
import { extractObjectInfo } from './utils';
import type { ObjectInfo, Model as ModelType, TransformMode, Transform, Scene3DRef } from './types';

interface SceneContentProps {
  models: ModelType[];
  selectedModelIndex: number | null;
  onModelSelect: (index: number | null) => void;
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}

/**
 * 3D 씬의 내부 컨텐츠 (조명, 컨트롤, 모델들)
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndex,
  onModelSelect,
  onObjectInfoChange
}, ref) => {
  const { camera, gl, scene } = useThree();
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  const previousInfoRef = useRef<ObjectInfo | null>(null);

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

  // 선택된 객체 정보 추출 및 전달
  React.useEffect(() => {
    if (selectedObjectRef && onObjectInfoChange) {
      const info = extractObjectInfo(selectedObjectRef);
      previousInfoRef.current = info;
      onObjectInfoChange(info);
    } else if (onObjectInfoChange) {
      previousInfoRef.current = null;
      onObjectInfoChange(null);
    }
  }, [selectedObjectRef, onObjectInfoChange]);

  // TransformControls 조작 시 실시간 업데이트 (값이 변경되었을 때만)
  useFrame(() => {
    if (selectedObjectRef && onObjectInfoChange) {
      const info = extractObjectInfo(selectedObjectRef);
      
      if (!info) return;
      
      // 이전 정보와 비교하여 실제로 변경되었을 때만 업데이트
      const prev = previousInfoRef.current;
      if (!prev || 
          prev.position.x !== info.position.x || 
          prev.position.y !== info.position.y || 
          prev.position.z !== info.position.z ||
          prev.rotation.x !== info.rotation.x || 
          prev.rotation.y !== info.rotation.y || 
          prev.rotation.z !== info.rotation.z ||
          prev.scale.x !== info.scale.x || 
          prev.scale.y !== info.scale.y || 
          prev.scale.z !== info.scale.z) {
        previousInfoRef.current = info;
        onObjectInfoChange(info);
      }
    }
  });

  // 객체 변환 업데이트 함수
  const updateObjectTransform = useCallback((transform: Transform) => {
    if (selectedObjectRef) {
      if (transform.position !== undefined) {
        if (transform.position.x !== undefined) selectedObjectRef.position.x = transform.position.x;
        if (transform.position.y !== undefined) selectedObjectRef.position.y = transform.position.y;
        if (transform.position.z !== undefined) selectedObjectRef.position.z = transform.position.z;
      }
      
      if (transform.rotation !== undefined) {
        if (transform.rotation.x !== undefined) selectedObjectRef.rotation.x = THREE.MathUtils.degToRad(transform.rotation.x);
        if (transform.rotation.y !== undefined) selectedObjectRef.rotation.y = THREE.MathUtils.degToRad(transform.rotation.y);
        if (transform.rotation.z !== undefined) selectedObjectRef.rotation.z = THREE.MathUtils.degToRad(transform.rotation.z);
      }
      
      if (transform.scale !== undefined) {
        if (transform.scale.x !== undefined) selectedObjectRef.scale.x = transform.scale.x;
        if (transform.scale.y !== undefined) selectedObjectRef.scale.y = transform.scale.y;
        if (transform.scale.z !== undefined) selectedObjectRef.scale.z = transform.scale.z;
      }
      
      // 업데이트 후 정보 갱신
      if (onObjectInfoChange) {
        const info = extractObjectInfo(selectedObjectRef);
        onObjectInfoChange(info);
      }
    }
  }, [selectedObjectRef, onObjectInfoChange]);

  // 씬 내보내기 함수
  const exportScene = useCallback(() => {
    if (modelRefs.current.size === 0) {
      alert('내보낼 모델이 없습니다.');
      return;
    }

    // 모든 모델을 하나의 그룹으로 합치기
    const exportGroup = new THREE.Group();
    exportGroup.name = 'ExportedScene';

    modelRefs.current.forEach((modelGroup, index) => {
      if (modelGroup) {
        // 모델을 복제하여 추가 (원본은 유지)
        const cloned = modelGroup.clone(true);
        cloned.name = models[index]?.name || `Model_${index}`;
        exportGroup.add(cloned);
      }
    });

    // GLTFExporter를 사용하여 내보내기
    const exporter = new GLTFExporter();
    
    exporter.parse(
      exportGroup,
      (result) => {
        if (result instanceof ArrayBuffer) {
          // GLB 형식 (바이너리)
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'scene.glb';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (result) {
          // GLTF 형식 (JSON)
          const output = JSON.stringify(result, null, 2);
          const blob = new Blob([output], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'scene.gltf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      },
      (error) => {
        console.error('GLTF export error:', error);
        alert('씬 내보내기 중 오류가 발생했습니다.');
      },
      { binary: false, onlyVisible: false, truncateDrawRange: true }
    );
  }, [models]);

  // TransformControls 모드 설정 함수
  const handleSetTransformMode = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
  }, []);

  // ref를 통해 함수들 노출
  useImperativeHandle(ref, () => ({
    exportScene,
    updateObjectTransform,
    setTransformMode: handleSetTransformMode
  }));

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
          mode={transformMode}
          showX
          showY
          showZ
        />
      )}

      {/* 로드된 모델들 - 원본 위치 유지 */}
      {models.map((model, index) => {
        return (
          <Suspense key={model.id} fallback={null}>
            <Model
              url={model.url}
              position={[0, 0, 0]}
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
});

SceneContent.displayName = 'SceneContent';
