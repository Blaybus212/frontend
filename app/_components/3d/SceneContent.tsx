'use client';

import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneLights } from './SceneLights';
import { SceneHelpers } from './SceneHelpers';
import { exportScene } from './utils/exportUtils';
import { updateObjectTransform as updateTransform } from './utils/transformUtils';
import { useSelectionGroup } from './hooks/useSelectionGroup';
import { useGroupTransform } from './hooks/useGroupTransform';
import { useNodeTransform } from './hooks/useNodeTransform';
import { useClickHandler, type SelectedNode } from './hooks/useClickHandler';
import { useObjectInfo } from './hooks/useObjectInfo';
import { useTransformControls } from './hooks/useTransformControls';
import { useCameraAdjustment } from './hooks/useCameraAdjustment';
import { useSelectionSync } from './hooks/useSelectionSync';
import { useAssemblyDisassembly } from './hooks/useAssemblyDisassembly';
import { useRenderModeHotkeys } from './hooks/useRenderModeHotkeys';
import { useSelectionOutline } from './hooks/useSelectionOutline';
import { OrbitControlsWrapper } from './components/OrbitControlsWrapper';
import { ModelList } from './components/ModelList';
import { extractSceneState } from './utils/nodeTransformStorage';
import type { TransformMode, Transform, Scene3DRef, SceneContentProps } from './types';

/**
 * 3D 씬 내부 컨텐츠를 구성합니다.
 *
 * 조명/헬퍼, 모델 렌더링, 선택/변환, 내보내기 기능을 묶어 관리합니다.
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndices,
  onModelSelect,
  onObjectInfoChange,
  assemblyValue = 0,
}, ref) => {
  const { scene, camera } = useThree();
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  const justEndedDragRef = useRef(false);
  const selectedNodesRef = useRef<SelectedNode[] | null>(null);
  const [selectedNodesVersion, setSelectedNodesVersion] = React.useState(0);
  const [modelRefsVersion, setModelRefsVersion] = React.useState(0);
  const { renderMode, viewMode } = useRenderModeHotkeys();

  const {
    transformControlsRef,
    orbitControlsRef,
    orbitControlsEnabled,
    transformMode,
    setTransformMode,
  } = useTransformControls();

  const { selectedIndices } = useSelectionSync({
    selectedModelIndices,
  });

  const { onOrbitStart, onOrbitEnd, onModelLoaded } = useCameraAdjustment({
    models,
    modelRefs,
    orbitControlsRef,
    justEndedDragRef,
  });

  const { resetToAssembly } = useAssemblyDisassembly({
    modelRefs,
    assemblyValue,
    transformControlsRef,
    modelRefsVersion,
  });

  const selectionGroupRef = useSelectionGroup({
    selectedIndices,
    modelRefs,
    scene,
  });

  useGroupTransform({
    selectionGroupRef,
    selectedIndices,
    modelRefs,
  });

  useNodeTransform({
    selectedNodesRef,
    transformControlsRef,
  });

  useClickHandler({
    selectedIndices,
    modelRefs,
    onModelSelect,
    onNodeSelect: (nodes) => {
      selectedNodesRef.current = nodes;
      setSelectedNodesVersion((prev) => prev + 1);
    },
    transformControlsRef,
    justEndedDragRef,
  });

  const selectedObjectRef = selectedNodesRef.current && selectedNodesRef.current.length > 0
    ? selectedNodesRef.current.length === 1
      ? selectedNodesRef.current[0].nodeRef as THREE.Object3D // 단일 노드 선택 (이미 Group)
      : selectionGroupRef.current // 다중 노드 선택 (그룹 사용)
    : selectedIndices.length > 1 
      ? selectionGroupRef.current 
      : selectedIndices.length === 1 
        ? modelRefs.current.get(selectedIndices[0]) || null
        : null;

  useObjectInfo({
    selectedObjectRef,
    onObjectInfoChange,
  });

  const updateObjectTransform = useCallback((transform: Transform) => {
    updateTransform(selectedObjectRef, transform, onObjectInfoChange);
  }, [selectedObjectRef, onObjectInfoChange]);

  const handleExportScene = useCallback(() => {
    exportScene(modelRefs.current, models);
  }, [models]);

  const getSceneState = useCallback(() => {
    const orbitControlsTarget = orbitControlsRef.current?.target;
    return extractSceneState(
      modelRefs.current,
      camera,
      orbitControlsTarget,
      assemblyValue
    );
  }, [camera, orbitControlsRef, assemblyValue]);
  useSelectionOutline({
    selectedNodesRef,
    selectedNodesVersion,
    selectedIndices,
    modelRefs,
  });

  useImperativeHandle(ref, () => ({
    exportScene: handleExportScene,
    updateObjectTransform,
    setTransformMode,
    getSceneState,
    resetToAssembly,
  }));

  return (
    <>
      <SceneLights mode={viewMode === 'lit' ? 'lit' : 'dim'} />
      <SceneHelpers />

      {/* OrbitControls */}
      <OrbitControlsWrapper
        orbitControlsRef={orbitControlsRef}
        enabled={orbitControlsEnabled}
        onStart={onOrbitStart}
        onEnd={onOrbitEnd}
      />

      {/* TransformControls - 단일 또는 다중 선택 지원 */}
      {/* 개별 노드 선택 또는 모델 선택 시 TransformControls 렌더링 */}
      {selectedObjectRef && (selectedNodesRef.current && selectedNodesRef.current.length > 0 || selectedIndices.length > 0) && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedObjectRef as THREE.Object3D}
          mode={transformMode}
          showX
          showY
          showZ
          onMouseDown={() => {
            // 드래그 시작 시점의 위치 저장
            if (selectedNodesRef.current && selectedNodesRef.current.length === 1) {
              const node = selectedNodesRef.current[0].nodeRef;
              const controlledObject = transformControlsRef.current?.object;
              
              if (node && controlledObject === node) {
                // 드래그 시작 위치 저장
                node.userData.dragStartLocalPos = node.position.clone();
                node.userData.dragStartWorldPos = node.getWorldPosition(new THREE.Vector3());
                controlledObject.userData.dragStartLocalPos = controlledObject.position.clone();
                controlledObject.userData.dragStartWorldPos = controlledObject.getWorldPosition(new THREE.Vector3());
                
              }
            }
          }}
        />
      )}

      {/* 로드된 모델들 */}
      <ModelList
        models={models}
        selectedIndices={selectedIndices}
        renderMode={renderMode}
        onModelRef={(index, ref) => {
          if (ref) {
            modelRefs.current.set(index, ref);
            setModelRefsVersion((prev) => prev + 1);
          } else {
            modelRefs.current.delete(index);
            setModelRefsVersion((prev) => prev + 1);
          }
        }}
        onModelLoaded={onModelLoaded}
      />
    </>
  );
});

SceneContent.displayName = 'SceneContent';
