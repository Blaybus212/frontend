/**
 * GLTF 파일 관련 유틸리티 함수
 */

'use client';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export interface GLTFNodeInfo {
  index: number; // scene에서의 순서 인덱스
  name: string;
  hasMesh: boolean;
  nodePath: string; // 노드를 찾기 위한 경로 (예: "0/1/2")
  object3D?: THREE.Object3D; // 실제 Three.js 객체 참조 (선택적)
}

/**
 * GLTF 파일을 로드하여 name과 matrix가 있고 children이 있는 부모 노드만 추출합니다
 */
export async function extractGLTFNodes(url: string): Promise<GLTFNodeInfo[]> {
  return new Promise(async (resolve, reject) => {
    try {
      // GLTF JSON 파일을 직접 로드하여 파싱
      const response = await fetch(url);
      const gltfJson = await response.json();
      
      // Three.js scene도 로드하여 이름으로 매핑
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const nodes: GLTFNodeInfo[] = [];
          const scene = gltf.scene;
          let nodeIndex = 0;
          
          // Three.js scene의 모든 객체를 이름으로 매핑
          const nameToObjectMap = new Map<string, THREE.Object3D>();
          scene.traverse((obj) => {
            if (obj.name && obj.name.trim() !== '') {
              nameToObjectMap.set(obj.name, obj);
            }
          });
          
          // 경로를 저장하기 위한 맵 (이름 -> 경로)
          const nameToPathMap = new Map<string, string>();
          const buildPathMap = (obj: THREE.Object3D, path: string = '') => {
            if (obj.name && obj.name.trim() !== '') {
              nameToPathMap.set(obj.name, path);
            }
            obj.children.forEach((child, index) => {
              const childPath = path ? `${path}/${index}` : `${index}`;
              buildPathMap(child, childPath);
            });
          };
          // scene의 직접 자식들부터 시작
          if (scene.children) {
            scene.children.forEach((child, index) => {
              buildPathMap(child, `${index}`);
            });
          }
          
          // GLTF JSON의 nodes 배열에서 name과 matrix가 있고 children이 있는 노드 찾기
          const gltfNodes = gltfJson.nodes || [];
          
          gltfNodes.forEach((nodeData: any, index: number) => {
            const hasName = nodeData.name && nodeData.name.trim() !== '';
            const hasMatrix = nodeData.matrix && Array.isArray(nodeData.matrix) && nodeData.matrix.length === 16;
            const hasChildren = nodeData.children && Array.isArray(nodeData.children) && nodeData.children.length > 0;
            
            // name과 matrix가 있고 children이 있는 노드만 추가 (부모 노드만)
            if (hasName && hasMatrix && hasChildren) {
              // "Solid"로 시작하는 이름은 제외 (메시 그룹화 노드)
              const name = nodeData.name.trim();
              if (name.startsWith('Solid')) {
                return; // 이 노드는 건너뜀
              }
              
              const threeObject = nameToObjectMap.get(nodeData.name);
              const nodePath = nameToPathMap.get(nodeData.name) || '';
              
              nodes.push({
                index: nodeIndex++,
                name: nodeData.name,
                hasMesh: threeObject ? hasMesh(threeObject) : false,
                nodePath: nodePath,
                object3D: threeObject || undefined,
              });
            }
          });
          
          resolve(nodes);
        },
        undefined,
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
 * 객체에 메시가 있는지 확인
 */
function hasMesh(object: THREE.Object3D): boolean {
  let hasMeshValue = false;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      hasMeshValue = true;
    }
  });
  return hasMeshValue;
}
