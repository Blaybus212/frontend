/**
 * 씬 내보내기 유틸리티
 * 
 * 현재 씬에 로드된 모든 3D 모델을 하나의 GLTF 또는 GLB 파일로 내보냅니다.
 * GLTFExporter를 사용하여 Three.js 객체를 표준 GLTF 형식으로 변환합니다.
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { Model } from '../types';

/**
 * 씬을 GLTF/GLB 파일로 내보내기
 * 
 * 현재 씬에 있는 모든 모델을 하나의 그룹으로 합쳐서 GLTF 또는 GLB 파일로 내보냅니다.
 * 
 * 내보내기 과정:
 * 1. 모든 모델을 하나의 그룹으로 합치기
 * 2. 각 모델을 복제하여 추가 (원본은 유지)
 * 3. GLTFExporter를 사용하여 GLTF 형식으로 변환
 * 4. 변환된 데이터를 Blob으로 만들어 다운로드 링크 생성
 * 5. 자동으로 다운로드 실행
 * 
 * @param modelRefs - 모델 객체들의 참조 맵 (인덱스 -> THREE.Group)
 * @param models - 모델 메타데이터 배열 (이름 등)
 * 
 * @throws 모델이 없으면 alert를 표시하고 함수를 종료합니다
 * @throws 내보내기 중 오류가 발생하면 콘솔에 에러를 출력하고 alert를 표시합니다
 * 
 * @example
 * ```tsx
 * exportScene(modelRefs.current, models);
 * // 결과: scene.gltf 또는 scene.glb 파일이 다운로드됩니다
 * ```
 */
export function exportScene(
  modelRefs: Map<number, THREE.Group>,
  models: Model[]
): void {
  // 모델이 없으면 경고 메시지 표시 후 종료
  if (modelRefs.size === 0) {
    alert('내보낼 모델이 없습니다.');
    return;
  }

  // 모든 모델을 하나의 그룹으로 합치기
  // 이 그룹이 최종적으로 GLTF 파일로 변환됩니다
  const exportGroup = new THREE.Group();
  exportGroup.name = 'ExportedScene';

  // 각 모델을 복제하여 내보내기 그룹에 추가
  // clone(true)는 깊은 복사를 의미하며, 원본 모델은 그대로 유지됩니다
  modelRefs.forEach((modelGroup, index) => {
    if (modelGroup) {
      // ✅ 순환 참조 제거: clone 전에 원본의 userData를 임시로 정리
      const userDataBackup = new Map<THREE.Object3D, any>();
      
      modelGroup.traverse((node) => {
        if (node.userData && Object.keys(node.userData).length > 0) {
          // 원본 userData 백업
          userDataBackup.set(node, node.userData);
          
          // 순환 참조 제거한 깨끗한 userData 생성
          const cleanUserData: any = {};
          Object.keys(node.userData).forEach((key) => {
            // Three.js 객체 참조나 함수가 아닌 값만 복사
            if (
              key !== 'modelRef' &&
              key !== 'selectable' &&
              typeof node.userData[key] !== 'function' &&
              !(node.userData[key] instanceof THREE.Object3D)
            ) {
              cleanUserData[key] = node.userData[key];
            }
          });
          
          // 임시로 깨끗한 userData 설정
          node.userData = cleanUserData;
        }
      });
      
      // 이제 안전하게 clone
      const cloned = modelGroup.clone(true);
      cloned.name = models[index]?.name || `Model_${index}`;
      
      // 원본 userData 복원
      userDataBackup.forEach((userData, node) => {
        node.userData = userData;
      });
      
      exportGroup.add(cloned);
    }
  });

  // GLTFExporter를 사용하여 Three.js 객체를 GLTF 형식으로 변환
  const exporter = new GLTFExporter();
  
  /**
   * GLTF 변환 완료 콜백
   * 
   * @param result - 변환된 GLTF 데이터 (ArrayBuffer 또는 객체)
   */
  exporter.parse(
    exportGroup,
    (result) => {
      if (result instanceof ArrayBuffer) {
        // GLB 형식 (바이너리): 바이너리 데이터가 반환된 경우
        // GLB는 GLTF의 바이너리 버전으로, 모든 데이터가 하나의 파일에 포함됩니다
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'scene.glb'; // 파일명
        document.body.appendChild(link);
        link.click(); // 자동으로 다운로드 실행
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // 메모리 정리
      } else if (result) {
        // GLTF 형식 (JSON): JSON 객체가 반환된 경우
        // GLTF는 텍스트 기반 형식으로, JSON 파일과 외부 바이너리 파일로 구성됩니다
        const output = JSON.stringify(result, null, 2); // 들여쓰기 포함하여 JSON 문자열로 변환
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'scene.gltf'; // 파일명
        document.body.appendChild(link);
        link.click(); // 자동으로 다운로드 실행
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // 메모리 정리
      }
    },
    /**
     * GLTF 변환 오류 콜백
     * 
     * @param error - 발생한 오류 객체
     */
    (error) => {
      console.error('GLTF export error:', error);
      alert('씬 내보내기 중 오류가 발생했습니다.');
    },
    {
      binary: false, // GLTF 형식으로 내보내기 (true면 GLB)
      onlyVisible: false, // 보이지 않는 객체도 포함
      truncateDrawRange: true // 최적화 옵션
    }
  );
}
