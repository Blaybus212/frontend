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

  // GLTF 로더는 매트릭스를 scene의 첫 번째 자식 노드에 적용함
  // scene 자체의 matrixWorld는 단위 행렬일 수 있으므로,
  // 첫 번째 자식 노드의 matrixWorld를 확인하거나 scene과 자식의 매트릭스를 합침
  let targetMatrix: THREE.Matrix4;
  
  if (object.children.length > 0) {
    const firstChild = object.children[0];
    // 자식 노드의 matrixWorld 사용 (GLTF 매트릭스가 적용된 값)
    targetMatrix = firstChild.matrixWorld.clone();
  } else {
    // 자식이 없으면 scene 자체의 매트릭스 사용
    targetMatrix = object.matrixWorld.clone();
  }
  
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
