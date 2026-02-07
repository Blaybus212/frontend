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
import { useNodeSelectionGroup } from './hooks/useNodeSelectionGroup';
import { useNodeGroupTransform } from './hooks/useNodeGroupTransform';
import { OrbitControlsWrapper } from './components/OrbitControlsWrapper';
import { ModelList } from './components/ModelList';
import { extractSceneState } from './utils/nodeTransformStorage';
import type { TransformMode, Transform, Scene3DRef, SceneContentProps, SelectablePart } from './types';

/**
 * 3D 씬 내부 컨텐츠를 구성합니다.
 *
 * 조명/헬퍼, 모델 렌더링, 선택/변환, 내보내기 기능을 묶어 관리합니다.
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndices,
  onModelSelect,
  onSelectedNodeIdsChange,
  onObjectInfoChange,
  assemblyValue = 0,
}, ref) => {
  const { scene, camera } = useThree();
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  const justEndedDragRef = useRef(false);
  const selectedNodesRef = useRef<SelectedNode[] | null>(null);
  const [selectedNodesVersion, setSelectedNodesVersion] = React.useState(0);
  const [modelRefsVersion, setModelRefsVersion] = React.useState(0);
  const [nodeGroupVersion, setNodeGroupVersion] = React.useState(0);
  const { renderMode, viewMode } = useRenderModeHotkeys();
  const wasDraggingRef = useRef(false);

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

  React.useEffect(() => {
    const handleTransformHotkeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        const isEditable =
          tagName === 'input' ||
          tagName === 'textarea' ||
          (target as HTMLElement).isContentEditable;
        if (isEditable) return;
      }

      if (event.key === '4') {
        event.preventDefault();
        setTransformMode('translate');
      } else if (event.key === '5') {
        event.preventDefault();
        setTransformMode('rotate');
      } else if (event.key === '6') {
        event.preventDefault();
        setTransformMode('scale');
      }
    };

    window.addEventListener('keydown', handleTransformHotkeys);
    return () => {
      window.removeEventListener('keydown', handleTransformHotkeys);
    };
  }, [setTransformMode]);

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

  const nodeSelectionGroupRef = useNodeSelectionGroup({
    selectedNodesRef,
    selectedNodesVersion,
    scene,
    onGroupChanged: () => setNodeGroupVersion((prev) => prev + 1),
    transformControlsRef,
  });

  useNodeGroupTransform({
    selectionGroupRef: nodeSelectionGroupRef,
    selectedNodesRef,
    selectedNodesVersion,
    transformControlsRef,
  });

  useNodeTransform({
    selectedNodesRef,
    transformControlsRef,
  });

  const getSelectedNodeIds = useCallback(() => {
    const nodes = selectedNodesRef.current || [];
    return nodes.map((node) => node.nodeId);
  }, []);

  const areSameIds = useCallback((a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    for (const id of b) {
      if (!setA.has(id)) return false;
    }
    return true;
  }, []);

  useClickHandler({
    selectedIndices,
    modelRefs,
    onModelSelect,
    onNodeSelect: (nodes) => {
      selectedNodesRef.current = nodes;
      setSelectedNodesVersion((prev) => prev + 1);
      const nodeIds = (nodes || []).map((node) => node.nodeId);
      onSelectedNodeIdsChange?.(nodeIds);
    },
    transformControlsRef,
    justEndedDragRef,
  });

  let selectedObjectRef: THREE.Object3D | THREE.Group | null = null;
  if (selectedNodesRef.current && selectedNodesRef.current.length > 0) {
    selectedObjectRef = selectedNodesRef.current.length === 1
      ? selectedNodesRef.current[0].nodeRef as THREE.Object3D
      : nodeSelectionGroupRef.current;
  } else if (selectedIndices.length > 1) {
    selectedObjectRef = selectionGroupRef.current;
  } else if (selectedIndices.length === 1) {
    selectedObjectRef = modelRefs.current.get(selectedIndices[0]) || null;
  }

  useObjectInfo({
    selectedObjectRef,
    onObjectInfoChange,
  });

  const updateObjectTransform = useCallback((transform: Transform) => {
    updateTransform(selectedObjectRef, transform, onObjectInfoChange);
  }, [selectedObjectRef, onObjectInfoChange]);

  const zoomCamera = useCallback(
    (scale: number) => {
      const controls = orbitControlsRef.current;
      const target = controls?.target ?? new THREE.Vector3();
      const offset = camera.position.clone().sub(target);
      if (offset.lengthSq() === 0) return;

      const nextPosition = target.clone().add(offset.multiplyScalar(scale));
      camera.position.copy(nextPosition);
      camera.updateProjectionMatrix();
      controls?.update();
    },
    [camera, orbitControlsRef]
  );

  const zoomIn = useCallback(() => {
    zoomCamera(0.9);
  }, [zoomCamera]);

  const zoomOut = useCallback(() => {
    zoomCamera(1.1);
  }, [zoomCamera]);

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

  const getSelectableParts = useCallback((): SelectablePart[] => {
    const partsMap = new Map<string, SelectablePart>();
    modelRefs.current.forEach((modelRef, modelIndex) => {
      if (!modelRef) return;
      modelRef.traverse((node) => {
        const nodeId = node.userData?.nodeId;
        const selectable = node.userData?.selectable === true;
        if (!nodeId || !selectable) return;
        if (!partsMap.has(nodeId)) {
          partsMap.set(nodeId, {
            nodeId,
            nodeName: node.userData?.nodeName || node.name || nodeId,
            modelIndex,
          });
        }
      });
    });
    return Array.from(partsMap.values());
  }, [modelRefsVersion]);

  const setSelectedNodeIds = useCallback(
    (nodeIds: string[]) => {
      const currentIds = getSelectedNodeIds();
      if (areSameIds(currentIds, nodeIds)) {
        return;
      }

      if (!nodeIds.length) {
        selectedNodesRef.current = null;
        setSelectedNodesVersion((prev) => prev + 1);
        onModelSelect([]);
        onSelectedNodeIdsChange?.([]);
        return;
      }

      const targetIds = new Set(nodeIds);
      const selectedNodesMap = new Map<string, SelectedNode>();

      modelRefs.current.forEach((modelRef, modelIndex) => {
        if (!modelRef) return;
        modelRef.traverse((node) => {
          const nodeId = node.userData?.nodeId;
          const selectable = node.userData?.selectable === true;
          if (!nodeId || !selectable || !targetIds.has(nodeId)) return;

          const existing = selectedNodesMap.get(nodeId);
          const isGroup = node instanceof THREE.Group;
          if (!existing || (isGroup && !(existing.nodeRef instanceof THREE.Group))) {
            selectedNodesMap.set(nodeId, {
              modelIndex,
              nodeId,
              nodeRef: node,
            });
          }
        });
      });

      const selectedNodes = Array.from(selectedNodesMap.values());
      selectedNodesRef.current = selectedNodes.length ? selectedNodes : null;
      setSelectedNodesVersion((prev) => prev + 1);
      const modelIndices = Array.from(new Set(selectedNodes.map((n) => n.modelIndex)));
      onModelSelect(modelIndices);
      onSelectedNodeIdsChange?.(selectedNodes.map((node) => node.nodeId));
    },
    [areSameIds, getSelectedNodeIds, onModelSelect, onSelectedNodeIdsChange]
  );

  const handleResetToAssembly = useCallback(() => {
    // 선택 여부와 상관없이 원상 복귀하도록 선택 상태를 초기화
    selectedNodesRef.current = null;
    setSelectedNodesVersion((prev) => prev + 1);
    onModelSelect([]);
    onSelectedNodeIdsChange?.([]);
    resetToAssembly();
  }, [onModelSelect, onSelectedNodeIdsChange, resetToAssembly]);
  useSelectionOutline({
    selectedNodesRef,
    selectedNodesVersion,
    selectedIndices,
    modelRefs,
  });

  React.useEffect(() => {
    const controls = transformControlsRef.current;
    if (!controls) return;

    const handleDraggingChanged = (event: { value: boolean }) => {
      if (event.value) {
        wasDraggingRef.current = true;
        return;
      }
      if (wasDraggingRef.current) {
        justEndedDragRef.current = true;
        setTimeout(() => {
          justEndedDragRef.current = false;
        }, 80);
      }
      wasDraggingRef.current = false;
    };

    controls.addEventListener('dragging-changed', handleDraggingChanged);
    return () => {
      controls.removeEventListener('dragging-changed', handleDraggingChanged);
    };
  }, [transformControlsRef, justEndedDragRef]);

  useImperativeHandle(ref, () => ({
    exportScene: handleExportScene,
    updateObjectTransform,
    setTransformMode,
    getSceneState,
    resetToAssembly: handleResetToAssembly,
    getSelectableParts,
    setSelectedNodeIds,
    zoomIn,
    zoomOut,
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
