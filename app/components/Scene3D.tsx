'use client';

import React, { Suspense, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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

  // 모델 크기 정규화 (한 번만 실행, 원본 위치 유지)
  const normalizedRef = useRef(false);
  React.useEffect(() => {
    if (scene && modelRef.current && !normalizedRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (maxDim > 0) {
        const scale = 3 / maxDim;
        // 스케일만 적용하고 위치는 원본 유지 (원점으로 이동하지 않음)
        scene.scale.setScalar(scale);
      }

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
  }, [scene]);

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

// 객체 정보 추출 함수
function extractObjectInfo(object: THREE.Group | null): ObjectInfo | null {
  if (!object) return null;

  const matrix = object.matrixWorld.toArray();
  const position = object.position;
  const rotation = object.rotation;
  const scale = object.scale;

  const meshes: ObjectInfo['meshes'] = [];
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      const material = child.material;
      
      let vertices = 0;
      let faces = 0;
      
      if (geometry) {
        if (geometry.attributes.position) {
          vertices = geometry.attributes.position.count;
        }
        if (geometry.index) {
          faces = geometry.index.count / 3;
        } else {
          faces = vertices / 3;
        }
      }

      const meshInfo: ObjectInfo['meshes'][0] = {
        name: child.name || 'Unnamed Mesh',
        vertices,
        faces: Math.floor(faces),
      };

      if (material instanceof THREE.MeshStandardMaterial) {
        meshInfo.material = {
          name: material.name || 'Standard Material',
          color: `#${material.color.getHexString()}`,
          metalness: material.metalness,
          roughness: material.roughness,
        };
      }

      meshes.push(meshInfo);
    }
  });

  return {
    matrix,
    position: { x: position.x, y: position.y, z: position.z },
    rotation: { 
      x: THREE.MathUtils.radToDeg(rotation.x),
      y: THREE.MathUtils.radToDeg(rotation.y),
      z: THREE.MathUtils.radToDeg(rotation.z)
    },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    meshes,
  };
}

// 씬 내부 컨텐츠
const SceneContent = forwardRef<{ 
  exportScene: () => void;
  updateObjectTransform: (transform: { position?: { x?: number; y?: number; z?: number }; rotation?: { x?: number; y?: number; z?: number }; scale?: { x?: number; y?: number; z?: number } }) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}, {
  models: Array<{ url: string; id: string; name?: string }>;
  selectedModelIndex: number | null;
  onModelSelect: (index: number | null) => void;
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}>(({ 
  models, 
  selectedModelIndex,
  onModelSelect,
  onObjectInfoChange
}, ref) => {
  const { camera, gl, scene } = useThree();
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
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
  
  // 이전 정보를 저장하여 변경 감지
  const previousInfoRef = useRef<ObjectInfo | null>(null);

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
  const updateObjectTransform = React.useCallback((transform: { 
    position?: { x?: number; y?: number; z?: number }; 
    rotation?: { x?: number; y?: number; z?: number }; 
    scale?: { x?: number; y?: number; z?: number } 
  }) => {
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
  const exportScene = React.useCallback(() => {
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
  const handleSetTransformMode = React.useCallback((mode: 'translate' | 'rotate' | 'scale') => {
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

export interface ObjectInfo {
  matrix: number[];
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  meshes: Array<{
    name: string;
    vertices: number;
    faces: number;
    material?: {
      name?: string;
      color?: string;
      metalness?: number;
      roughness?: number;
    };
  }>;
}

interface Scene3DProps {
  models: Array<{ url: string; id: string; name?: string }>;
  selectedModelIndex: number | null;
  onModelSelect: (index: number | null) => void;
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}

const Scene3D = forwardRef<{ 
  exportScene: () => void;
  updateObjectTransform: (transform: { position?: { x?: number; y?: number; z?: number }; rotation?: { x?: number; y?: number; z?: number }; scale?: { x?: number; y?: number; z?: number } }) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}, Scene3DProps>(
  ({ models, selectedModelIndex, onModelSelect, onObjectInfoChange }, ref) => {
    const sceneContentRef = useRef<{ 
      exportScene: () => void;
      updateObjectTransform: (transform: { position?: { x?: number; y?: number; z?: number }; rotation?: { x?: number; y?: number; z?: number }; scale?: { x?: number; y?: number; z?: number } }) => void;
      setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    }>(null);

    // 외부 ref를 sceneContentRef에 연결
    useImperativeHandle(ref, () => ({
      exportScene: () => {
        sceneContentRef.current?.exportScene();
      },
      updateObjectTransform: (transform) => {
        sceneContentRef.current?.updateObjectTransform(transform);
      },
      setTransformMode: (mode) => {
        sceneContentRef.current?.setTransformMode(mode);
      }
    }));

    return (
      <Canvas
        camera={{ position: [0, 5, 15], fov: 50 }}
        gl={{ antialias: true }}
        style={{ background: '#1a1a1a', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneContent
            ref={sceneContentRef}
            models={models}
            selectedModelIndex={selectedModelIndex}
            onModelSelect={onModelSelect}
            onObjectInfoChange={onObjectInfoChange}
          />
        </Suspense>
      </Canvas>
    );
  }
);

Scene3D.displayName = 'Scene3D';

export default Scene3D;
