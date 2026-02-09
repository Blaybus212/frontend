/**
 * 모델 리스트 컴포넌트
 * 
 * 로드된 모델들을 렌더링하는 컴포넌트입니다.
 */

import { Suspense } from 'react';
import * as THREE from 'three';
import { Model } from '../Model';
import type { Model as ModelType } from '../types';

/**
 * ModelList 컴포넌트의 Props 인터페이스
 */
interface ModelListProps {
  /** 렌더링할 모델 배열 */
  models: ModelType[];
  /** 선택된 모델 인덱스 배열 */
  selectedIndices: number[];
  /** 렌더링 모드 */
  renderMode: 'normal' | 'wireframe';
  /** 모델 참조 설정 콜백 (인덱스, 참조) */
  onModelRef: (index: number, ref: THREE.Group | null) => void;
  /** 모델이 로드될 때 호출할 콜백 (카메라 조정용) */
  onModelLoaded?: () => void;
}

/**
 * 모델 리스트 컴포넌트
 * 
 * 전달받은 모델 배열을 순회하며 각 모델을 렌더링합니다.
 * 모델이 로드되면 참조를 설정하고, 필요시 카메라 조정을 트리거합니다.
 * 
 * @param props - 컴포넌트 props
 * @returns 모델 리스트 JSX
 * 
 * @example
 * ```tsx
 * <ModelList
 *   models={models}
 *   selectedIndices={selectedIndices}
 *   onModelRef={(index, ref) => {
 *     modelRefs.current.set(index, ref);
 *   }}
 *   onModelLoaded={handleModelLoaded}
 * />
 * ```
 */
export function ModelList({
  models,
  selectedIndices,
  renderMode,
  onModelRef,
  onModelLoaded,
}: ModelListProps) {
  return (
    <>
      {models.map((model, index) => {
        return (
          <Suspense key={`${model.id}-${model.url}`} fallback={null}>
            <Model
              url={model.url}
              isSelected={selectedIndices.includes(index)}
              renderMode={renderMode}
              onRef={(ref) => {
                onModelRef(index, ref);
                // 모델이 로드되면 카메라 조정 시도
                if (ref && onModelLoaded) {
                  onModelLoaded();
                }
              }}
            />
          </Suspense>
        );
      })}
    </>
  );
}
