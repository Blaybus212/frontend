/**
 * TransformControls 관리 훅
 * 
 * TransformControls(객체 변환 조작 도구)와 OrbitControls(카메라 조작 도구)의
 * 상호작용을 관리합니다. TransformControls로 객체를 드래그할 때는
 * OrbitControls를 자동으로 비활성화하여 충돌을 방지합니다.
 */

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { TransformMode } from '../types';

/**
 * TransformControls와 OrbitControls의 상호작용을 관리하는 훅
 * 
 * 이 훅은 다음과 같은 기능을 제공합니다:
 * 1. TransformControls와 OrbitControls의 참조를 관리
 * 2. TransformControls의 현재 모드(이동/회전/스케일)를 관리
 * 3. TransformControls로 객체를 드래그할 때 OrbitControls를 자동으로 비활성화
 * 4. 드래그가 끝나면 OrbitControls를 다시 활성화
 * 
 * @returns TransformControls 관련 상태와 함수들을 반환
 * @returns transformControlsRef - TransformControls 컴포넌트의 참조
 * @returns orbitControlsRef - OrbitControls 컴포넌트의 참조
 * @returns orbitControlsEnabled - OrbitControls 활성화 여부
 * @returns transformMode - 현재 변환 모드 ('translate' | 'rotate' | 'scale')
 * @returns setTransformMode - 변환 모드를 설정하는 함수
 * 
 * @example
 * ```tsx
 * const {
 *   transformControlsRef,
 *   orbitControlsRef,
 *   orbitControlsEnabled,
 *   transformMode,
 *   setTransformMode,
 * } = useTransformControls();
 * 
 * // 변환 모드 변경
 * setTransformMode('rotate');
 * ```
 */
export function useTransformControls() {
  /** TransformControls 컴포넌트의 참조 */
  const transformControlsRef = useRef<any>(null);
  /** OrbitControls 컴포넌트의 참조 */
  const orbitControlsRef = useRef<any>(null);
  /** OrbitControls의 활성화 여부 상태 */
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(true);
  /** 현재 변환 모드 (이동/회전/스케일) */
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');

  /**
   * 매 프레임마다 TransformControls의 드래그 상태를 확인하고
   * OrbitControls를 적절히 활성화/비활성화합니다
   * 
   * TransformControls로 객체를 드래그할 때는 OrbitControls와 충돌하지 않도록
   * OrbitControls를 비활성화하고, 드래그가 끝나면 다시 활성화합니다.
   */
  useFrame(() => {
    if (transformControlsRef.current) {
      // TransformControls가 현재 드래그 중인지 확인
      const isDragging = transformControlsRef.current.dragging || false;
      
      // 드래그 중이면 OrbitControls 비활성화, 아니면 활성화
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !isDragging;
      }
      
      // 상태 동기화 (불필요한 리렌더링 방지)
      if (isDragging !== !orbitControlsEnabled) {
        setOrbitControlsEnabled(!isDragging);
      }
    }
  });

  return {
    transformControlsRef,
    orbitControlsRef,
    orbitControlsEnabled,
    transformMode,
    setTransformMode,
  };
}
