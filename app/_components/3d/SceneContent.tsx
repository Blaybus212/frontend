'use client';

import React, { Suspense, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Model } from './Model';
import { SceneLights } from './SceneLights';
import { SceneHelpers } from './SceneHelpers';
import { arraysEqual } from './utils';
import { exportScene } from './utils/exportUtils';
import { updateObjectTransform as updateTransform } from './utils/transformUtils';
import { useSelectionGroup } from './hooks/useSelectionGroup';
import { useGroupTransform } from './hooks/useGroupTransform';
import { useClickHandler } from './hooks/useClickHandler';
import { useObjectInfo } from './hooks/useObjectInfo';
import { useTransformControls } from './hooks/useTransformControls';
import type { Model as ModelType, TransformMode, Transform, Scene3DRef, SceneContentProps } from './types';

/**
 * 3D 씬의 내부 컨텐츠 컴포넌트
 * 
 * 이 컴포넌트는 3D 씬의 모든 요소를 관리하는 메인 컴포넌트입니다.
 * 
 * 주요 기능:
 * - 조명과 헬퍼 렌더링
 * - 모델 로드 및 렌더링
 * - 모델 선택 관리 (단일/다중 선택)
 * - TransformControls와 OrbitControls 관리
 * - 객체 변환 업데이트
 * - 씬 내보내기
 * 
 * 여러 커스텀 훅을 사용하여 각 기능을 모듈화하여 관리합니다.
 * 
 * @param props - 컴포넌트의 props
 * @param props.models - 렌더링할 모델 배열
 * @param props.selectedModelIndices - 선택된 모델 인덱스 배열
 * @param props.onModelSelect - 모델 선택 변경 콜백
 * @param props.onObjectInfoChange - 객체 정보 변경 콜백
 * @param ref - 부모 컴포넌트에서 접근할 수 있는 ref (exportScene, updateObjectTransform, setTransformMode 제공)
 * 
 * @example
 * ```tsx
 * <SceneContent
 *   models={models}
 *   selectedModelIndices={[0, 1]}
 *   onModelSelect={(indices) => setSelectedIndices(indices)}
 *   onObjectInfoChange={(info) => setObjectInfo(info)}
 * />
 * ```
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndices,
  onModelSelect,
  onObjectInfoChange
}, ref) => {
  /** Three.js 씬 객체, 카메라 */
  const { scene, camera } = useThree();
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  /** 내부 다중 선택 상태 (외부 props와 동기화됨) */
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  /** 이전 선택 인덱스를 추적하여 불필요한 업데이트 방지 */
  const prevSelectedIndicesRef = useRef<number[]>([]);
  /** 카메라가 이미 자동 조정되었는지 여부 */
  const cameraAdjustedRef = useRef(false);
  /** 카메라 애니메이션 타겟 위치 */
  const targetCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  /** OrbitControls 타겟 위치 */
  const targetControlsTargetRef = useRef<THREE.Vector3 | null>(null);
  /** 카메라 애니메이션 진행 중 여부 */
  const isAnimatingRef = useRef(false);
  /** OrbitControls가 방금 드래그를 끝냈는지 여부 (클릭 이벤트와의 충돌 방지) */
  const justEndedDragRef = useRef(false);

  // TransformControls와 OrbitControls 관리
  // 드래그 중 OrbitControls를 자동으로 비활성화합니다
  const {
    transformControlsRef,
    orbitControlsRef,
    orbitControlsEnabled,
    transformMode,
    setTransformMode,
  } = useTransformControls();

  /**
   * 외부에서 전달된 selectedModelIndices와 내부 상태를 동기화합니다
   * 
   * 이전 값과 비교하여 실제로 변경되었을 때만 업데이트하여
   * 무한 루프를 방지합니다.
   */
  React.useEffect(() => {
    if (!arraysEqual(prevSelectedIndicesRef.current, selectedModelIndices)) {
      prevSelectedIndicesRef.current = selectedModelIndices;
      setSelectedIndices(selectedModelIndices);
    }
  }, [selectedModelIndices]);

  // 다중 선택 그룹 관리
  // 2개 이상의 객체가 선택되면 그룹을 생성하고 중심점을 계산합니다
  const selectionGroupRef = useSelectionGroup({
    selectedIndices,
    modelRefs,
    scene,
  });

  // 그룹 변환 적용
  // TransformControls로 그룹을 조작할 때 각 객체에 변환을 적용합니다
  useGroupTransform({
    selectionGroupRef,
    selectedIndices,
    modelRefs,
  });

  // 클릭 이벤트 처리
  // 레이캐스팅을 사용하여 클릭한 객체를 찾고 선택 상태를 관리합니다
  useClickHandler({
    selectedIndices,
    modelRefs,
    onModelSelect,
    transformControlsRef,
    justEndedDragRef,
  });

  /**
   * 현재 선택된 객체의 참조를 계산합니다
   * 
   * - 다중 선택: 선택 그룹 사용
   * - 단일 선택: 해당 모델 그룹 사용
   * - 선택 없음: null
   */
  const selectedObjectRef = selectedIndices.length > 1 
    ? selectionGroupRef.current 
    : selectedIndices.length === 1 
      ? modelRefs.current.get(selectedIndices[0]) || null
      : null;

  // 객체 정보 추출 및 전달
  // 선택된 객체의 정보를 추출하여 외부 컴포넌트에 전달합니다
  useObjectInfo({
    selectedObjectRef,
    onObjectInfoChange,
  });

  /**
   * 객체의 변환(위치, 회전, 스케일)을 업데이트하는 함수
   * 
   * 외부에서 호출 가능하도록 ref를 통해 노출됩니다.
   * 
   * @param transform - 적용할 변환 값
   */
  const updateObjectTransform = useCallback((transform: Transform) => {
    updateTransform(selectedObjectRef, transform, onObjectInfoChange);
  }, [selectedObjectRef, onObjectInfoChange]);

  /**
   * 씬을 GLTF/GLB 파일로 내보내는 함수
   * 
   * 외부에서 호출 가능하도록 ref를 통해 노출됩니다.
   */
  const handleExportScene = useCallback(() => {
    exportScene(modelRefs.current, models);
  }, [models]);

  /**
   * 모든 모델의 바운딩 박스를 계산하여 카메라를 자동으로 조정하는 함수
   * 최초 로딩 시에만 한 번 실행됩니다.
   */
  const adjustCameraToModels = useCallback(() => {
    // 모델이 없거나 이미 조정되었거나 애니메이션 중이면 스킵
    if (models.length === 0 || cameraAdjustedRef.current || isAnimatingRef.current) return;
    
    // 모든 모델이 로드되었는지 확인
    const allModelsLoaded = models.every((_, index) => modelRefs.current.has(index));
    if (!allModelsLoaded) return;

    // 모든 모델의 바운딩 박스 계산
    const box = new THREE.Box3();
    let hasGeometry = false;

    modelRefs.current.forEach((modelRef) => {
      if (modelRef) {
        // 전체 그룹의 바운딩 박스 계산
        const modelBox = new THREE.Box3().setFromObject(modelRef);
        if (!modelBox.isEmpty()) {
          if (hasGeometry) {
            box.union(modelBox);
          } else {
            box.copy(modelBox);
            hasGeometry = true;
          }
        }
      }
    });

    // 바운딩 박스가 유효한 경우에만 카메라 조정
    if (hasGeometry && !box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // 가장 긴 축을 기준으로 거리 계산
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 1; // 거리를 조금 줄임 (2.5 -> 2.0)
      
      // 45도 각도로 바라보기 위한 높이와 거리 계산
      // 45도 = tan(45) = 1, 따라서 높이와 수평 거리가 같아야 함
      const height = distance * 0.8; // 높이를 조금 낮춤
      const horizontalDistance = distance; // 수평 거리
      
      // 카메라 위치 설정 (45도 각도로 위에서 바라보도록)
      const cameraPosition = new THREE.Vector3(
        center.x,
        center.y + height, // 위에서 (조금 낮춤)
        center.z + horizontalDistance // 뒤에서 (조금 가깝게)
      );
      
      // 애니메이션을 위해 타겟 위치 저장
      targetCameraPositionRef.current = cameraPosition;
      targetControlsTargetRef.current = center;
      isAnimatingRef.current = true;
      
      // cameraAdjustedRef는 애니메이션이 완료된 후에 설정되어야 함
      // 여기서는 설정하지 않음 (애니메이션이 시작되도록 하기 위해)
    }
  }, [models, camera, orbitControlsRef]);

  /**
   * 모델이 변경되면 카메라 조정을 시도합니다
   */
  React.useEffect(() => {
    cameraAdjustedRef.current = false;
    isAnimatingRef.current = false;
    targetCameraPositionRef.current = null;
    targetControlsTargetRef.current = null;
    // 약간의 지연 후 카메라 조정 시도 (모델이 완전히 렌더링될 시간을 줌)
    const timeoutId = setTimeout(() => {
      adjustCameraToModels();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [models.length, adjustCameraToModels]);

  /**
   * 카메라를 부드럽게 애니메이션합니다
   * useFrame을 사용하여 매 프레임마다 카메라 위치를 보간합니다
   */
  useFrame((state, delta) => {
    // 사용자가 이미 카메라를 조작했거나 애니메이션이 비활성화된 경우 완전히 스킵
    if (cameraAdjustedRef.current || !isAnimatingRef.current || !targetCameraPositionRef.current || !targetControlsTargetRef.current) {
      return;
    }

    const camera = state.camera;
    const targetPos = targetCameraPositionRef.current;
    const targetTarget = targetControlsTargetRef.current;
    
    // 현재 위치와 타겟 위치 사이의 거리 계산
    const distanceToTarget = camera.position.distanceTo(targetPos);
    const targetDistance = orbitControlsRef.current?.target.distanceTo(targetTarget) || 0;
    
    // 거리가 매우 작으면 애니메이션 완료
    if (distanceToTarget < 0.01 && targetDistance < 0.01) {
      // 최종 위치로 정확히 설정
      camera.position.copy(targetPos);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(targetTarget);
        orbitControlsRef.current.update();
      }
      
      // 애니메이션 완료 후 모든 애니메이션 관련 상태 완전히 제거
      // 이후 useFrame에서 애니메이션 로직이 실행되지 않도록 보장
      isAnimatingRef.current = false;
      targetCameraPositionRef.current = null;
      targetControlsTargetRef.current = null;
      // 애니메이션이 완료되었으므로 더 이상 자동 조정하지 않음
      cameraAdjustedRef.current = true;
      
      // OrbitControls의 damping이 다시 이동시키지 않도록 현재 상태를 확실히 고정
      // update()를 한 번 더 호출하여 현재 상태를 확정
      if (orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }
      
      return;
    }

    // Lerp를 사용하여 부드럽게 이동 (속도 조절 가능)
    const lerpFactor = Math.min(1, delta * 5); // delta * 5로 속도 조절 (값이 클수록 빠름)
    camera.position.lerp(targetPos, lerpFactor);
    
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.lerp(targetTarget, lerpFactor);
      orbitControlsRef.current.update();
    }
  });

  /**
   * 부모 컴포넌트에서 접근할 수 있는 함수들을 노출합니다
   * 
   * useImperativeHandle을 사용하여 ref를 통해 다음 함수들을 제공합니다:
   * - exportScene: 씬 내보내기
   * - updateObjectTransform: 객체 변환 업데이트
   * - setTransformMode: 변환 모드 설정
   */
  useImperativeHandle(ref, () => ({
    exportScene: handleExportScene,
    updateObjectTransform,
    setTransformMode,
  }));

  return (
    <>
      <SceneLights />
      <SceneHelpers />

      {/* OrbitControls */}
      <OrbitControls
        ref={orbitControlsRef}
        enabled={orbitControlsEnabled}
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
        onStart={() => {
          // 사용자가 카메라 조작을 시작하면 자동 카메라 조정을 완전히 중단하고 타겟 위치 초기화
          // 이후 다시 자동 조정이 되지 않도록 보장
          isAnimatingRef.current = false;
          targetCameraPositionRef.current = null;
          targetControlsTargetRef.current = null;
          justEndedDragRef.current = false;
          
          // 사용자가 조작했으므로 더 이상 자동 조정하지 않음
          cameraAdjustedRef.current = true;
        }}
        onEnd={() => {
          // 드래그 종료 시(마우스를 뗄 때)에도 애니메이션 타겟을 완전히 제거하여
          // 클릭 이벤트나 damping으로 인해 다시 돌아가지 않도록 보장
          // 즉시 실행하여 클릭 이벤트보다 먼저 처리되도록 함
          isAnimatingRef.current = false;
          targetCameraPositionRef.current = null;
          targetControlsTargetRef.current = null;
          // 사용자가 조작했으므로 더 이상 자동 조정하지 않음
          cameraAdjustedRef.current = true;
          // 드래그가 방금 끝났음을 표시 (클릭 이벤트 핸들러에서 확인)
          justEndedDragRef.current = true;
          
          // OrbitControls의 타겟을 현재 상태로 확실히 고정
          if (orbitControlsRef.current) {
            orbitControlsRef.current.update();
          }
          
          // 짧은 시간 후 플래그 리셋 (클릭 이벤트 처리 후)
          setTimeout(() => {
            justEndedDragRef.current = false;
          }, 100);
        }}
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
                  // 모델이 로드되면 카메라 조정 시도
                  if (!cameraAdjustedRef.current) {
                    requestAnimationFrame(() => {
                      adjustCameraToModels();
                    });
                  }
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
