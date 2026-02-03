'use client';

import React, { Suspense, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
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
  /** Three.js 씬 객체 */
  const { scene } = useThree();
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  /** 내부 다중 선택 상태 (외부 props와 동기화됨) */
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  /** 이전 선택 인덱스를 추적하여 불필요한 업데이트 방지 */
  const prevSelectedIndicesRef = useRef<number[]>([]);

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
