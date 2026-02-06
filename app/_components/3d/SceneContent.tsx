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
          onChange={() => {
            // TransformControls가 변환을 변경할 때 노드의 변환을 직접 업데이트
            // useNodeTransform 훅이 useFrame에서 처리하지만, onChange에서도 처리하여 더 확실하게 함
            if (selectedNodesRef.current && selectedNodesRef.current.length === 1) {
              const node = selectedNodesRef.current[0].nodeRef;
              const controlledObject = transformControlsRef.current?.object;

              if (node && controlledObject === node) {
                // TransformControls가 변경한 변환을 노드에 직접 적용
                // TransformControls는 객체의 월드 좌표계에서 변환을 수행하지만,
                // 객체의 로컬 position을 변경합니다.
                // 노드가 부모를 가지고 있으면, TransformControls가 변경한 월드 위치를
                // 로컬 위치로 변환해야 합니다.
                
                // 드래그 시작 위치 가져오기 (없으면 현재 위치 사용)
                const controlledDragStartLocalPos = controlledObject.userData.dragStartLocalPos || controlledObject.position.clone();
                
                // TransformControls가 실제로 변경했는지 확인 (드래그 시작 위치와 비교)
                const controlledLocalChanged = !controlledDragStartLocalPos.equals(controlledObject.position);
                
                // TransformControls가 로컬 position을 변경했으면 노드에 적용
                if (controlledLocalChanged) {
                  // TransformControls가 변경한 로컬 position을 노드에 직접 적용
                  node.position.copy(controlledObject.position);
                  node.rotation.copy(controlledObject.rotation);
                  node.scale.copy(controlledObject.scale);
                  
                  // 매트릭스 업데이트
                  node.updateMatrix();
                  node.updateMatrixWorld(true);
                  
                }
                
                
                // 사용자가 변경한 위치를 userData에 저장 (useAssemblyDisassembly가 덮어쓰지 않도록)
                if (!node.userData.userModifiedPosition) {
                  node.userData.userModifiedPosition = new THREE.Vector3();
                }
                node.userData.userModifiedPosition.copy(node.position);
                
                if (!node.userData.userModifiedRotation) {
                  node.userData.userModifiedRotation = new THREE.Euler();
                }
                node.userData.userModifiedRotation.copy(node.rotation);
                
                if (!node.userData.userModifiedScale) {
                  node.userData.userModifiedScale = new THREE.Vector3();
                }
                node.userData.userModifiedScale.copy(node.scale);
                
                // 사용자가 수정했음을 표시
                node.userData.isUserModified = true;
                
                // 매트릭스 업데이트
                node.updateMatrix();
                node.updateMatrixWorld(true);
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
