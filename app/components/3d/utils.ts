/**
 * 3D 씬 관련 유틸리티 함수
 */

import * as THREE from 'three';
import type { ObjectInfo } from './types';

/**
 * Three.js 객체에서 정보를 추출하여 ObjectInfo 형태로 반환
 * 매트릭스 값을 직접 사용하고, position/rotation/scale은 매트릭스에서 추출
 */
export function extractObjectInfo(object: THREE.Group | null): ObjectInfo | null {
  if (!object) return null;

  // 객체의 matrixWorld를 직접 사용
  // Model 컴포넌트에서 노드를 복제하여 추가하므로,
  // object 자체가 노드이고 그 matrixWorld를 사용합니다
  const targetMatrix = object.matrixWorld.clone();
  
  const matrix = targetMatrix.toArray();
  
  // 매트릭스에서 position, rotation, scale을 추출
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  
  // 매트릭스를 분해하여 position, rotation(quaternion), scale 추출
  targetMatrix.decompose(position, quaternion, scale);
  
  // 쿼터니언을 오일러 각도로 변환
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
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    },
    scale: { x: scale.x, y: scale.y, z: scale.z },
    meshes,
  };
}
