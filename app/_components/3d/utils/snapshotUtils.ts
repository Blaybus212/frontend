import * as THREE from 'three';
import { LIGHTING_CONFIG, MATERIAL_CONFIG, SNAPSHOT_CONFIG } from '../constants';

export type SnapshotViewMode = 'lit' | 'dim';
export type SnapshotRenderMode = 'normal' | 'wireframe';

export type SnapshotOptions = {
  includeOnlyTarget?: boolean;
  viewMode?: SnapshotViewMode;
  renderMode?: SnapshotRenderMode;
};

const cloneObjectForSnapshot = (
  targetObject: THREE.Object3D,
  mode: SnapshotViewMode,
  renderStyle: SnapshotRenderMode
) => {
  targetObject.updateWorldMatrix(true, true);
  const userDataMap = new Map<THREE.Object3D, any>();
  targetObject.traverse((obj) => {
    userDataMap.set(obj, obj.userData);
    obj.userData = {};
  });

  let clone: THREE.Object3D;
  try {
    clone = targetObject.clone(true);
  } finally {
    userDataMap.forEach((data, obj) => {
      obj.userData = data;
    });
  }
  clone.applyMatrix4(targetObject.matrixWorld);

  clone.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const original = mesh.material;
    const cloneMaterial = (mat?: THREE.Material): THREE.Material =>
      mat ? mat.clone() : new THREE.MeshStandardMaterial();
    if (Array.isArray(original)) {
      mesh.material = original.map((mat) => cloneMaterial(mat));
    } else {
      mesh.material = cloneMaterial(original);
    }

    if (renderStyle === 'wireframe') {
      const makeWire = (mat?: THREE.Material) => {
        const source = mat as THREE.MeshStandardMaterial | undefined;
        const color = source?.color
          ? source.color.clone()
          : new THREE.Color(...MATERIAL_CONFIG.WIREFRAME_DEFAULT_COLOR);
        return new THREE.MeshBasicMaterial({ color, wireframe: true });
      };
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => makeWire(mat));
      } else {
        mesh.material = makeWire(mesh.material);
      }
      return;
    }

    const boostMaterial = (mat?: THREE.Material) => {
      if (!mat || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      const standard = mat as THREE.MeshStandardMaterial;
      const baseColor =
        standard.color?.clone() ?? new THREE.Color(...MATERIAL_CONFIG.BASE_COLOR);
      standard.emissive = baseColor.clone().multiplyScalar(MATERIAL_CONFIG.EMISSIVE_MULTIPLIER);
      standard.emissiveIntensity =
        mode === 'lit'
          ? MATERIAL_CONFIG.EMISSIVE_LIT_INTENSITY
          : MATERIAL_CONFIG.EMISSIVE_DIM_INTENSITY;
      if (typeof standard.metalness === 'number') {
        standard.metalness = Math.min(standard.metalness, MATERIAL_CONFIG.METALNESS_MAX);
      }
      if (typeof standard.roughness === 'number') {
        standard.roughness = Math.max(standard.roughness, MATERIAL_CONFIG.ROUGHNESS_MIN);
      }
      standard.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => boostMaterial(mat));
    } else {
      boostMaterial(mesh.material);
    }
  });

  return clone;
};

