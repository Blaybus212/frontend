import * as THREE from 'three';

/**
 * 노드가 선택 가능한 부품인지 판단합니다.
 * - 이름이 있어야 함
 * - children이 있어야 함
 * - "Solid"로 시작하지 않아야 함
 */
export function isSelectablePart(node: THREE.Object3D): boolean {
  const name = node.name?.trim() || '';
  const hasName = name !== '';
  const hasChildren = node.children.length > 0;
  return hasName && hasChildren && !name.startsWith('Solid');
}
