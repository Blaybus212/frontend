/**
 * 클릭 이벤트 처리 훅
 * 
 * 3D 씬에서 마우스 클릭을 감지하고, 클릭된 객체를 찾아서 선택 상태를 관리합니다.
 * 레이캐스팅(Raycasting)을 사용하여 3D 공간에서 클릭한 위치의 객체를 정확히 찾습니다.
 * 단일 선택과 다중 선택(Ctrl/Cmd 키)을 모두 지원합니다.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useClickHandler 훅의 매개변수 인터페이스
 */
interface UseClickHandlerProps {
  /** 현재 선택된 모델 인덱스 배열 */
  selectedIndices: number[];
  /** 모델 객체들의 참조 맵 (인덱스 -> THREE.Group) */
  modelRefs: React.MutableRefObject<Map<number, THREE.Group>>;
  /** 모델 선택이 변경될 때 호출되는 콜백 함수 */
  onModelSelect: (indices: number[]) => void;
  /** TransformControls의 참조 (드래그 중인지 확인하기 위해 사용) */
  transformControlsRef: React.MutableRefObject<any>;
  /** OrbitControls가 방금 드래그를 끝냈는지 여부 (클릭 이벤트와의 충돌 방지) */
  justEndedDragRef?: React.MutableRefObject<boolean>;
}

/**
 * 마우스 클릭 이벤트를 처리하여 모델 선택을 관리하는 훅
 * 
 * 이 훅은 다음과 같은 작업을 수행합니다:
 * 1. 캔버스에 클릭 이벤트 리스너를 등록합니다
 * 2. 클릭 위치를 3D 공간 좌표로 변환합니다 (정규화된 디바이스 좌표)
 * 3. 레이캐스팅을 사용하여 클릭한 위치와 교차하는 객체를 찾습니다
 * 4. 클릭한 객체가 어느 모델에 속하는지 찾습니다 (userData 또는 부모 추적)
 * 5. Ctrl/Cmd 키 상태에 따라 단일 선택 또는 다중 선택을 처리합니다
 * 6. 빈 공간 클릭 시 선택을 해제합니다
 * 
 * @param props - 훅의 매개변수 객체
 * @param props.selectedIndices - 현재 선택된 모델 인덱스 배열
 * @param props.modelRefs - 모델 객체 참조 맵
 * @param props.onModelSelect - 선택 변경 콜백 함수
 * @param props.transformControlsRef - TransformControls 참조
 * 
 * @example
 * ```tsx
 * useClickHandler({
 *   selectedIndices: [0, 1],
 *   modelRefs: modelRefs,
 *   onModelSelect: (indices) => setSelectedIndices(indices),
 *   transformControlsRef: transformControlsRef,
 * });
 * ```
 */
