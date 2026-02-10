import { Suspense } from 'react';
import * as THREE from 'three';
import { Model } from '../Model';
import type { Model as ModelType } from '../types';

interface ModelListProps {
  models: ModelType[];
  selectedIndices: number[];
  renderMode: 'normal' | 'wireframe';
  onModelRef: (index: number, ref: THREE.Group | null) => void;
  onModelLoaded?: () => void;
}

/**
 * 모델 배열 렌더링 (Suspense + Model)
 * @param props - models, selectedIndices, renderMode, onModelRef, onModelLoaded
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
