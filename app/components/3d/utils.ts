/**
 * 3D 씬 관련 유틸리티 함수
 */

import * as THREE from 'three';
import type { ObjectInfo } from './types';

/**
 * Three.js 객체에서 정보를 추출하여 ObjectInfo 형태로 반환
 */
export function extractObjectInfo(object: THREE.Group | null): ObjectInfo | null {
  if (!object) return null;

  const matrix = object.matrixWorld.toArray();
  const position = object.position;
  const rotation = object.rotation;
  const scale = object.scale;

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
        if (geometry.index) {
          faces = geometry.index.count / 3;
        } else {
          faces = vertices / 3;
        }
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
      x: THREE.MathUtils.radToDeg(rotation.x),
      y: THREE.MathUtils.radToDeg(rotation.y),
      z: THREE.MathUtils.radToDeg(rotation.z)
    },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    meshes,
  };
}
