import { GRID_SIZE, AXES_LENGTH } from './constants';

/**
 * 3D 씬 시각 보조 도구 (그리드, 좌표축) 렌더링
 * @returns R3F 프리미티브 그리드·축 헬퍼
 */
export function SceneHelpers() {
  return (
    <>
      <gridHelper args={[GRID_SIZE, GRID_SIZE]} />
      <axesHelper args={[AXES_LENGTH]} />
    </>
  );
}
