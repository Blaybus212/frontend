/**
 * 씬 조명 컴포넌트
 * 
 * 3D 씬에 기본 조명을 제공하는 컴포넌트입니다.
 * 환경광(Ambient Light)과 방향광(Directional Light)을 조합하여
 * 객체가 잘 보이도록 적절한 조명을 설정합니다.
 * 
 * 조명 구성:
 * - Ambient Light: 전체 씬에 균일하게 적용되는 기본 조명
 * - Directional Light 1: 메인 조명 (오른쪽 위에서 비춤)
 * - Directional Light 2: 보조 조명 (왼쪽 아래에서 비춤, 그림자 완화)
 */

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
export function SceneLights() {
  return (
    <>
      {/* 환경광: 전체 씬에 균일하게 적용되는 기본 조명
          intensity: 조명 강도 (0.5 = 50% 강도) */}
      <ambientLight intensity={0.5} />
      
      {/* 방향광 1: 메인 조명
          position: 조명의 위치 [X, Y, Z]
          intensity: 조명 강도 (1.0 = 100% 강도)
          오른쪽 위에서 비춰서 객체의 주요 면을 밝게 만듭니다 */}
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* 방향광 2: 보조 조명 (그림자 완화용)
          position: 조명의 위치 [X, Y, Z]
          intensity: 조명 강도 (0.5 = 50% 강도)
          왼쪽 아래에서 비춰서 그림자 부분을 약간 밝게 만들어 디테일을 살립니다 */}
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
    </>
  );
}
