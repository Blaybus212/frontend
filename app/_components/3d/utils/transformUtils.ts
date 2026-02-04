/**
 * 객체 변환 유틸리티
 * 
 * 3D 객체의 위치(position), 회전(rotation), 스케일(scale)을 업데이트하는 함수입니다.
 * 외부에서 입력된 값(예: UI 입력 필드)을 Three.js 객체에 적용합니다.
 */

import * as THREE from 'three';
import { extractObjectInfo } from '../utils';
import type { Transform, ObjectInfo } from '../types';

/**
 * 객체의 변환(위치, 회전, 스케일)을 업데이트합니다
 * 
 * 이 함수는 다음과 같은 작업을 수행합니다:
 * 1. 위치(position) 업데이트: X, Y, Z 좌표를 직접 설정
 * 2. 회전(rotation) 업데이트: 도(degree) 단위를 라디안으로 변환하여 설정
 * 3. 스케일(scale) 업데이트: X, Y, Z 축의 크기 비율을 설정
 * 4. 업데이트 후 객체 정보를 추출하여 콜백 함수로 전달
 * 
 * 각 변환 값은 선택적으로 제공될 수 있으며, 제공된 값만 업데이트됩니다.
 * 예를 들어 position만 제공되면 회전과 스케일은 변경되지 않습니다.
 * 
 * @param object - 변환을 적용할 Three.js 객체 (THREE.Group)
 * @param transform - 적용할 변환 값들
 * @param transform.position - 위치 값 (선택적, {x?, y?, z?})
 * @param transform.rotation - 회전 값 (선택적, 도 단위, {x?, y?, z?})
 * @param transform.scale - 스케일 값 (선택적, {x?, y?, z?})
 * @param onObjectInfoChange - 변환 적용 후 호출될 콜백 함수 (선택적)
 * 
 * @example
 * ```tsx
 * // 위치만 변경
 * updateObjectTransform(object, {
 *   position: { x: 10, y: 5, z: 0 }
 * });
 * 
 * // 회전만 변경 (도 단위)
 * updateObjectTransform(object, {
 *   rotation: { x: 45, y: 90, z: 0 }
 * });
 * 
 * // 모든 변환 변경
 * updateObjectTransform(object, {
 *   position: { x: 10, y: 5, z: 0 },
 *   rotation: { x: 45, y: 90, z: 0 },
 *   scale: { x: 2, y: 2, z: 2 }
 * }, (info) => {
 *   console.log('Updated object info:', info);
 * });
 * ```
 */
export function updateObjectTransform(
  object: THREE.Group | null,
  transform: Transform,
  onObjectInfoChange?: (info: ObjectInfo | null) => void
): void {
  // 객체가 없으면 함수 종료
  if (!object) return;

  // 위치(position) 업데이트
  // 제공된 각 축의 값만 업데이트 (부분 업데이트 지원)
  if (transform.position !== undefined) {
    if (transform.position.x !== undefined) object.position.x = transform.position.x;
    if (transform.position.y !== undefined) object.position.y = transform.position.y;
    if (transform.position.z !== undefined) object.position.z = transform.position.z;
  }
  
  // 회전(rotation) 업데이트
  // 입력값은 도(degree) 단위이므로 라디안으로 변환하여 설정
  // Three.js는 내부적으로 라디안을 사용합니다
  if (transform.rotation !== undefined) {
    if (transform.rotation.x !== undefined) object.rotation.x = THREE.MathUtils.degToRad(transform.rotation.x);
    if (transform.rotation.y !== undefined) object.rotation.y = THREE.MathUtils.degToRad(transform.rotation.y);
    if (transform.rotation.z !== undefined) object.rotation.z = THREE.MathUtils.degToRad(transform.rotation.z);
  }
  
  // 스케일(scale) 업데이트
  // 각 축의 크기 비율을 설정 (1.0 = 원본 크기, 2.0 = 2배 확대)
  if (transform.scale !== undefined) {
    if (transform.scale.x !== undefined) object.scale.x = transform.scale.x;
    if (transform.scale.y !== undefined) object.scale.y = transform.scale.y;
    if (transform.scale.z !== undefined) object.scale.z = transform.scale.z;
  }
  
  // 변환 적용 후 객체 정보를 추출하여 콜백 함수로 전달
  // 이를 통해 UI가 업데이트된 정보를 반영할 수 있습니다
  if (onObjectInfoChange) {
    const info = extractObjectInfo(object);
    onObjectInfoChange(info);
  }
}
