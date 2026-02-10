import * as THREE from 'three';
import type { ObjectInfo } from './types';

/**
 * 두 숫자 배열이 동일한지 비교
 * @param a - 첫 번째 배열
 * @param b - 두 번째 배열
 */
export function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Three.js 객체에서 ObjectInfo 추출 (변환, 메시 정보)
 * @param object - 정보를 추출할 Three.js 객체
 * @returns ObjectInfo 또는 null
 */
export function extractObjectInfo(object: THREE.Object3D | null): ObjectInfo | null {
  if (!object) return null;

  const targetMatrix = object.matrixWorld.clone();
  const matrix = targetMatrix.toArray();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  targetMatrix.decompose(position, quaternion, scale);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  const meshes: ObjectInfo['meshes'] = [];

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      const material = child.material;
      let vertices = 0;
      let faces = 0;

      if (geometry) {
        if (geometry.attributes.position) {
          vertices = geometry.attributes.position.count;
        }
        faces = geometry.index ? geometry.index.count / 3 : vertices / 3;
      }

      const meshInfo: ObjectInfo['meshes'][0] = {
        name: child.name || 'Unnamed Mesh',
        vertices,
        faces: Math.floor(faces),
      };

      if (material instanceof THREE.MeshStandardMaterial) {
        meshInfo.material = {
          name: material.name || 'Standard Material',
          color: `#${material.color.getHexString()}`,
          metalness: material.metalness,
          roughness: material.roughness,
        };
      }

      meshes.push(meshInfo);
    }
  });

  return {
    matrix,
    position: { x: position.x, y: position.y, z: position.z },
    rotation: {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z),
    },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    meshes,
  };
}
