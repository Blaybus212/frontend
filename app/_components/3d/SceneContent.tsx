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
import { OrbitControlsWrapper } from './components/OrbitControlsWrapper';
import { ModelList } from './components/ModelList';
import { extractSceneState } from './utils/nodeTransformStorage';
import type { TransformMode, Transform, Scene3DRef, SceneContentProps } from './types';

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
  onObjectInfoChange,
  assemblyValue = 0,
}, ref) => {
  /** Three.js 씬 객체 */
  const { scene, camera } = useThree();
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  const modelRefs = useRef<Map<number, THREE.Group>>(new Map());
  /** OrbitControls가 방금 드래그를 끝냈는지 여부 (클릭 이벤트와의 충돌 방지) */
  const justEndedDragRef = useRef(false);
  /** 현재 선택된 노드들 */
  const selectedNodesRef = useRef<SelectedNode[] | null>(null);
  /** 선택된 노드 변경 트리거 */
  const [selectedNodesVersion, setSelectedNodesVersion] = React.useState(0);
  /** 렌더링 모드 */
  const [renderMode, setRenderMode] = React.useState<'normal' | 'wireframe'>('normal');
  /** 뷰 모드 */
  const [viewMode, setViewMode] = React.useState<'lit' | 'dim' | 'wireframe'>('lit');

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        const isEditable =
          tagName === 'input' ||
          tagName === 'textarea' ||
          (target as HTMLElement).isContentEditable;
        if (isEditable) return;
      }

      if (event.key === '1') {
        setViewMode('lit');
        setRenderMode('normal');
      } else if (event.key === '2') {
        setViewMode('dim');
        setRenderMode('normal');
      } else if (event.key === '3') {
        setViewMode('wireframe');
        setRenderMode('wireframe');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // TransformControls와 OrbitControls 관리
  // 드래그 중 OrbitControls를 자동으로 비활성화합니다
  const {
    transformControlsRef,
    orbitControlsRef,
    orbitControlsEnabled,
    transformMode,
    setTransformMode,
  } = useTransformControls();

  // 선택 상태 동기화
  // 외부에서 전달된 selectedModelIndices와 내부 상태를 동기화합니다
  const { selectedIndices } = useSelectionSync({
    selectedModelIndices,
  });

  // 카메라 자동 조정
  // 모델 로드 시 카메라를 자동으로 조정합니다
  const { onOrbitStart, onOrbitEnd, onModelLoaded } = useCameraAdjustment({
    models,
    modelRefs,
    orbitControlsRef,
    justEndedDragRef,
  });

  // 조립/분해 처리
  // 슬라이더 값에 따라 모델의 노드들을 조립/분해 상태로 이동시킵니다
  const { resetToAssembly } = useAssemblyDisassembly({
    modelRefs,
    assemblyValue,
    transformControlsRef,
  });

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

  // 개별 노드 변환 적용
  // TransformControls로 개별 노드를 조작할 때 노드의 변환을 직접 적용합니다
  useNodeTransform({
    selectedNodesRef,
    transformControlsRef,
  });

  // 클릭 이벤트 처리
  // 레이캐스팅을 사용하여 클릭한 객체를 찾고 선택 상태를 관리합니다
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

  /**
   * 현재 선택된 객체의 참조를 계산합니다
   * 
   * - 개별 노드 선택: 선택된 노드 참조 사용 (이미 Group인 노드만 선택됨)
   * - 다중 선택: 선택 그룹 사용
   * - 단일 선택: 해당 모델 그룹 사용
   * - 선택 없음: null
   */
  const selectedObjectRef = selectedNodesRef.current && selectedNodesRef.current.length > 0
    ? selectedNodesRef.current.length === 1
      ? selectedNodesRef.current[0].nodeRef as THREE.Object3D // 단일 노드 선택 (이미 Group)
      : selectionGroupRef.current // 다중 노드 선택 (그룹 사용)
    : selectedIndices.length > 1 
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
   * 현재 씬 상태를 추출하여 반환하는 함수
   * 
   * 서버에 전송하거나 로컬 스토리지에 저장할 수 있습니다.
   */
  const getSceneState = useCallback(() => {
    const orbitControlsTarget = orbitControlsRef.current?.target;
    return extractSceneState(
      modelRefs.current,
      camera,
      orbitControlsTarget,
      assemblyValue
    );
  }, [camera, orbitControlsRef, assemblyValue]);

  /**
   * 선택된 오브젝트에 테두리(Outline) 효과를 적용합니다
   */
  const previousOutlinedRef = useRef<THREE.Object3D[]>([]);

  const clearOutline = useCallback((targets: THREE.Object3D[]) => {
    targets.forEach((target) => {
      target.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.selectionOutline) {
          const outline = child.userData.selectionOutline as THREE.LineSegments;
          child.remove(outline);
          if (outline.geometry) outline.geometry.dispose();
          if (outline.material) {
            const materials = Array.isArray(outline.material) ? outline.material : [outline.material];
            materials.forEach((mat) => mat.dispose());
          }
          delete child.userData.selectionOutline;
        }
      });
    });
  }, []);

  const applyOutline = useCallback((targets: THREE.Object3D[]) => {
    targets.forEach((target) => {
      target.traverse((child) => {
        if (child instanceof THREE.Mesh && !child.userData.selectionOutline) {
          const edges = new THREE.EdgesGeometry(child.geometry, 40);
          const material = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
          });
          const outline = new THREE.LineSegments(edges, material);
          outline.scale.set(1.01, 1.01, 1.01);
          outline.renderOrder = 10;
          child.add(outline);
          child.userData.selectionOutline = outline;
        }
      });
    });
  }, []);

  React.useEffect(() => {
    const targets: THREE.Object3D[] = [];
    if (selectedNodesRef.current && selectedNodesRef.current.length > 0) {
      selectedNodesRef.current.forEach((node) => {
        if (node.nodeRef) targets.push(node.nodeRef);
      });
    } else if (selectedIndices.length > 0) {
      selectedIndices.forEach((index) => {
        const model = modelRefs.current.get(index);
        if (model) targets.push(model);
      });
    }

    clearOutline(previousOutlinedRef.current);
    applyOutline(targets);
    previousOutlinedRef.current = targets;
    return () => {
      clearOutline(targets);
    };
  }, [applyOutline, clearOutline, selectedIndices, selectedNodesVersion]);

  /**
   * 부모 컴포넌트에서 접근할 수 있는 함수들을 노출합니다
   * 
   * useImperativeHandle을 사용하여 ref를 통해 다음 함수들을 제공합니다:
   * - exportScene: 씬 내보내기
   * - updateObjectTransform: 객체 변환 업데이트
   * - setTransformMode: 변환 모드 설정
   * - getSceneState: 현재 씬 상태 추출 (서버 전송용)
   */
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
          } else {
            modelRefs.current.delete(index);
          }
        }}
        onModelLoaded={onModelLoaded}
      />
    </>
  );
});

SceneContent.displayName = 'SceneContent';
