'use client';

import React, { Suspense, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SceneContent } from './3d/SceneContent';
import type { ObjectInfo, Model, Scene3DRef } from './3d/types';

interface Scene3DProps {
  models: Model[];
  selectedModelIndices: number[]; // 선택된 모델 인덱스 배열 (단일 선택 시 배열의 마지막 요소가 활성 인덱스)
  onModelSelect: (indices: number[]) => void; // 선택 변경 콜백 (항상 배열로 전달)
  onObjectInfoChange?: (info: ObjectInfo | null) => void;
  /** 조립/분해 슬라이더 값 (0-100, 0=조립 상태, 100=분해 상태) */
  assemblyValue?: number;
}

/**
 * 3D 씬을 렌더링하는 메인 컴포넌트
 * Canvas를 래핑하고 SceneContent를 렌더링합니다.
 */
const Scene3D = forwardRef<Scene3DRef, Scene3DProps>(
  ({ models, selectedModelIndices, onModelSelect, onObjectInfoChange, assemblyValue = 0 }, ref) => {
    const sceneContentRef = useRef<Scene3DRef>(null);

    // 외부 ref를 sceneContentRef에 연결
    useImperativeHandle(ref, () => ({
      exportScene: () => {
        sceneContentRef.current?.exportScene();
      },
      updateObjectTransform: (transform) => {
        sceneContentRef.current?.updateObjectTransform(transform);
      },
      setTransformMode: (mode) => {
        sceneContentRef.current?.setTransformMode(mode);
      },
      getSceneState: () => {
        return sceneContentRef.current?.getSceneState() || null;
      },
      resetToAssembly: () => {
        sceneContentRef.current?.resetToAssembly();
      },
    }));

    return (
      <Canvas
        camera={{ position: [0, 5, 15], fov: 50, near: 0.01, far: 10000 }}
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: 'var(--color-surface)', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneContent
            ref={sceneContentRef}
            models={models}
            selectedModelIndices={selectedModelIndices}
            onModelSelect={onModelSelect}
            onObjectInfoChange={onObjectInfoChange}
            assemblyValue={assemblyValue}
          />
        </Suspense>
      </Canvas>
    );
  }
);

Scene3D.displayName = 'Scene3D';

export default Scene3D;
export type { ObjectInfo, Model, Scene3DRef } from './3d/types';
