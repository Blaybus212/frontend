import * as THREE from 'three';

/**
 * 노드가 선택 가능한 부품인지 판단합니다.
 * - 이름이 있어야 함
 * - "Solid"가 포함되지 않아야 함 (Solid1, Solid2 등은 메시 노드)
 * - extras 정보가 있거나 children이 있으면 부품으로 간주
 */
export function isSelectablePart(node: THREE.Object3D): boolean {
  const name = node.name?.trim() || '';
  
  // 이름이 없으면 제외
  if (!name) return false;
  
  // "Solid"가 포함된 노드는 메시이므로 제외
  if (name.includes('Solid')) return false;
  
  // extras 정보가 있으면 부품 (texture, dbId, description 등)
  if (node.userData && Object.keys(node.userData).length > 0) {
    return true;
  }
  
  // children이 있으면 부품 (Solid를 자식으로 가진 노드)
  if (node.children.length > 0) {
    return true;
  }
  
  return false;
}
