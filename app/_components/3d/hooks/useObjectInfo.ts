/**
 * 객체 정보 추출 및 전달 훅
 * 
 * 선택된 3D 객체의 정보(위치, 회전, 스케일, 매트릭스, 메시 정보 등)를 추출하고,
 * 이 정보가 변경될 때마다 콜백 함수를 호출하여 외부 컴포넌트에 전달합니다.
 * 
 * TransformControls로 객체를 조작할 때 실시간으로 정보를 업데이트하며,
 * 불필요한 업데이트를 방지하기 위해 이전 값과 비교하여 실제로 변경된 경우에만 콜백을 호출합니다.
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { extractObjectInfo } from '../utils';
import type { ObjectInfo } from '../types';

/**
 * useObjectInfo 훅의 매개변수 인터페이스
 */
interface UseObjectInfoProps {
  /** 선택된 객체의 참조 (단일 선택 시 모델 그룹 또는 노드, 다중 선택 시 선택 그룹) */
  selectedObjectRef: THREE.Object3D | null;
  /** 객체 정보가 변경될 때 호출되는 콜백 함수 (선택적) */
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
}

/**
 * 선택된 객체의 정보를 추출하고 변경 시 콜백을 호출하는 훅
 * 
 * 이 훅은 두 가지 방식으로 객체 정보를 추출합니다:
 * 1. useEffect: 선택된 객체가 변경될 때 즉시 정보를 추출하고 전달
 * 2. useFrame: 매 프레임마다 객체 정보를 확인하여 변경된 경우에만 업데이트
 *    (TransformControls로 객체를 조작할 때 실시간 업데이트를 위해 사용)
 * 
 * 성능 최적화를 위해 이전 정보와 비교하여 실제로 변경된 경우에만 콜백을 호출합니다.
 * 
 * @param props - 훅의 매개변수 객체
 * @param props.selectedObjectRef - 선택된 객체의 참조
 * @param props.onObjectInfoChange - 객체 정보 변경 콜백 함수
 * 
 * @example
 * ```tsx
 * useObjectInfo({
 *   selectedObjectRef: selectedObjectRef,
 *   onObjectInfoChange: (info) => {
 *     // handle object info
 *   },
 * });
 * ```
 */
export function useObjectInfo({
  selectedObjectRef,
  onObjectInfoChange,
}: UseObjectInfoProps) {
  /** 이전 프레임의 객체 정보를 저장 (변경 감지를 위해 사용) */
  const previousInfoRef = useRef<ObjectInfo | null>(null);

  /**
   * 선택된 객체가 변경될 때 정보를 추출하고 전달합니다
   * 
   * 객체가 선택되면 즉시 정보를 추출하여 콜백을 호출하고,
   * 선택이 해제되면 null을 전달합니다.
   */
  useEffect(() => {
    if (selectedObjectRef && onObjectInfoChange) {
      // 객체 정보 추출 (위치, 회전, 스케일, 매트릭스, 메시 정보 등)
      const info = extractObjectInfo(selectedObjectRef);
      previousInfoRef.current = info;
      onObjectInfoChange(info);
    } else if (onObjectInfoChange) {
      // 선택이 해제된 경우
      previousInfoRef.current = null;
      onObjectInfoChange(null);
    }
  }, [selectedObjectRef, onObjectInfoChange]);

  /**
   * 매 프레임마다 객체 정보를 확인하여 변경 시 업데이트합니다
   * 
   * TransformControls로 객체를 드래그할 때 실시간으로 정보를 업데이트하기 위해
   * useFrame을 사용합니다. 이전 값과 비교하여 실제로 변경된 경우에만 콜백을 호출하여
   * 불필요한 리렌더링을 방지합니다.
   */
  useFrame(() => {
    if (selectedObjectRef && onObjectInfoChange) {
      const info = extractObjectInfo(selectedObjectRef);
      
      if (!info) return;
      
      // 이전 정보와 비교하여 실제로 변경되었는지 확인
      // position, rotation, scale의 각 요소를 비교합니다
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
        // 변경이 감지된 경우에만 이전 정보를 업데이트하고 콜백 호출
        previousInfoRef.current = info;
        onObjectInfoChange(info);
      }
    }
  });
}
