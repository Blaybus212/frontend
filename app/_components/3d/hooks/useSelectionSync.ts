/**
 * 선택 상태 동기화 훅
 * 
 * 외부에서 전달된 selectedModelIndices와 내부 상태를 동기화합니다.
 * 이전 값과 비교하여 실제로 변경되었을 때만 업데이트하여 무한 루프를 방지합니다.
 */

import { useState, useEffect, useRef } from 'react';
import { arraysEqual } from '../utils';

/**
 * 선택 상태 동기화 훅의 Props 인터페이스
 */
interface UseSelectionSyncProps {
  /** 외부에서 전달된 선택된 모델 인덱스 배열 */
  selectedModelIndices: number[];
}

/**
 * 선택 상태 동기화 훅의 반환 타입
 */
interface UseSelectionSyncReturn {
  /** 내부 선택 상태 (외부 props와 동기화됨) */
  selectedIndices: number[];
  /** 선택 상태를 설정하는 함수 */
  setSelectedIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

/**
 * 외부 선택 상태와 내부 상태를 동기화하는 훅
 * 
 * **주요 기능:**
 * - 외부에서 전달된 selectedModelIndices를 내부 상태와 동기화
 * - 이전 값과 비교하여 실제로 변경되었을 때만 업데이트
 * - 무한 루프 방지
 * 
 * @param props - 훅의 props
 * @returns 동기화된 선택 상태와 설정 함수
 * 
 * @example
 * ```tsx
 * const { selectedIndices, setSelectedIndices } = useSelectionSync({
 *   selectedModelIndices: props.selectedModelIndices,
 * });
 * ```
 */
export function useSelectionSync({
  selectedModelIndices,
}: UseSelectionSyncProps): UseSelectionSyncReturn {
  /** 내부 다중 선택 상태 (외부 props와 동기화됨) */
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  /** 이전 선택 인덱스를 추적하여 불필요한 업데이트 방지 */
  const prevSelectedIndicesRef = useRef<number[]>([]);

  /**
   * 외부에서 전달된 selectedModelIndices와 내부 상태를 동기화합니다
   * 
   * 이전 값과 비교하여 실제로 변경되었을 때만 업데이트하여
   * 무한 루프를 방지합니다.
   */
  useEffect(() => {
    if (!arraysEqual(prevSelectedIndicesRef.current, selectedModelIndices)) {
      prevSelectedIndicesRef.current = selectedModelIndices;
      setSelectedIndices(selectedModelIndices);
    }
  }, [selectedModelIndices]);

  return {
    selectedIndices,
    setSelectedIndices,
  };
}
