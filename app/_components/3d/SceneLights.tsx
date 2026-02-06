/**
 * 씬 조명 컴포넌트
 * 
 * 3D 씬에 기본 조명을 제공하는 컴포넌트입니다.
 * 환경광(Ambient Light), 반구광(Hemisphere Light), 방향광(Directional Light)과
 * 환경맵(IBL)을 조합하여 렌더링 품질을 높입니다.
 * 
 * 조명 구성:
 * - Ambient Light: 전체 씬에 균일하게 적용되는 기본 조명
 * - Hemisphere Light: 하늘/바닥 방향의 부드러운 색감
 * - Directional Light 1: 메인 조명 (그림자 포함)
 * - Directional Light 2: 보조 조명 (그림자 완화)
 * - Environment: 광택/반사 표현을 위한 환경광
 */

import { Environment } from '@react-three/drei';

type SceneLightMode = 'lit' | 'dim';

interface SceneLightsProps {
  mode?: SceneLightMode;
}

/**
 * 씬 조명을 렌더링하는 컴포넌트
 * 
 * @returns 조명 요소들을 포함한 React Fragment
 * 
 * @example
 * ```tsx
 * <SceneLights />
 * ```
 */
export function SceneLights({ mode = 'lit' }: SceneLightsProps) {
  const isDim = mode === 'dim';
  const ambientIntensity = isDim ? 0.15 : 0.4;
  const hemiIntensity = isDim ? 0.12 : 0.25;
  const keyIntensity = isDim ? 0.45 : 0.8;
  const fillIntensity = isDim ? 0.2 : 0.35;
  const envIntensity = isDim ? 0.35 : 0.7;

  return (
    <>
      {/* 환경광: 전체 씬에 균일하게 적용되는 기본 조명
          intensity: 조명 강도 */}
      <ambientLight intensity={ambientIntensity} />

      {/* 반구광: 위/아래 색감을 분리하여 자연스러운 채광 */}
      <hemisphereLight intensity={hemiIntensity} color="#ffffff" groundColor="#2c2f36" />
      
      {/* 방향광 1: 메인 조명
          position: 조명의 위치 [X, Y, Z]
          intensity: 조명 강도 (1.0 = 100% 강도)
          오른쪽 위에서 비춰서 객체의 주요 면을 밝게 만듭니다 */}
      <directionalLight
        position={[12, 12, 6]}
        intensity={keyIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* 방향광 2: 보조 조명 (그림자 완화용)
          position: 조명의 위치 [X, Y, Z]
          intensity: 조명 강도 (0.5 = 50% 강도)
          왼쪽 아래에서 비춰서 그림자 부분을 약간 밝게 만들어 디테일을 살립니다 */}
      <directionalLight position={[-10, 6, -8]} intensity={fillIntensity} />

      {/* 환경맵: 광택/반사 표현을 위한 IBL */}
      <Environment preset="city" environmentIntensity={envIntensity} />
    </>
  );
}
