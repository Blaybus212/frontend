import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface OrbitControlsWrapperProps {
  orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  enabled: boolean;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * OrbitControls 래퍼 (드래그 시작/종료 이벤트 전달)
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