const buildSnapshotScene = (clone: THREE.Object3D, mode: SnapshotViewMode) => {
  const tempScene = new THREE.Scene();
  tempScene.background = null;

  const ambient = new THREE.AmbientLight(
    LIGHTING_CONFIG.LIGHT_COLOR,
    mode === 'lit' ? LIGHTING_CONFIG.AMBIENT_LIT : LIGHTING_CONFIG.AMBIENT_DIM
  );
  const hemi = new THREE.HemisphereLight(
    LIGHTING_CONFIG.LIGHT_COLOR,
    LIGHTING_CONFIG.HEMISPHERE_GROUND_COLOR,
    mode === 'lit' ? LIGHTING_CONFIG.HEMI_LIT : LIGHTING_CONFIG.HEMI_DIM
  );
  const key = new THREE.DirectionalLight(
    LIGHTING_CONFIG.LIGHT_COLOR,
    mode === 'lit' ? LIGHTING_CONFIG.KEY_LIT : LIGHTING_CONFIG.KEY_DIM
  );
  key.position.set(...LIGHTING_CONFIG.KEY_POSITION);
  const fill = new THREE.DirectionalLight(
    LIGHTING_CONFIG.LIGHT_COLOR,
    mode === 'lit' ? LIGHTING_CONFIG.FILL_LIT : LIGHTING_CONFIG.FILL_DIM
  );
  fill.position.set(...LIGHTING_CONFIG.FILL_POSITION);
  const rim = new THREE.DirectionalLight(
    LIGHTING_CONFIG.LIGHT_COLOR,
    mode === 'lit' ? LIGHTING_CONFIG.RIM_LIT : LIGHTING_CONFIG.RIM_DIM
  );
  rim.position.set(...LIGHTING_CONFIG.RIM_POSITION);
  tempScene.add(ambient, hemi, key, fill, rim);

  let box = new THREE.Box3().setFromObject(clone);
  if (box.isEmpty()) return { scene: tempScene, box: null };

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = THREE.MathUtils.clamp(
    SNAPSHOT_CONFIG.NORMALIZED_DIM / maxDim,
    SNAPSHOT_CONFIG.MIN_SCALE,
    SNAPSHOT_CONFIG.MAX_SCALE
  );
  clone.scale.multiplyScalar(scaleFactor);

  box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  clone.position.sub(center);
  tempScene.add(clone);

  return { scene: tempScene, box };
};

const createSnapshotCamera = (camera: THREE.PerspectiveCamera, box: THREE.Box3) => {
  const normalizedSize = box.getSize(new THREE.Vector3());
  const normalizedMaxDim = Math.max(normalizedSize.x, normalizedSize.y, normalizedSize.z);
  const fov = camera.fov || SNAPSHOT_CONFIG.FOV_FALLBACK;
  const distance =
    (normalizedMaxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))) *
    SNAPSHOT_CONFIG.DISTANCE_MULTIPLIER;

  const direction = new THREE.Vector3(...SNAPSHOT_CONFIG.CAMERA_DIRECTION).normalize();
  const snapshotCamera = camera.clone();
  snapshotCamera.position.copy(direction.multiplyScalar(distance));
  snapshotCamera.lookAt(new THREE.Vector3(0, 0, 0));
  snapshotCamera.updateProjectionMatrix();
  return snapshotCamera;
};

const renderSnapshot = (
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const width = SNAPSHOT_CONFIG.WIDTH;
  const height = SNAPSHOT_CONFIG.HEIGHT;
  const renderTarget = new THREE.WebGLRenderTarget(width, height);
  const prevTarget = gl.getRenderTarget();
  const prevAutoClear = gl.autoClear;
  const prevClearColor = gl.getClearColor(new THREE.Color());
  const prevClearAlpha = gl.getClearAlpha();
  gl.autoClear = true;
  gl.setClearColor(
    new THREE.Color(...SNAPSHOT_CONFIG.CLEAR_COLOR),
    SNAPSHOT_CONFIG.CLEAR_ALPHA
  );
  gl.setRenderTarget(renderTarget);
  gl.render(scene, camera);

  const buffer = new Uint8Array(width * height * 4);
  gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    renderTarget.dispose();
    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
    gl.setClearColor(prevClearColor, prevClearAlpha);
    return null;
  }

  const imageData = ctx.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcIndex = ((height - 1 - y) * width + x) * 4;
      const dstIndex = (y * width + x) * 4;
      imageData.data[dstIndex] = buffer[srcIndex];
      imageData.data[dstIndex + 1] = buffer[srcIndex + 1];
      imageData.data[dstIndex + 2] = buffer[srcIndex + 2];
      imageData.data[dstIndex + 3] = buffer[srcIndex + 3];
    }
  }
  ctx.putImageData(imageData, 0, 0);

  renderTarget.dispose();
  gl.setRenderTarget(prevTarget);
  gl.autoClear = prevAutoClear;
  gl.setClearColor(prevClearColor, prevClearAlpha);

  return canvas.toDataURL('image/png');
};

export const captureObjectSnapshotImage = (
  targetObject: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  gl: THREE.WebGLRenderer,
  options?: SnapshotOptions
) => {
  const mode = options?.viewMode ?? 'lit';
  const renderStyle = options?.renderMode ?? 'normal';

  const clone = cloneObjectForSnapshot(targetObject, mode, renderStyle);
  const { scene, box } = buildSnapshotScene(clone, mode);
  if (!box) return null;

  const snapshotCamera = createSnapshotCamera(camera, box);
  return renderSnapshot(gl, scene, snapshotCamera);
};
