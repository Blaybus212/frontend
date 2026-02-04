/**
 * 3D 씬 관련 유틸리티 함수
 * 
 * Three.js 객체에서 정보를 추출하거나, 배열 비교 등의 유틸리티 함수를 제공합니다.
 */

import * as THREE from 'three';
import type { ObjectInfo } from './types';

/**
 * 두 숫자 배열이 동일한지 비교합니다
 * 
 * 배열의 길이와 각 요소를 순차적으로 비교하여 완전히 동일한지 확인합니다.
 * 이 함수는 주로 선택된 인덱스 배열의 변경을 감지하는 데 사용됩니다.
 * 
 * @param a - 첫 번째 배열
 * @param b - 두 번째 배열
 * @returns 두 배열이 완전히 동일하면 true, 그렇지 않으면 false
 * 
 * @example
 * ```tsx
 * arraysEqual([1, 2, 3], [1, 2, 3]); // true
 * arraysEqual([1, 2, 3], [1, 2, 4]); // false
 * arraysEqual([1, 2], [1, 2, 3]); // false (길이 다름)
 * ```
 */
export function arraysEqual(a: number[], b: number[]): boolean {
  // 길이가 다르면 즉시 false 반환
  if (a.length !== b.length) return false;
  // 모든 요소가 동일한지 확인
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Three.js 객체에서 정보를 추출하여 ObjectInfo 형태로 반환합니다
 * 
 * 이 함수는 3D 객체의 변환 정보(위치, 회전, 스케일, 매트릭스)와
 * 메시 정보(정점 수, 면 수, 재질 정보 등)를 추출합니다.
 * 
 * 변환 정보는 객체의 matrixWorld에서 추출되며, 이를 분해하여
 * position, rotation(쿼터니언 -> 오일러), scale을 얻습니다.
 * 
 * @param object - 정보를 추출할 Three.js 객체 (THREE.Group)
 * @returns 추출된 객체 정보 (ObjectInfo) 또는 null (객체가 없는 경우)
 * 
 * @example
 * ```tsx
 * const info = extractObjectInfo(modelGroup);
 * if (info) {
 *   console.log('Position:', info.position);
 *   console.log('Rotation:', info.rotation);
 *   console.log('Scale:', info.scale);
 *   console.log('Matrix:', info.matrix);
 *   console.log('Meshes:', info.meshes);
 * }
 * ```
 */
export function extractObjectInfo(object: THREE.Group | null): ObjectInfo | null {
  // 객체가 없으면 null 반환
  if (!object) return null;

  // 객체의 월드 매트릭스를 복제하여 사용
  // Model 컴포넌트에서 노드를 복제하여 추가하므로,
  // object 자체가 노드이고 그 matrixWorld를 사용합니다
  // matrixWorld는 부모 변환까지 포함한 최종 변환 매트릭스입니다
  const targetMatrix = object.matrixWorld.clone();
  
  // 매트릭스를 배열 형태로 변환 (4x4 = 16개 요소)
  const matrix = targetMatrix.toArray();
  
  // 매트릭스에서 변환 정보를 추출하기 위한 벡터/쿼터니언 객체 생성
  const position = new THREE.Vector3(); // 위치
  const quaternion = new THREE.Quaternion(); // 회전 (쿼터니언)
  const scale = new THREE.Vector3(); // 스케일
  
  // 매트릭스를 분해하여 position, rotation(quaternion), scale 추출
  // decompose는 4x4 변환 매트릭스를 위치, 회전, 스케일로 분해합니다
  targetMatrix.decompose(position, quaternion, scale);
  
  // 쿼터니언을 오일러 각도로 변환 (UI 표시를 위해 도 단위로 변환)
  // 쿼터니언은 회전을 표현하는 수학적 방법이며, 오일러 각도는 더 직관적입니다
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  // 객체 내의 모든 메시 정보를 수집
  const meshes: ObjectInfo['meshes'] = [];
  
  // 객체의 모든 자식 노드를 순회하며 메시를 찾습니다
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry; // 지오메트리 (정점, 면 정보)
      const material = child.material; // 재질 (색상, 반사율 등)
      
      let vertices = 0; // 정점 수
      let faces = 0; // 면 수
      
      if (geometry) {
        // 정점 수 계산: position 속성의 count가 정점 수입니다
        if (geometry.attributes.position) {
          vertices = geometry.attributes.position.count;
        }
        
        // 면 수 계산
        if (geometry.index) {
          // 인덱스가 있는 경우: 인덱스 수를 3으로 나누면 면 수 (삼각형)
          faces = geometry.index.count / 3;
        } else {
          // 인덱스가 없는 경우: 정점 수를 3으로 나누면 면 수 (삼각형)
          faces = vertices / 3;
        }
      }

      // 메시 정보 객체 생성
      const meshInfo: ObjectInfo['meshes'][0] = {
        name: child.name || 'Unnamed Mesh', // 메시 이름
        vertices, // 정점 수
        faces: Math.floor(faces), // 면 수 (소수점 제거)
      };

      // MeshStandardMaterial인 경우 재질 정보도 추가
      if (material instanceof THREE.MeshStandardMaterial) {
        meshInfo.material = {
          name: material.name || 'Standard Material', // 재질 이름
          color: `#${material.color.getHexString()}`, // 색상 (16진수)
          metalness: material.metalness, // 금속성 (0~1)
          roughness: material.roughness, // 거칠기 (0~1)
        };
      }

      meshes.push(meshInfo);
    }
  });

  // 추출한 모든 정보를 ObjectInfo 형태로 반환
  return {
    matrix, // 4x4 변환 매트릭스 (16개 요소 배열)
    position: { x: position.x, y: position.y, z: position.z }, // 위치 (X, Y, Z)
    rotation: { 
      // 회전 (도 단위, 라디안에서 변환)
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    },
    scale: { x: scale.x, y: scale.y, z: scale.z }, // 스케일 (X, Y, Z)
    meshes, // 메시 정보 배열
  };
}
