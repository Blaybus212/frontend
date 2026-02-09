/**
 * GLTF 파일 관련 유틸리티 함수
 * 
 * GLTF 파일에서 유용한 노드 정보를 추출하는 함수들을 제공합니다.
 * 특히 name, matrix, children이 있는 부모 노드만 필터링하여 추출합니다.
 */

'use client';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * GLTF 노드 정보 인터페이스
 * 
 * GLTF 파일에서 추출한 노드의 메타데이터를 담는 인터페이스입니다.
 */
export interface GLTFNodeInfo {
  /** scene에서의 순서 인덱스 (0부터 시작) */
  index: number;
  /** 노드의 이름 */
  name: string;
  /** 이 노드가 메시를 포함하는지 여부 */
  hasMesh: boolean;
  /** 노드를 찾기 위한 경로 (예: "0/1/2" - scene의 첫 번째 자식의 두 번째 자식의 세 번째 자식) */
  nodePath: string;
  /** 실제 Three.js 객체 참조 (선택적, Three.js 씬이 로드된 경우에만 존재) */
  object3D?: THREE.Object3D;
}

/**
 * GLTF 파일을 로드하여 유용한 노드만 추출합니다
 * 
 * 이 함수는 다음과 같은 작업을 수행합니다:
 * 1. GLTF JSON 파일을 직접 로드하여 파싱합니다
 * 2. Three.js 씬도 로드하여 이름과 객체를 매핑합니다
 * 3. 각 노드의 경로를 계산합니다
 * 4. name, matrix, children이 모두 있는 부모 노드만 필터링합니다
 * 5. "Solid"로 시작하는 이름의 노드는 제외합니다 (메시 그룹화 노드)
 * 
 * 필터링 조건:
 * - name이 있어야 함 (빈 문자열 제외)
 * - matrix가 있어야 함 (4x4 매트릭스, 16개 요소)
 * - children이 있어야 함 (부모 노드만)
 * - 이름이 "Solid"로 시작하지 않아야 함
 * 
 * @param url - GLTF/GLB 파일의 URL 경로
 * @returns 추출된 노드 정보 배열 (Promise)
 * @throws 파일 로드 실패 시 에러를 reject합니다
 * 
 * @example
 * ```tsx
 * const nodes = await extractGLTFNodes('/models/scene.gltf');
 * // nodes: [{ index: 0, name: 'Node1', hasMesh: true, nodePath: '0/1', ... }, ...]
 * ```
 */
export async function extractGLTFNodes(url: string): Promise<GLTFNodeInfo[]> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1단계: GLTF JSON 파일을 직접 로드하여 파싱
      // JSON 파일을 먼저 읽어서 노드 메타데이터를 빠르게 확인합니다
      const response = await fetch(url);
      const gltfJson = await response.json();
      
      // 2단계: Three.js scene도 로드하여 실제 객체와 이름을 매핑
      // JSON만으로는 실제 객체 참조를 얻을 수 없으므로 Three.js 로더 사용
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const nodes: GLTFNodeInfo[] = [];
          const scene = gltf.scene;
          let nodeIndex = 0;
          
          // 3단계: Three.js scene의 모든 객체를 이름으로 매핑
          // 나중에 JSON의 노드 이름으로 실제 객체를 찾기 위해 사용
          const nameToObjectMap = new Map<string, THREE.Object3D>();
          scene.traverse((obj) => {
            if (obj.name && obj.name.trim() !== '') {
              nameToObjectMap.set(obj.name, obj);
            }
          });
          
          // 4단계: 각 노드의 경로를 계산하여 저장
          // 경로는 "0/1/2" 형식으로, scene의 첫 번째 자식의 두 번째 자식의 세 번째 자식을 의미
          const nameToPathMap = new Map<string, string>();
          
          /**
           * 재귀적으로 노드 트리를 순회하며 각 노드의 경로를 계산하는 함수
           * 
           * @param obj - 현재 노드
           * @param path - 현재까지의 경로 (예: "0/1")
           */
          const buildPathMap = (obj: THREE.Object3D, path: string = '') => {
            // 이름이 있는 노드의 경로를 저장
            if (obj.name && obj.name.trim() !== '') {
              nameToPathMap.set(obj.name, path);
            }
            // 자식 노드들의 경로를 재귀적으로 계산
            obj.children.forEach((child, index) => {
              const childPath = path ? `${path}/${index}` : `${index}`;
              buildPathMap(child, childPath);
            });
          };
          
          // scene의 직접 자식들부터 시작하여 경로 맵 구축
          if (scene.children) {
            scene.children.forEach((child, index) => {
              buildPathMap(child, `${index}`);
            });
          }
          
          // 5단계: GLTF JSON의 nodes 배열에서 유용한 노드만 필터링
          const gltfNodes = gltfJson.nodes || [];
          
          gltfNodes.forEach((nodeData: any, index: number) => {
            // 필터링 조건 확인
            const hasName = nodeData.name && nodeData.name.trim() !== ''; // 이름이 있어야 함
            const hasMatrix = nodeData.matrix && Array.isArray(nodeData.matrix) && nodeData.matrix.length === 16; // 4x4 매트릭스
            const hasChildren = nodeData.children && Array.isArray(nodeData.children) && nodeData.children.length > 0; // 자식이 있어야 함
            
            // 모든 조건을 만족하는 부모 노드만 추가
            if (hasName && hasMatrix && hasChildren) {
              // "Solid"로 시작하는 이름은 제외 (일부 모델링 툴에서 메시를 그룹화하는 데 사용)
              const name = nodeData.name.trim();
              if (name.startsWith('Solid')) {
                return; // 이 노드는 건너뜀
              }
              
              // 이름으로 실제 Three.js 객체와 경로 찾기
              const threeObject = nameToObjectMap.get(nodeData.name);
              const nodePath = nameToPathMap.get(nodeData.name) || '';
              
              // 노드 정보를 배열에 추가
              nodes.push({
                index: nodeIndex++,
                name: nodeData.name,
                hasMesh: threeObject ? hasMesh(threeObject) : false, // 메시 포함 여부 확인
                nodePath: nodePath, // 계산된 경로
                object3D: threeObject || undefined, // 실제 객체 참조 (있는 경우)
              });
            }
          });
          
          resolve(nodes);
        },
        undefined, // 진행 콜백 (사용하지 않음)
        (error) => {
          reject(error);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 객체에 메시(Mesh)가 있는지 확인합니다
 * 
 * 객체 자체가 Mesh이거나, 하위 객체 중에 Mesh가 있는지 재귀적으로 확인합니다.
 * 
 * @param object - 확인할 Three.js 객체
 * @returns 메시가 있으면 true, 없으면 false
 * 
 * @example
 * ```tsx
 * const hasMeshValue = hasMesh(groupObject);
 * if (hasMeshValue) {
 *   // handle mesh case
 * }
 * ```
 */
function hasMesh(object: THREE.Object3D): boolean {
  let hasMeshValue = false;
  // 객체의 모든 하위 노드를 순회하며 Mesh를 찾습니다
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      hasMeshValue = true;
    }
  });
  return hasMeshValue;
}
