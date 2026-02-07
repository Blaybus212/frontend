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
  const { scene, camera, gl } = useThree();
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  const justEndedDragRef = useRef(false);
  const selectedNodesRef = useRef<SelectedNode[] | null>(null);
  const [selectedNodesVersion, setSelectedNodesVersion] = React.useState(0);
  const [modelRefsVersion, setModelRefsVersion] = React.useState(0);
  const [nodeGroupVersion, setNodeGroupVersion] = React.useState(0);
  const { renderMode, viewMode, setRenderMode, setViewMode } = useRenderModeHotkeys();
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
      options?: { includeOnlyTarget?: boolean; viewMode?: 'lit' | 'dim' | 'wireframe'; renderMode?: 'normal' | 'wireframe' }
    ) => {
      const mode = options?.viewMode ?? 'lit';
      const renderStyle = options?.renderMode ?? 'normal';

      targetObject.updateWorldMatrix(true, true);
      const userDataMap = new Map<THREE.Object3D, any>();
      targetObject.traverse((obj) => {
        userDataMap.set(obj, obj.userData);
        obj.userData = {};
      });
      let clone: THREE.Object3D;
      try {
        clone = targetObject.clone(true);
      } finally {
        userDataMap.forEach((data, obj) => {
          obj.userData = data;
        });
      }
      clone.applyMatrix4(targetObject.matrixWorld);

      clone.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const mesh = obj as THREE.Mesh;
        const original = mesh.material;
        const cloneMaterial = (mat?: THREE.Material): THREE.Material =>
          mat ? mat.clone() : new THREE.MeshStandardMaterial();
        if (Array.isArray(original)) {
          mesh.material = original.map((mat) => cloneMaterial(mat));
        } else {
          mesh.material = cloneMaterial(original);
        }

        if (renderStyle === 'wireframe') {
          const makeWire = (mat?: THREE.Material) => {
            const source = mat as THREE.MeshStandardMaterial | undefined;
            const color = source?.color ? source.color.clone() : new THREE.Color(0.85, 0.85, 0.85);
            return new THREE.MeshBasicMaterial({ color, wireframe: true });
          };
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((mat) => makeWire(mat));
          } else {
            mesh.material = makeWire(mesh.material);
          }
          return;
        }

        const boostMaterial = (mat?: THREE.Material) => {
          if (!mat || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
          const standard = mat as THREE.MeshStandardMaterial;
          const baseColor = standard.color?.clone() ?? new THREE.Color(0.9, 0.9, 0.9);
          standard.emissive = baseColor.clone().multiplyScalar(0.45);
          standard.emissiveIntensity = mode === 'lit' ? 1.1 : 0.7;
          if (typeof standard.metalness === 'number') {
            standard.metalness = Math.min(standard.metalness, 0.25);
          }
          if (typeof standard.roughness === 'number') {
            standard.roughness = Math.max(standard.roughness, 0.35);
          }
          standard.needsUpdate = true;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => boostMaterial(mat));
        } else {
          boostMaterial(mesh.material);
        }
      });

      const tempScene = new THREE.Scene();
      tempScene.background = null;

      const ambient = new THREE.AmbientLight(0xffffff, mode === 'lit' ? 1.45 : 0.95);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x2c2f36, mode === 'lit' ? 0.9 : 0.6);
      const key = new THREE.DirectionalLight(0xffffff, mode === 'lit' ? 1.9 : 1.2);
      key.position.set(8, 10, 6);
      const fill = new THREE.DirectionalLight(0xffffff, mode === 'lit' ? 1.15 : 0.7);
      fill.position.set(-6, 4, -4);
      const rim = new THREE.DirectionalLight(0xffffff, mode === 'lit' ? 0.75 : 0.45);
      rim.position.set(0, 6, -10);
      tempScene.add(ambient, hemi, key, fill, rim);

      let box = new THREE.Box3().setFromObject(clone);
      if (box.isEmpty()) return null;

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const NORMALIZED_DIM = 1.2;
      const MIN_SCALE = 0.3;
      const MAX_SCALE = 5;
      const scaleFactor = THREE.MathUtils.clamp(NORMALIZED_DIM / maxDim, MIN_SCALE, MAX_SCALE);
      clone.scale.multiplyScalar(scaleFactor);

      box = new THREE.Box3().setFromObject(clone);
      const center = box.getCenter(new THREE.Vector3());
      clone.position.sub(center);
      tempScene.add(clone);

      const normalizedSize = box.getSize(new THREE.Vector3());
      const normalizedMaxDim = Math.max(normalizedSize.x, normalizedSize.y, normalizedSize.z);
      const fov = (camera as THREE.PerspectiveCamera).fov || 50;
      const distance = (normalizedMaxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))) * 1.15;

      const direction = new THREE.Vector3(0, 0.25, 1).normalize();
      const snapshotCamera = (camera as THREE.PerspectiveCamera).clone();
      snapshotCamera.position.copy(direction.multiplyScalar(distance));
      snapshotCamera.lookAt(new THREE.Vector3(0, 0, 0));
      snapshotCamera.updateProjectionMatrix();

      const width = 640;
      const height = 640;
      const renderTarget = new THREE.WebGLRenderTarget(width, height);
      const prevTarget = gl.getRenderTarget();
      const prevAutoClear = gl.autoClear;
      const prevClearColor = gl.getClearColor(new THREE.Color());
      const prevClearAlpha = gl.getClearAlpha();
      gl.autoClear = true;
      gl.setClearColor(new THREE.Color(0, 0, 0), 0);
      gl.setRenderTarget(renderTarget);
      gl.render(tempScene, snapshotCamera);

      const buffer = new Uint8Array(width * height * 4);
      gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        renderTarget.dispose();
        gl.setRenderTarget(prevTarget);
        gl.autoClear = prevAutoClear;
        gl.setClearColor(prevClearColor, prevClearAlpha);
        return null;
      }

      const imageData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const srcIndex = ((height - 1 - y) * width + x) * 4;
          const dstIndex = (y * width + x) * 4;
          imageData.data[dstIndex] = buffer[srcIndex];
          imageData.data[dstIndex + 1] = buffer[srcIndex + 1];
          imageData.data[dstIndex + 2] = buffer[srcIndex + 2];
          imageData.data[dstIndex + 3] = buffer[srcIndex + 3];
        }
      }
      ctx.putImageData(imageData, 0, 0);

      renderTarget.dispose();
      gl.setRenderTarget(prevTarget);
      gl.autoClear = prevAutoClear;
      gl.setClearColor(prevClearColor, prevClearAlpha);

      return canvas.toDataURL('image/png');
    },
    [camera, gl]
  );

  const capturePartSnapshot = useCallback(
    async (nodeId: string) => {
      const targetNode = findNodeById(nodeId) as THREE.Object3D | null;
      if (!targetNode) return null;
      return captureObjectSnapshot(targetNode, {
        includeOnlyTarget: true,
        viewMode: 'lit',
        renderMode: 'normal',
      });
    },
    [captureObjectSnapshot, findNodeById]
  );

  const captureModelSnapshot = useCallback(
    async (modelId: string) => {
      const modelRoot = findModelRootById(modelId);
      if (!modelRoot) return null;
      return captureObjectSnapshot(modelRoot, {
        includeOnlyTarget: false,
        viewMode: 'lit',
        renderMode: 'normal',
      });
    },
    [captureObjectSnapshot, findModelRootById]
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
        viewMode: 'wireframe',
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
        viewMode: 'wireframe',
        renderMode: 'wireframe',
      });
      return [lit, dim, wireframe] as [string | null, string | null, string | null];
    },
    [captureObjectSnapshot, findModelRootById]
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
            modelIndex,
          });
        }
      });
    });
    return Array.from(partsMap.values());
  }, [modelRefsVersion]);

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
    capturePartSnapshot,
    captureModelSnapshot,
    capturePartSnapshots,
    captureModelSnapshots,
    getModelRootName,
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