export function useClickHandler({
  selectedIndices,
  modelRefs,
  onModelSelect,
  transformControlsRef,
  justEndedDragRef,
}: UseClickHandlerProps) {
  const { camera, gl, scene } = useThree();
  /** 레이캐스팅을 위한 Raycaster 객체 (클릭한 위치에서 광선을 발사하여 객체와의 교차를 검사) */
  const raycaster = useRef(new THREE.Raycaster());
  /** 마우스 클릭 위치를 정규화된 디바이스 좌표(-1 ~ 1)로 저장 */
  const mouse = useRef(new THREE.Vector2());

  /**
   * 클릭 이벤트 리스너를 등록하고 처리합니다
   * 
   * 컴포넌트가 마운트될 때 이벤트 리스너를 추가하고,
   * 언마운트될 때 제거하여 메모리 누수를 방지합니다.
   */
  useEffect(() => {
    /**
     * 마우스 클릭 이벤트 핸들러
     * 
     * @param event - 마우스 클릭 이벤트 객체
     */
    const handleClick = (event: MouseEvent) => {
      // TransformControls로 객체를 드래그 중일 때는 클릭 이벤트 무시
      // (드래그 종료 시 클릭으로 인식되는 것을 방지)
      if (transformControlsRef.current?.dragging) return;
      
      // OrbitControls의 드래그가 방금 끝났는지 확인
      // 마우스를 뗄 때 클릭 이벤트가 발생하는 것을 방지
      // (onEnd 이벤트가 먼저 처리되도록 함)
      if (justEndedDragRef?.current) {
        return;
      }

      // 캔버스 요소의 위치와 크기 정보 가져오기
      const rect = gl.domElement.getBoundingClientRect();
      
      // 마우스 클릭 위치를 정규화된 디바이스 좌표로 변환
      // X: -1 (왼쪽) ~ 1 (오른쪽)
      // Y: -1 (아래) ~ 1 (위) - WebGL 좌표계는 Y축이 위쪽이 양수
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 카메라에서 마우스 위치로 향하는 광선(레이) 생성
      raycaster.current.setFromCamera(mouse.current, camera);
      
      // 씬의 모든 Mesh와 Group 객체를 수집하여 레이캐스팅 대상으로 설정
      const objects: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
          objects.push(obj);
        }
      });

      // 레이캐스팅을 수행하여 클릭한 위치와 교차하는 객체들을 찾기
      const intersects = raycaster.current.intersectObjects(objects, true);
      
      // 교차하는 객체가 있는 경우
      if (intersects.length > 0) {
        // 가장 가까운 객체 (첫 번째 교차점) 가져오기
        const clickedObject = intersects[0].object;
        let foundIndex = -1; // 클릭한 객체가 속한 모델의 인덱스
        
        // 클릭한 객체가 어느 모델에 속하는지 찾기
        // 객체의 userData에 저장된 modelRef를 확인하거나, 부모 노드를 추적하여 찾습니다
        let current: THREE.Object3D | null = clickedObject;
        while (current) {
          const currentObj: THREE.Object3D = current;
          
          // 방법 1: userData에 저장된 modelRef 확인
          // Model 컴포넌트에서 모든 하위 객체의 userData에 modelRef를 저장했으므로
          // 이를 통해 빠르게 모델을 찾을 수 있습니다
          if (currentObj.userData.modelRef) {
            modelRefs.current.forEach((group, index) => {
              if (group === currentObj.userData.modelRef) {
                foundIndex = index;
              }
            });
            if (foundIndex >= 0) break;
          }
          
          // 방법 2: 모델 refs를 순회하며 직접 비교하거나 ID로 찾기
          modelRefs.current.forEach((group, index) => {
            if (group && (group === currentObj || group.getObjectById(currentObj.id))) {
              foundIndex = index;
            }
          });
          
          if (foundIndex >= 0) break;
          
          // 찾지 못했으면 부모 노드로 이동하여 계속 탐색
          current = currentObj.parent;
        }
        
        // 모델을 찾은 경우 선택 처리
        if (foundIndex >= 0) {
          // Ctrl (Windows) 또는 Cmd (Mac) 키가 눌려있는지 확인
          const isMultiSelect = event.ctrlKey || event.metaKey;
          
          if (isMultiSelect) {
            // 다중 선택 모드: 이미 선택된 객체면 제거, 아니면 추가
            const newIndices = selectedIndices.includes(foundIndex)
              ? selectedIndices.filter(i => i !== foundIndex) // 이미 선택된 경우 목록에서 제거
              : [...selectedIndices, foundIndex]; // 선택되지 않은 경우 목록에 추가
            onModelSelect(newIndices);
          } else {
            // 단일 선택 모드: 기존 선택을 모두 해제하고 새로 선택
            // 배열의 마지막 요소가 활성 인덱스로 사용됩니다
            const newIndices = [foundIndex];
            onModelSelect(newIndices);
          }
        }
      } else {
        // 빈 공간을 클릭한 경우: Ctrl/Cmd 키가 눌려있지 않으면 모든 선택 해제
        if (!(event.ctrlKey || event.metaKey)) {
          onModelSelect([]);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl, scene, modelRefs, onModelSelect, selectedIndices, transformControlsRef, justEndedDragRef]);
}
