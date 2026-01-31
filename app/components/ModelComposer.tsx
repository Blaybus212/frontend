'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

// R3F를 dynamic import로 로드 (Next.js 15 호환성)
const ModelComposer3D = dynamic(
  () => import('./ModelComposer3D').then(mod => ({ default: mod.ModelComposer3D })),
  { ssr: false }
);

interface LoadedObject {
  id: string;
  name: string;
  path: string;
  group: THREE.Group;
}

interface TooltipData {
  name: string;
  x: number;
  y: number;
}

function ModelComposer() {
  const [loadedObjects, setLoadedObjects] = useState<LoadedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; path: string }>>([]);

  // 모델 목록 로드
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          const objModels = data.models.filter((m: { type: string }) => m.type === 'obj');
          setAvailableModels(objModels);
        }
      } catch (error) {
        console.error('모델 목록 로드 실패:', error);
      }
    };
    fetchModels();
  }, []);

  const addObject = useCallback(async (modelPath: string) => {
    const fileName = modelPath.split('/').pop() || 'Unknown';
    const name = fileName.replace('.obj', '').replace(/_/g, ' ');
    const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // R3F의 useLoader를 사용하므로 여기서는 그룹만 생성
    const group = new THREE.Group();
    const newObject: LoadedObject = { id, name, path: modelPath, group };
    
    setLoadedObjects((prev) => [...prev, newObject]);
  }, []);

  const removeObject = useCallback((objectId: string) => {
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }

    setLoadedObjects((prev) => {
      const obj = prev.find(o => o.id === objectId);
      if (obj) {
        // 리소스 정리
        obj.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      return prev.filter(obj => obj.id !== objectId);
    });
  }, [selectedObjectId]);

  const handleObjectSelect = useCallback((id: string | null) => {
    setSelectedObjectId(id);
  }, []);

  const handleTooltipChange = useCallback((tooltip: TooltipData | null) => {
    setTooltip(tooltip);
  }, []);

  return (
    <div className="flex h-full w-full">
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex flex-col shrink-0">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          오브젝트 관리
        </h2>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            모델 추가
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
            {availableModels.length === 0 && (
              <div className="text-xs text-gray-400">사용 가능한 모델 없음</div>
            )}
            {availableModels.map((model) => (
              <button
                key={model.path}
                onClick={() => addObject(model.path)}
                className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm transition-colors"
              >
                + {model.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            로드된 오브젝트 ({loadedObjects.length})
          </h3>
          <div className="space-y-2">
            {loadedObjects.map((obj) => (
              <div
                key={obj.id}
                onClick={() => handleObjectSelect(obj.id)}
                className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedObjectId === obj.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 truncate mr-2">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {obj.name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeObject(obj.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedObjectId && (
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              변환 모드
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTransformMode('translate')}
                className={`p-2 rounded text-white text-sm transition-colors ${
                  transformMode === 'translate' 
                    ? 'bg-blue-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                이동
              </button>
              <button
                onClick={() => setTransformMode('rotate')}
                className={`p-2 rounded text-white text-sm transition-colors ${
                  transformMode === 'rotate' 
                    ? 'bg-green-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                회전
              </button>
              <button
                onClick={() => setTransformMode('scale')}
                className={`p-2 rounded text-white text-sm transition-colors ${
                  transformMode === 'scale' 
                    ? 'bg-purple-600' 
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                크기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative bg-black/90 overflow-hidden">
        <ModelComposer3D
          loadedObjects={loadedObjects}
          selectedObjectId={selectedObjectId}
          transformMode={transformMode}
          onObjectSelect={handleObjectSelect}
          onTooltipChange={handleTooltipChange}
        />

        {tooltip && (
          <div
            className="absolute bg-black/80 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-50 shadow-lg border border-gray-600 backdrop-blur-sm"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 40}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold">{tooltip.name}</div>
          </div>
        )}

        {loadedObjects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 bg-black/50 p-6 rounded-xl backdrop-blur-md">
              <div className="text-xl mb-2 font-bold">오브젝트를 추가해주세요</div>
              <div className="text-sm">왼쪽 사이드바에서 모델을 선택하여 배치할 수 있습니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelComposer;
