export const TRANSFORM_HOTKEYS = {
  TRANSLATE: '4',
  ROTATE: '5',
  SCALE: '6',
} as const;

export const ZOOM_SCALE = {
  IN: 0.9,
  OUT: 1.1,
} as const;

export const MATERIAL_CONFIG = {
  WIREFRAME_DEFAULT_COLOR: [0.85, 0.85, 0.85] as const,
  BASE_COLOR: [0.9, 0.9, 0.9] as const,
  EMISSIVE_MULTIPLIER: 0.45,
  EMISSIVE_LIT_INTENSITY: 1.1,
  EMISSIVE_DIM_INTENSITY: 0.7,
  METALNESS_MAX: 0.25,
  ROUGHNESS_MIN: 0.35,
} as const;

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

export const SELECTION_SYNC_DELAY_MS = 80;
