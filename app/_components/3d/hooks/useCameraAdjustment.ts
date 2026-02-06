/**
 * 카메라 자동 조정 훅
 * 
 * 모델이 로드되면 자동으로 카메라를 모델의 바운딩 박스에 맞춰 조정합니다.
 * 최초 로딩 시에만 한 번 실행되며, 사용자가 카메라를 조작하면 자동 조정을 중단합니다.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Model } from '../types';

/**
 * 카메라 자동 조정 훅의 Props 인터페이스
 */
interface UseCameraAdjustmentProps {
  /** 렌더링할 모델 배열 */
  models: Model[];
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
  /** OrbitControls의 참조 */
  orbitControlsRef: React.MutableRefObject<any>;
  /** 드래그 종료 플래그 (클릭 이벤트와의 충돌 방지용) */
  justEndedDragRef: React.MutableRefObject<boolean>;
}

/**
 * 카메라 자동 조정 훅의 반환 타입
 */
interface UseCameraAdjustmentReturn {
  /** OrbitControls의 onStart 핸들러 */
  onOrbitStart: () => void;
  /** OrbitControls의 onEnd 핸들러 */
  onOrbitEnd: () => void;
  /** 모델이 로드될 때 호출할 함수 (ModelList에서 사용) */
  onModelLoaded: () => void;
}

/**
 * 카메라 자동 조정 훅의 반환 타입
 */
interface UseCameraAdjustmentReturn {
  /** OrbitControls의 onStart 핸들러 */
  onOrbitStart: () => void;
  /** OrbitControls의 onEnd 핸들러 */
  onOrbitEnd: () => void;
}

/**
 * 카메라를 자동으로 모델에 맞춰 조정하는 훅
 * 
 * **주요 기능:**
 * - 모델 로드 시 바운딩 박스를 계산하여 카메라 위치 자동 조정
 * - 부드러운 애니메이션으로 카메라 이동
 * - 사용자가 카메라를 조작하면 자동 조정 중단
 * - 최초 로딩 시에만 실행 (사용자 조작 후에는 재실행 안 함)
 * 
 * **카메라 위치 계산:**
 * - 모델의 중심점을 기준으로 45도 각도에서 위에서 바라보도록 설정
 * - 모델의 가장 긴 축을 기준으로 적절한 거리 계산
 * 
 * @param props - 훅의 props
 * @returns OrbitControls의 이벤트 핸들러들
 * 
 * @example
 * ```tsx
 * const { onOrbitStart, onOrbitEnd } = useCameraAdjustment({
 *   models,
 *   modelRefs,
 *   orbitControlsRef,
 *   justEndedDragRef,
 * });
 * 
 * <OrbitControls
 *   ref={orbitControlsRef}
 *   onStart={onOrbitStart}
 *   onEnd={onOrbitEnd}
 * />
 * ```
 */
export function useCameraAdjustment({
  models,
  modelRefs,
  orbitControlsRef,
  justEndedDragRef,
}: UseCameraAdjustmentProps): UseCameraAdjustmentReturn {
  /** Three.js 카메라 객체 */
  const { camera } = useThree();
  
  /** 카메라가 이미 자동 조정되었는지 여부 */
  const cameraAdjustedRef = useRef(false);
  /** 카메라 애니메이션 타겟 위치 */
  const targetCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  /** OrbitControls 타겟 위치 */
  const targetControlsTargetRef = useRef<THREE.Vector3 | null>(null);
  /** 카메라 애니메이션 진행 중 여부 */
  const isAnimatingRef = useRef(false);

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
      const distance = maxDim * 1; // 거리를 조금 줄임 (2.5 -> 2.0 -> 1)
      
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
  }, [models, modelRefs]);

  /**
   * 모델이 변경되면 카메라 조정을 시도합니다
   * 단, 사용자가 이미 카메라를 조작한 경우에는 조정하지 않습니다
   */
  useEffect(() => {
    // 사용자가 이미 카메라를 조작한 경우에는 조정하지 않음
    if (cameraAdjustedRef.current) {
      return;
    }
    
    // 기존 애니메이션 중단
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
    // OrbitControls가 드래그 중일 때도 애니메이션 중단
    if (
      cameraAdjustedRef.current || 
      !isAnimatingRef.current || 
      !targetCameraPositionRef.current || 
      !targetControlsTargetRef.current ||
      (orbitControlsRef.current && orbitControlsRef.current.enabled === false)
    ) {
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
   * OrbitControls의 드래그 시작 핸들러
   * 사용자가 카메라 조작을 시작하면 자동 카메라 조정을 완전히 중단합니다
   */
  const onOrbitStart = useCallback(() => {
    // 사용자가 카메라 조작을 시작하면 자동 카메라 조정을 완전히 중단하고 타겟 위치 초기화
    // 이후 다시 자동 조정이 되지 않도록 보장
    isAnimatingRef.current = false;
    targetCameraPositionRef.current = null;
    targetControlsTargetRef.current = null;
    justEndedDragRef.current = false;
    
    // 사용자가 조작했으므로 더 이상 자동 조정하지 않음
    cameraAdjustedRef.current = true;
  }, [justEndedDragRef]);

  /**
   * OrbitControls의 드래그 종료 핸들러
   * 드래그 종료 시 애니메이션 타겟을 완전히 제거하여 클릭 이벤트와의 충돌을 방지합니다
   */
  const onOrbitEnd = useCallback(() => {
    // 드래그 종료 시(마우스를 뗄 때)에도 애니메이션 타겟을 완전히 제거하여
    // 클릭 이벤트나 damping으로 인해 다시 돌아가지 않도록 보장
    // 즉시 실행하여 클릭 이벤트보다 먼저 처리되도록 함
    isAnimatingRef.current = false;
    targetCameraPositionRef.current = null;
    targetControlsTargetRef.current = null;
    // 사용자가 조작했으므로 더 이상 자동 조정하지 않음
    cameraAdjustedRef.current = true;
    // OrbitControls의 타겟을 현재 상태로 확실히 고정
    if (orbitControlsRef.current) {
      orbitControlsRef.current.update();
    }
    
    // justEndedDragRef는 더 이상 사용하지 않음
    // 클릭 이벤트가 정상적으로 작동하도록 플래그를 즉시 리셋
    justEndedDragRef.current = false;
  }, [orbitControlsRef, justEndedDragRef]);

  /**
   * 모델이 로드될 때 호출할 함수
   * ModelList에서 개별 모델이 로드될 때마다 호출하여 카메라 조정을 시도합니다
   */
  const onModelLoaded = useCallback(() => {
    // 카메라가 이미 조정되었으면 스킵
    if (cameraAdjustedRef.current) return;
    
    // 다음 프레임에 카메라 조정 시도
    requestAnimationFrame(() => {
      adjustCameraToModels();
    });
  }, [adjustCameraToModels]);

  return {
    onOrbitStart,
    onOrbitEnd,
    onModelLoaded,
  };
}
