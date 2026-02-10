/**
 * 3D 씬 관련 상수
 * @module 3d/constants
 */

/** 트랜스폼 모드 단축키 (4: 이동, 5: 회전, 6: 스케일) */
export const TRANSFORM_HOTKEYS = {
  TRANSLATE: '4',
  ROTATE: '5',
  SCALE: '6',
} as const;

/** 줌 인/아웃 시 카메라 거리 배율 */
export const ZOOM_SCALE = {
  IN: 0.9,
  OUT: 1.1,
} as const;

/** 카메라 포커스 애니메이션 지속 시간 (ms) */
export const FOCUS_ANIMATION_DURATION_MS = {
  ALL_MODELS: 700,
  NODE: 600,
} as const;

/** 바운딩 박스 기준 카메라 거리 배율 (FOV 고려) */
export const FOCUS_DISTANCE_MULTIPLIER = 1.4;

/** 그리드 헬퍼 격자 크기 (-N ~ +N 범위) */
export const GRID_SIZE = 20;

/** 축 헬퍼 길이 (단위) */
export const AXES_LENGTH = 5;

/** 스냅샷 렌더용 머티리얼 보정 값 */
export const MATERIAL_CONFIG = {
  WIREFRAME_DEFAULT_COLOR: [0.85, 0.85, 0.85] as const,
  BASE_COLOR: [0.9, 0.9, 0.9] as const,
  EMISSIVE_MULTIPLIER: 0.45,
  EMISSIVE_LIT_INTENSITY: 1.1,
  EMISSIVE_DIM_INTENSITY: 0.7,
  METALNESS_MAX: 0.25,
  ROUGHNESS_MIN: 0.35,
} as const;

/** 스냅샷 조명 세팅 */
export const LIGHTING_CONFIG = {
  LIGHT_COLOR: 0xffffff,
  HEMISPHERE_GROUND_COLOR: 0x2c2f36,
  AMBIENT_LIT: 1.45,
  AMBIENT_DIM: 0.95,
  HEMI_LIT: 0.9,
  HEMI_DIM: 0.6,
  KEY_LIT: 1.9,
  KEY_DIM: 1.2,
  KEY_POSITION: [8, 10, 6] as const,
  FILL_LIT: 1.15,
  FILL_DIM: 0.7,
  FILL_POSITION: [-6, 4, -4] as const,
  RIM_LIT: 0.75,
  RIM_DIM: 0.45,
  RIM_POSITION: [0, 6, -10] as const,
} as const;

/** 스냅샷 캡처 설정 */
export const SNAPSHOT_CONFIG = {
  NORMALIZED_DIM: 1.2,
  MIN_SCALE: 0.3,
  MAX_SCALE: 5,
  FOV_FALLBACK: 50,
  DISTANCE_MULTIPLIER: 1.15,
  CAMERA_DIRECTION: [0, 0.25, 1] as const,
  WIDTH: 640,
  HEIGHT: 640,
  CLEAR_COLOR: [0, 0, 0] as const,
  CLEAR_ALPHA: 0,
} as const;

/** TransformControls 드래그 종료 후 클릭 이벤트와 충돌 방지 딜레이 (ms) */
export const SELECTION_SYNC_DELAY_MS = 80;
