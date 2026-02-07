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
 * 선택된 노드 정보 인터페이스
 */
export interface SelectedNode {
  /** 모델 인덱스 */
  modelIndex: number;
  /** 노드 ID */
  nodeId: string;
  /** 노드 참조 */
  nodeRef: THREE.Object3D;
}

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
  /** 선택된 노드가 변경될 때 호출되는 콜백 함수 */
  onNodeSelect?: (nodes: SelectedNode[] | null) => void;
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
  onNodeSelect,
  transformControlsRef,
  justEndedDragRef,
}: UseClickHandlerProps) {
  /** 현재 선택된 노드들 */
  const selectedNodesRef = useRef<SelectedNode[]>([]);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDraggingRef = useRef(false);
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
    const handleSelection = (event: PointerEvent) => {
      if (transformControlsRef.current?.dragging) {
        return;
      }

      if (justEndedDragRef?.current) {
        justEndedDragRef.current = false;
        return;
      }

      if (isPointerDraggingRef.current) {
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
        let clickedNode: THREE.Object3D | null = null;
        let nodeId: string | null = null;
        
        // 클릭한 객체가 어느 모델에 속하는지 찾고, 개별 노드도 찾기
        let current: THREE.Object3D | null = clickedObject;
        let depth = 0; // 무한 루프 방지
        const maxDepth = 20;
        
        while (current && depth < maxDepth && foundIndex < 0) {
          depth++;
          const currentObj: THREE.Object3D = current;
          
          // 개별 노드 찾기 (userData에 nodeId가 있고 selectable이 true인 경우만)
          // Group인 노드를 우선적으로 선택 (TransformControls가 Group과 잘 작동함)
          if (!clickedNode && currentObj.userData && currentObj.userData.nodeId && currentObj.userData.selectable !== false) {
            // 선택 가능한 노드인지 확인
            if (currentObj.userData.selectable === true) {
              // Group인 노드를 우선적으로 선택
              if (currentObj instanceof THREE.Group) {
                clickedNode = currentObj;
                nodeId = currentObj.userData.nodeId;
              } else if (!clickedNode) {
                // Group이 아니면 일단 저장하고, 나중에 Group인 부모를 찾음
                clickedNode = currentObj;
                nodeId = currentObj.userData.nodeId;
              }
            }
          }
          
          // 방법 1: userData에 저장된 modelRef 확인 (가장 빠른 방법)
          if (currentObj.userData && currentObj.userData.modelRef) {
            for (const [index, group] of modelRefs.current.entries()) {
              if (group === currentObj.userData.modelRef) {
                foundIndex = index;
                break;
              }
            }
            if (foundIndex >= 0) break;
          }
          
          // 방법 2: 모델 refs를 순회하며 직접 비교하거나 자식인지 확인
          for (const [index, group] of modelRefs.current.entries()) {
            if (!group) continue;
            
            // 직접 비교
            if (group === currentObj) {
              foundIndex = index;
              break;
            }
            
            // 자식 중에 있는지 확인 (직접 자식)
            if (group.children.includes(currentObj)) {
              foundIndex = index;
              break;
            }
            
            // 재귀적으로 자식 트리를 탐색 (getObjectById 사용)
            if (group.getObjectById && group.getObjectById(currentObj.id)) {
              foundIndex = index;
              break;
            }
          }
          
          if (foundIndex >= 0) break;
          
          // 찾지 못했으면 부모 노드로 이동하여 계속 탐색
          current = currentObj.parent;
        }
        
        // 노드를 찾지 못했으면 부모 노드를 찾아서 선택 가능한 노드 찾기
        if (!clickedNode && clickedObject) {
          // 부모 노드를 찾아서 선택 가능한 nodeId가 있는지 확인
          let parent = clickedObject.parent;
          while (parent && !clickedNode) {
            if (parent.userData && parent.userData.nodeId && parent.userData.selectable === true) {
              // Group인 부모를 우선적으로 선택
              if (parent instanceof THREE.Group) {
                clickedNode = parent;
                nodeId = parent.userData.nodeId;
                break;
              } else if (!clickedNode) {
                clickedNode = parent;
                nodeId = parent.userData.nodeId;
              }
            }
            parent = parent.parent;
          }
        }
        
        // 선택된 노드가 Group이 아니면 Group인 부모를 찾기
        if (clickedNode && !(clickedNode instanceof THREE.Group)) {
          let parent = clickedNode.parent;
          while (parent) {
            if (parent instanceof THREE.Group && parent.userData && parent.userData.nodeId === nodeId) {
              clickedNode = parent;
              break;
            }
            parent = parent.parent;
          }
        }
        
        // 선택 가능한 노드를 찾지 못했으면 선택 불가능
        if (!clickedNode || !nodeId) {
          // 빈 공간 클릭과 동일하게 처리
          if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
            selectedNodesRef.current = [];
            onModelSelect([]);
            if (onNodeSelect) {
              onNodeSelect(null);
            }
          }
          return;
        }

        // 모델을 찾은 경우 선택 처리
        if (foundIndex >= 0 && clickedNode && nodeId) {
          // Ctrl (Windows) 또는 Cmd (Mac) 또는 Shift 키가 눌려있는지 확인
          const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
          
          const newSelectedNode: SelectedNode = {
            modelIndex: foundIndex,
            nodeId: nodeId,
            nodeRef: clickedNode,
          };
          
          if (isMultiSelect) {
            // 다중 선택 모드: 이미 선택된 노드면 제거, 아니면 추가
            const existingIndex = selectedNodesRef.current.findIndex(
              n => n.modelIndex === foundIndex && n.nodeId === nodeId
            );
            
            let newNodes: SelectedNode[];
            if (existingIndex >= 0) {
              newNodes = selectedNodesRef.current.filter((_, i) => i !== existingIndex);
            } else {
              newNodes = [...selectedNodesRef.current, newSelectedNode];
            }
            
            selectedNodesRef.current = newNodes;
            
            // 모델 인덱스 배열도 업데이트 (중복 제거)
            const modelIndices = Array.from(new Set(newNodes.map(n => n.modelIndex)));
            onModelSelect(modelIndices);
            
            // 노드 선택 콜백 호출
            if (onNodeSelect) {
              onNodeSelect(newNodes.length > 0 ? newNodes : null);
            }
          } else {
            // 단일 선택 모드: 기존 선택을 모두 해제하고 새로 선택
            selectedNodesRef.current = [newSelectedNode];
            onModelSelect([foundIndex]);
            
            // 노드 선택 콜백 호출
            if (onNodeSelect) {
              onNodeSelect([newSelectedNode]);
            }
          }
        }
      } else {
        // 빈 공간을 클릭한 경우: Ctrl/Cmd 키가 눌려있지 않으면 모든 선택 해제
        if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
          selectedNodesRef.current = [];
          onModelSelect([]);
          if (onNodeSelect) {
            onNodeSelect(null);
          }
        }
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
      isPointerDraggingRef.current = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDownPosRef.current) return;
      const dx = event.clientX - pointerDownPosRef.current.x;
      const dy = event.clientY - pointerDownPosRef.current.y;
      if (Math.hypot(dx, dy) > 3) {
        isPointerDraggingRef.current = true;
      }
    };

    const handlePointerUp = () => {
      if (isPointerDraggingRef.current) {
        if (justEndedDragRef) {
          justEndedDragRef.current = true;
          setTimeout(() => {
            if (justEndedDragRef) {
              justEndedDragRef.current = false;
            }
          }, 50);
        }
      }
      pointerDownPosRef.current = null;
      isPointerDraggingRef.current = false;
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    gl.domElement.addEventListener('pointerup', handlePointerUp);
    gl.domElement.addEventListener('pointerup', handleSelection);
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      gl.domElement.removeEventListener('pointerup', handleSelection);
    };
  }, [camera, gl, scene, modelRefs, onModelSelect, onNodeSelect, selectedIndices, transformControlsRef, justEndedDragRef]);
}
