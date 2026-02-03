'use client';

import React, { Suspense, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Model } from './Model';
import { extractObjectInfo } from './utils';
import type { ObjectInfo, Model as ModelType, TransformMode, Transform, Scene3DRef, SceneContentProps } from './types';

/**
 * 3D 씬의 내부 컨텐츠 (조명, 컨트롤, 모델들)
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndex,
  selectedModelIndices = [],
  onModelSelect,
  onModelSelectMultiple,
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
  const selectionGroupRef = useRef<THREE.Group | null>(null); // 다중 선택 그룹
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // 내부 다중 선택 상태
  const prevSelectedIndicesRef = useRef<number[]>([]); // 이전 선택 인덱스 추적

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

  // 외부에서 전달된 selectedModelIndices와 동기화 (실제 변경 시에만 업데이트)
  React.useEffect(() => {
    let newIndices: number[] = [];
    
    if (selectedModelIndices && selectedModelIndices.length > 0) {
      newIndices = selectedModelIndices;
    } else if (selectedModelIndex !== null) {
      newIndices = [selectedModelIndex];
    } else {
      newIndices = [];
    }
    
    // 배열이 실제로 다를 때만 업데이트 (무한 루프 방지)
    const arraysEqual = (a: number[], b: number[]) => {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => val === b[idx]);
    };
    
    // 이전 값과 비교하여 실제로 변경되었을 때만 업데이트
    if (!arraysEqual(prevSelectedIndicesRef.current, newIndices)) {
      prevSelectedIndicesRef.current = newIndices;
      setSelectedIndices(newIndices);
    }
  }, [selectedModelIndex, selectedModelIndices]);

  // 다중 선택 그룹 생성 및 업데이트
  React.useEffect(() => {
    if (selectedIndices.length <= 1) {
      if (selectionGroupRef.current) {
        scene.remove(selectionGroupRef.current);
        selectionGroupRef.current = null;
      }
      // 단일 선택 시 상대 위치 초기화
      if (selectedIndices.length === 1) {
        const obj = modelRefs.current.get(selectedIndices[0]);
        if (obj) {
          delete obj.userData.initialRelativePos;
          delete obj.userData.initialQuaternion;
        }
      }
      return;
    }

    // 선택된 객체들의 중심점 계산
    const selectedObjects: THREE.Group[] = [];
    const positions: THREE.Vector3[] = [];
    
    selectedIndices.forEach(index => {
      const obj = modelRefs.current.get(index);
      if (obj) {
        selectedObjects.push(obj);
        obj.updateMatrixWorld(true);
        positions.push(new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld));
      }
    });

    if (selectedObjects.length === 0) return;

    // 중심점 계산
    const center = new THREE.Vector3();
    positions.forEach(pos => center.add(pos));
    center.divideScalar(positions.length);

    // 그룹 생성 또는 업데이트
    if (!selectionGroupRef.current) {
      selectionGroupRef.current = new THREE.Group();
      selectionGroupRef.current.name = 'SelectionGroup';
      scene.add(selectionGroupRef.current);
    }

    // 그룹 위치를 중심점으로 설정
    selectionGroupRef.current.position.copy(center);
    selectionGroupRef.current.rotation.set(0, 0, 0);
    selectionGroupRef.current.scale.set(1, 1, 1);

    // 각 객체의 상대 위치 저장 (항상 업데이트)
    selectedObjects.forEach((obj) => {
      const relativePos = new THREE.Vector3().subVectors(
        new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld),
        center
      );
      obj.userData.initialRelativePos = relativePos.clone();
      // 초기 회전을 쿼터니언으로 저장 (김벌락 방지)
      obj.userData.initialQuaternion = obj.quaternion.clone();
      obj.userData.initialScale = obj.scale.clone();
    });

  }, [selectedIndices, scene]);

  // TransformControls가 그룹을 조작할 때 각 객체에 변환 적용
  useFrame(() => {
    if (!selectionGroupRef.current || selectedIndices.length <= 1) return;

    const group = selectionGroupRef.current;
    group.updateMatrixWorld(true);
    const groupMatrix = group.matrixWorld;
    const groupPosition = new THREE.Vector3().setFromMatrixPosition(groupMatrix);
    const groupRotation = new THREE.Euler().setFromRotationMatrix(groupMatrix);
    const groupScale = new THREE.Vector3().setFromMatrixScale(groupMatrix);

    selectedIndices.forEach(index => {
      const obj = modelRefs.current.get(index);
      if (obj && obj.userData.initialRelativePos) {
        const relativePos = obj.userData.initialRelativePos.clone();
        const initialQuaternion = obj.userData.initialQuaternion || new THREE.Quaternion();
        const initialScale = obj.userData.initialScale || new THREE.Vector3(1, 1, 1);
        
        // 그룹의 회전을 쿼터니언으로 변환
        const groupQuaternion = new THREE.Quaternion().setFromEuler(groupRotation);
        
        // 그룹의 회전과 스케일을 상대 위치에 적용
        relativePos.applyQuaternion(groupQuaternion);
        relativePos.multiply(groupScale);
        
        // 최종 위치 = 그룹 위치 + 변환된 상대 위치
        obj.position.copy(groupPosition.clone().add(relativePos));
        
        // 회전: 쿼터니언을 사용하여 그룹 회전과 초기 회전을 합성합니다.
        // 김벌락(Gimbal Lock) 현상을 방지하기 위해 쿼터니언 곱셈 사용
        const initialQuaternionForRotation = initialQuaternion.clone();
        obj.quaternion.copy(groupQuaternion).multiply(initialQuaternionForRotation);
        
        // 스케일: 초기 스케일 * 그룹 스케일
        obj.scale.set(
          initialScale.x * groupScale.x,
          initialScale.y * groupScale.y,
          initialScale.z * groupScale.z
        );
      }
    });
  });

  // 마우스 클릭 이벤트 (다중 선택 지원)
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
        
        // 클릭한 객체의 userData에서 modelRef 찾기 또는 부모 추적
        let current: THREE.Object3D | null = clickedObject;
        while (current) {
          const currentObj: THREE.Object3D = current; // null 체크를 위한 변수
          
          // userData에 저장된 modelRef 확인
          if (currentObj.userData.modelRef) {
            modelRefs.current.forEach((group, index) => {
              if (group === currentObj.userData.modelRef) {
                foundIndex = index;
              }
            });
            if (foundIndex >= 0) break;
          }
          
          // 모델 refs를 통해 클릭한 객체가 어느 모델에 속하는지 찾기
          modelRefs.current.forEach((group, index) => {
            if (group && (group === currentObj || group.getObjectById(currentObj.id))) {
              foundIndex = index;
            }
          });
          
          if (foundIndex >= 0) break;
          
          // 부모로 이동
          current = currentObj.parent;
        }
        
        if (foundIndex >= 0) {
          const isMultiSelect = event.ctrlKey || event.metaKey; // Ctrl (Windows) 또는 Cmd (Mac)
          
          if (isMultiSelect) {
            // 다중 선택 모드
            const newIndices = selectedIndices.includes(foundIndex)
              ? selectedIndices.filter(i => i !== foundIndex) // 이미 선택된 경우 제거
              : [...selectedIndices, foundIndex]; // 추가
            setSelectedIndices(newIndices);
            if (onModelSelectMultiple) {
              onModelSelectMultiple(newIndices);
            }
          } else {
            // 단일 선택 모드
            setSelectedIndices([foundIndex]);
            onModelSelect(foundIndex);
          }
        }
      } else {
        // 빈 공간 클릭 시 선택 해제
        if (!(event.ctrlKey || event.metaKey)) {
          setSelectedIndices([]);
          onModelSelect(null);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl, scene, models, onModelSelect, onModelSelectMultiple, selectedIndices]);

  // 다중 선택이 있으면 그룹 사용, 없으면 단일 객체 사용
  const selectedObjectRef = selectedIndices.length > 1 
    ? selectionGroupRef.current 
    : selectedIndices.length === 1 
      ? modelRefs.current.get(selectedIndices[0]) || null
      : null;

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

      {/* TransformControls - 단일 또는 다중 선택 지원 */}
      {selectedObjectRef && selectedIndices.length > 0 && (
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
              nodeIndex={model.nodeIndex ?? 0}
              nodePath={model.nodePath}
              isSelected={selectedIndices.includes(index)}
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
