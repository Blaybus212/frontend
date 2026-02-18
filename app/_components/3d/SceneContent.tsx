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
import {
  SELECTION_SYNC_DELAY_MS,
  TRANSFORM_HOTKEYS,
  ZOOM_SCALE,
  FOCUS_ANIMATION_DURATION_MS,
  FOCUS_DISTANCE_MULTIPLIER,
} from './constants';
import { captureObjectSnapshotImage, captureSceneSnapshotImage } from './utils/snapshotUtils';
import type { TransformMode, Transform, Scene3DRef, SceneContentProps, SelectablePart } from './types';

/**
 * 3D 씬 메인 컨텐츠 (조명, 헬퍼, 모델, 선택/변환, 스냅샷, 내보내기)
 * @remarks forwardRef로 Scene3DRef 메서드 노출
 */
export const SceneContent = forwardRef<Scene3DRef, SceneContentProps>(({ 
  models, 
  selectedModelIndices,
  onModelSelect,
  onSelectedNodeIdsChange,
  onObjectInfoChange,
  onSelectablePartsChange,
  assemblyValue = 0,
}, ref) => {
  const { scene, camera, gl } = useThree();
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  const justEndedDragRef = useRef(false);
  const selectedNodesRef = useRef<SelectedNode[] | null>(null);
  const [selectedNodesVersion, setSelectedNodesVersion] = React.useState(0);
  const [modelRefsVersion, setModelRefsVersion] = React.useState(0);
  const [nodeGroupVersion, setNodeGroupVersion] = React.useState(0);
  const { renderMode, viewMode, setRenderMode, setViewMode } = useRenderModeHotkeys();
  const wasDraggingRef = useRef(false);
  const lastSelectablePartsKeyRef = useRef<string>('');

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

      if (event.key === TRANSFORM_HOTKEYS.TRANSLATE) {
        event.preventDefault();
        setTransformMode('translate');
      } else if (event.key === TRANSFORM_HOTKEYS.ROTATE) {
        event.preventDefault();
        setTransformMode('rotate');
      } else if (event.key === TRANSFORM_HOTKEYS.SCALE) {
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

  const { resetToAssembly, getDisassemblyOffsetForNode } = useAssemblyDisassembly({
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
    getDisassemblyOffsetForNode,
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
    zoomCamera(ZOOM_SCALE.IN);
  }, [zoomCamera]);

  const zoomOut = useCallback(() => {
    zoomCamera(ZOOM_SCALE.OUT);
  }, [zoomCamera]);

  const findNodeById = useCallback(
    (nodeId: string) => {
      let found: THREE.Object3D | null = null;
      modelRefs.current.forEach((modelRef) => {
        if (!modelRef || found) return;
        modelRef.traverse((node) => {
          if (found) return;
          if (node.userData?.nodeId === nodeId) {
            found = node as THREE.Object3D;
          }
        });
      });
      return found;
    },
    [modelRefsVersion]
  );

  const findModelRootById = useCallback(
    (modelId: string) => {
      let found: THREE.Group | null = null;
      models.forEach((model, index) => {
        if (found || model.id !== modelId) return;
        const modelRef = modelRefs.current.get(index);
        if (modelRef) {
          found = modelRef;
        }
      });
      return found;
    },
    [models, modelRefsVersion]
  );

  const captureObjectSnapshot = useCallback(
    async (
      targetObject: THREE.Object3D,
      options?: { includeOnlyTarget?: boolean; viewMode?: 'lit' | 'dim'; renderMode?: 'normal' | 'wireframe' }
    ) => {
      return captureObjectSnapshotImage(
        targetObject,
        camera as THREE.PerspectiveCamera,
        gl,
        options
      );
    },
    [camera, gl]
  );

  const focusOnAllModels = useCallback(() => {
    const box = new THREE.Box3();
    let hasGeometry = false;

    modelRefs.current.forEach((modelRef) => {
      if (!modelRef) return;
      const modelBox = new THREE.Box3().setFromObject(modelRef);
      if (modelBox.isEmpty()) return;
      if (hasGeometry) {
        box.union(modelBox);
      } else {
        box.copy(modelBox);
        hasGeometry = true;
      }
    });

    if (!hasGeometry || box.isEmpty()) return false;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = perspective.fov || 50;
    const distance =
      (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))) * FOCUS_DISTANCE_MULTIPLIER;

    const controls = orbitControlsRef.current;
    const currentTarget = controls?.target ?? center.clone();
    const direction = camera.position.clone().sub(currentTarget).normalize();
    const targetPosition = center.clone().add(direction.multiplyScalar(distance));

    const startPosition = camera.position.clone();
    const startTarget = (controls?.target ?? center).clone();
    const duration = FOCUS_ANIMATION_DURATION_MS.ALL_MODELS;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(startPosition, targetPosition, eased);
      if (controls) {
        controls.target.lerpVectors(startTarget, center, eased);
        controls.update();
      } else {
        camera.lookAt(center);
      }
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    return true;
  }, [camera, orbitControlsRef]);

  const focusOnNodeId = useCallback(
    (nodeId: string) => {
      const targetNode = findNodeById(nodeId);
      if (!targetNode) return;

      const box = new THREE.Box3().setFromObject(targetNode);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const perspective = camera as THREE.PerspectiveCamera;
      const fov = perspective.fov || 50;
      const distance =
        (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))) * FOCUS_DISTANCE_MULTIPLIER;

      const controls = orbitControlsRef.current;
      const currentTarget = controls?.target ?? center.clone();
      const direction = camera.position.clone().sub(currentTarget).normalize();
      const targetPosition = center.clone().add(direction.multiplyScalar(distance));

      const startPosition = camera.position.clone();
      const startTarget = (controls?.target ?? center).clone();
      const duration = FOCUS_ANIMATION_DURATION_MS.NODE;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        camera.position.lerpVectors(startPosition, targetPosition, eased);
        if (controls) {
          controls.target.lerpVectors(startTarget, center, eased);
          controls.update();
        } else {
          camera.lookAt(center);
        }
        if (t < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },
    [camera, findNodeById, orbitControlsRef]
  );

  const capturePartSnapshots = useCallback(
    async (nodeId: string): Promise<[string | null, string | null, string | null]> => {
      const targetNode = findNodeById(nodeId) as THREE.Object3D | null;
      if (!targetNode) return [null, null, null] as [null, null, null];
      const lit = await captureObjectSnapshot(targetNode, {
        includeOnlyTarget: true,
        viewMode: 'lit',
        renderMode: 'normal',
      });
      const dim = await captureObjectSnapshot(targetNode, {
        includeOnlyTarget: true,
        viewMode: 'dim',
        renderMode: 'normal',
      });
      const wireframe = await captureObjectSnapshot(targetNode, {
        includeOnlyTarget: true,
        viewMode: 'lit',
        renderMode: 'wireframe',
      });
      return [lit, dim, wireframe] as [string | null, string | null, string | null];
    },
    [captureObjectSnapshot, findNodeById]
  );

  const captureModelSnapshots = useCallback(
    async (modelId: string): Promise<[string | null, string | null, string | null]> => {
      const modelRoot = findModelRootById(modelId);
      if (!modelRoot) return [null, null, null] as [null, null, null];
      const lit = await captureObjectSnapshot(modelRoot, {
        includeOnlyTarget: false,
        viewMode: 'lit',
        renderMode: 'normal',
      });
      const dim = await captureObjectSnapshot(modelRoot, {
        includeOnlyTarget: false,
        viewMode: 'dim',
        renderMode: 'normal',
      });
      const wireframe = await captureObjectSnapshot(modelRoot, {
        includeOnlyTarget: false,
        viewMode: 'lit',
        renderMode: 'wireframe',
      });
      return [lit, dim, wireframe] as [string | null, string | null, string | null];
    },
    [captureObjectSnapshot, findModelRootById]
  );

  const waitForNextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  const captureCurrentViewSnapshots = useCallback(
    async (): Promise<[string | null, string | null, string | null]> => {
      const prevViewMode = viewMode;
      const prevRenderMode = renderMode;

      const captureWithModes = async (
        nextViewMode: 'lit' | 'dim',
        nextRenderMode: 'normal' | 'wireframe'
      ) => {
        setViewMode(nextViewMode);
        setRenderMode(nextRenderMode);
        await waitForNextFrame();
        return captureSceneSnapshotImage(scene, camera as THREE.PerspectiveCamera, gl);
      };

      const lit = await captureWithModes('lit', 'normal');
      const dim = await captureWithModes('dim', 'normal');
      const wireframe = await captureWithModes('lit', 'wireframe');

      setViewMode(prevViewMode);
      setRenderMode(prevRenderMode);
      await waitForNextFrame();

      return [lit, dim, wireframe] as [string | null, string | null, string | null];
    },
    [camera, gl, renderMode, scene, setRenderMode, setViewMode, viewMode]
  );

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
            originalName: node.userData?.originalName || node.name,
            modelIndex,
            texture: node.userData?.texture,
            dbId: node.userData?.dbId,
            partDescription: node.userData?.description,
          });
        }
      });
    });
    
    return Array.from(partsMap.values());
  }, [modelRefsVersion]);

  React.useEffect(() => {
    if (!onSelectablePartsChange) return;
    const list = getSelectableParts();
    
    // 부품이 없어도 콜백 호출 (빈 배열 전달)
    const nextKey = list.length > 0 
      ? list.map((part) => part.nodeId).sort().join('|')
      : 'empty';
    
    if (nextKey === lastSelectablePartsKeyRef.current) return;
    
    lastSelectablePartsKeyRef.current = nextKey;
    onSelectablePartsChange(list);
  }, [getSelectableParts, onSelectablePartsChange, modelRefsVersion]);

  const getModelRootName = useCallback(() => {
    const firstModel = models[0];
    if (!firstModel) return null;
    const modelRef = modelRefs.current.get(0);
    if (!modelRef) return null;
    const name = modelRef.name || modelRef.userData?.name;
    if (typeof name === 'string' && name.trim().length > 0) return name;
    return firstModel.id;
  }, [models]);

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
        }, SELECTION_SYNC_DELAY_MS);
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
    capturePartSnapshots,
    captureModelSnapshots,
    captureCurrentViewSnapshots,
    focusOnNodeId,
    focusOnAllModels,
    getModelRootName,
  }));

  return (
    <>
      <SceneLights mode={viewMode === 'lit' ? 'lit' : 'dim'} />
      <SceneHelpers />
      <OrbitControlsWrapper
        orbitControlsRef={orbitControlsRef}
        enabled={orbitControlsEnabled}
        onStart={onOrbitStart}
        onEnd={onOrbitEnd}
      />
      {selectedObjectRef && (selectedNodesRef.current && selectedNodesRef.current.length > 0 || selectedIndices.length > 0) && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedObjectRef as THREE.Object3D}
          mode={transformMode}
          showX
          showY
          showZ
          onMouseDown={() => {
            if (selectedNodesRef.current && selectedNodesRef.current.length === 1) {
              const node = selectedNodesRef.current[0].nodeRef;
              const controlledObject = transformControlsRef.current?.object;
              
              if (node && controlledObject === node) {
                node.userData.dragStartLocalPos = node.position.clone();
                node.userData.dragStartWorldPos = node.getWorldPosition(new THREE.Vector3());
                controlledObject.userData.dragStartLocalPos = controlledObject.position.clone();
                controlledObject.userData.dragStartWorldPos = controlledObject.getWorldPosition(new THREE.Vector3());
                
              }
            }
          }}
        />
      )}
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
