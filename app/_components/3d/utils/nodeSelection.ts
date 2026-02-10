import * as THREE from 'three';

/**
 * 노드가 선택 가능한 부품인지 판별
 * @param node - 검사할 Three.js 객체
 * @returns 이름 있음, "Solid" 미포함, extras 또는 children 보유 시 true
 */
export function isSelectablePart(node: THREE.Object3D): boolean {
  const name = node.name?.trim() || '';
  if (!name) return false;
  if (name.includes('Solid')) return false;
  if (node.userData && Object.keys(node.userData).length > 0) return true;
  if (node.children.length > 0) return true;
  return false;
}
