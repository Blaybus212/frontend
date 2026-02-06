/**
 * OrbitControls 래퍼 컴포넌트
 * 
 * OrbitControls를 감싸서 카메라 조작 이벤트를 처리하는 컴포넌트입니다.
 */

import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * OrbitControlsWrapper 컴포넌트의 Props 인터페이스
 */
interface OrbitControlsWrapperProps {
  /** OrbitControls의 참조 */
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  /** OrbitControls 활성화 여부 */
  enabled: boolean;
  /** 드래그 시작 핸들러 */
  onStart: () => void;
  /** 드래그 종료 핸들러 */
  onEnd: () => void;
}

/**
 * OrbitControls 래퍼 컴포넌트
 * 
 * 카메라 조작을 위한 OrbitControls를 렌더링하고,
 * 드래그 시작/종료 이벤트를 처리합니다.
 * 
 * @param props - 컴포넌트 props
 * @returns OrbitControls 컴포넌트
 * 
 * @example
 * ```tsx
 * <OrbitControlsWrapper
 *   orbitControlsRef={orbitControlsRef}
 *   enabled={orbitControlsEnabled}
 *   onStart={handleStart}
 *   onEnd={handleEnd}
 * />
 * ```
 */
export function OrbitControlsWrapper({
  orbitControlsRef,
  enabled,
  onStart,
  onEnd,
}: OrbitControlsWrapperProps) {
  return (
    <OrbitControls
      ref={orbitControlsRef}
      enabled={enabled}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.05}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
}
