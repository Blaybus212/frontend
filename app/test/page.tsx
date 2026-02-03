'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Scene3D, { ObjectInfo, Model, Scene3DRef } from '../components/Scene3D';
import { extractGLTFNodes } from '../components/3d/gltfUtils';

interface Folder {
  name: string;
  path: string;
}

interface File {
  name: string;
  path: string;
  type?: 'gltf' | 'glb';
}

export default function TestPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null);
  const [selectedModelIndices, setSelectedModelIndices] = useState<number[]>([]); // 다중 선택
  const [loading, setLoading] = useState(false);
  const [objectInfo, setObjectInfo] = useState<ObjectInfo | null>(null);
  const scene3DRef = useRef<Scene3DRef>(null);
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
  // 입력값 상태 관리
  const [positionInput, setPositionInput] = useState({ x: 0, y: 0, z: 0 });
  const [rotationInput, setRotationInput] = useState({ x: 0, y: 0, z: 0 });
  const [scaleInput, setScaleInput] = useState({ x: 1, y: 1, z: 1 });

  // objectInfo가 변경될 때 입력값 동기화
  useEffect(() => {
    if (objectInfo) {
      setPositionInput(objectInfo.position);
      setRotationInput(objectInfo.rotation);
      setScaleInput(objectInfo.scale);
    }
  }, [objectInfo]);

  // 폴더 목록 가져오기
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/assets/folders');
        const data = await response.json();
        setFolders(data.folders || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    fetchFolders();
  }, []);

  // 선택된 폴더의 파일 목록 가져오기 및 첫 번째 GLTF 파일의 노드 추출
  useEffect(() => {
    if (!selectedFolder) {
      setFiles([]);
      setModels([]);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      try {
        // recursive=true로 모든 하위 폴더의 파일 가져오기
        const response = await fetch(`/api/assets/files?folder=${selectedFolder}&recursive=true`);
        const data = await response.json();
        setFiles(data.files || []);
        
        // 첫 번째 GLTF/GLB 파일 찾기
        const gltfFile = data.files?.find((file: File) => 
          file.type === 'gltf' || file.type === 'glb' || 
          file.name.endsWith('.gltf') || file.name.endsWith('.glb')
        );
        
        if (gltfFile) {
          try {
            // GLTF 파일의 노드 추출
            const nodes = await extractGLTFNodes(gltfFile.path);
            
            // 각 노드를 모델로 변환
            const newModels: Model[] = nodes.map((node, index) => ({
              url: gltfFile.path,
              id: `node_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              name: node.name || `Node_${index}`,
              nodeIndex: node.index,
              nodePath: node.nodePath,
            }));
            
            setModels(newModels);
            setSelectedModelIndex(null); // 선택 초기화
          } catch (error) {
            console.error('Error extracting GLTF nodes:', error);
            setModels([]);
            setSelectedModelIndex(null);
          }
        } else {
          setModels([]); // GLTF 파일이 없으면 모델 초기화
          setSelectedModelIndex(null);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedFolder]);

  // 모델 추가 (더 이상 사용하지 않음 - GLTF 파일의 노드들이 자동으로 로드됨)
  const addModel = useCallback((file: File) => {
    // 이 함수는 더 이상 사용되지 않습니다
    // GLTF 파일의 노드들이 자동으로 로드됩니다
  }, []);

  // 모델 제거
  const removeModel = useCallback((modelId: string) => {
    setModels((prev) => {
      const newModels = prev.filter((m) => m.id !== modelId);
      const removedIndex = prev.findIndex((m) => m.id === modelId);
      if (selectedModelIndex === removedIndex) {
        setSelectedModelIndex(null);
      } else if (selectedModelIndex !== null && selectedModelIndex > removedIndex) {
        setSelectedModelIndex(selectedModelIndex - 1);
      }
      return newModels;
    });
  }, [selectedModelIndex]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 왼쪽 사이드바 */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex flex-col shrink-0">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          3D 테스트 환경
        </h2>

        {/* 폴더 선택 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Asset 폴더 선택
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
            {folders.length === 0 ? (
              <div className="text-xs text-gray-400">폴더가 없습니다</div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => {
                    setSelectedFolder(folder.name);
                    // 폴더 선택 시 모든 모델 자동 추가
                  }}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    selectedFolder === folder.name
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  📁 {folder.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 파일 목록 - 숨김 (폴더 선택 시 첫 번째 GLTF 파일의 노드들이 자동 추가) */}
        {selectedFolder && loading && (
          <div className="mb-6">
            <div className="text-xs text-gray-400">GLTF 파일 로딩 및 노드 추출 중...</div>
          </div>
        )}
        
        {/* 선택된 GLTF 파일 정보 */}
        {selectedFolder && !loading && files.length > 0 && (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
            <div className="text-gray-700 dark:text-gray-300 font-semibold mb-1">
              로드된 GLTF 파일:
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {files.find((f: File) => f.type === 'gltf' || f.type === 'glb' || f.name.endsWith('.gltf') || f.name.endsWith('.glb'))?.name || '없음'}
            </div>
          </div>
        )}

        {/* 씬 내보내기 버튼 */}
        {models.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => {
                if (scene3DRef.current) {
                  scene3DRef.current.exportScene();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>📥</span>
              <span>씬을 GLTF로 내보내기</span>
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              모든 모델을 하나의 GLTF 파일로 저장합니다
            </div>
          </div>
        )}

        {/* 추가된 모델 목록 (GLTF 파일의 노드들) */}
        <div className="mb-6 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            모델 노드 ({models.length})
          </h3>
          <div className="space-y-2">
            {models.length === 0 ? (
              <div className="text-xs text-gray-400">모델을 추가해주세요</div>
            ) : (
              models.map((model, index) => {
                const isSelected = selectedModelIndices.includes(index) || selectedModelIndex === index;
                return (
                  <div
                    key={model.id}
                    onClick={(e) => {
                      const isShiftClick = e.shiftKey;
                      
                      if (isShiftClick) {
                        // Shift + 클릭: 다중 선택
                        if (selectedModelIndices.includes(index)) {
                          // 이미 선택된 경우 제거
                          setSelectedModelIndices(prev => prev.filter(i => i !== index));
                          if (selectedModelIndices.length === 1) {
                            setSelectedModelIndex(null);
                          }
                        } else {
                          // 추가 선택
                          setSelectedModelIndices(prev => [...prev, index]);
                          setSelectedModelIndex(index); // 마지막 선택을 단일 선택으로도 설정
                        }
                      } else {
                        // 일반 클릭: 단일 선택
                        setSelectedModelIndices([index]);
                        setSelectedModelIndex(index);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 truncate mr-2">
                      <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {model.name}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeModel(model.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3D 뷰어 */}
      <div className="flex-1 relative bg-black/90 overflow-hidden">
        <Scene3D
          ref={scene3DRef}
          models={models}
          selectedModelIndex={selectedModelIndex}
          selectedModelIndices={selectedModelIndices.length > 1 ? selectedModelIndices : undefined}
          onModelSelect={(index) => {
            setSelectedModelIndex(index);
            setSelectedModelIndices(index !== null ? [index] : []);
          }}
          onModelSelectMultiple={(indices) => {
            setSelectedModelIndices(indices);
            setSelectedModelIndex(indices.length > 0 ? indices[indices.length - 1] : null);
          }}
          onObjectInfoChange={setObjectInfo}
        />

        {models.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 bg-black/50 p-6 rounded-xl backdrop-blur-md">
              <div className="text-xl mb-2 font-bold">GLTF 파일을 로드해주세요</div>
              <div className="text-sm">왼쪽 사이드바에서 폴더를 선택하면 첫 번째 GLTF 파일의 노드들이 자동으로 로드됩니다</div>
            </div>
          </div>
        )}
      </div>

      {/* 우측 정보 패널 */}
      {selectedModelIndex !== null && objectInfo && (
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto shrink-0">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            객체 정보
          </h2>
          
          {/* 모델 이름 */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              모델 이름
            </div>
            <div className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {models[selectedModelIndex]?.name || 'Unnamed'}
            </div>
          </div>

          {/* TransformControls 모드 전환 */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              조작 모드
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setTransformMode('translate');
                  scene3DRef.current?.setTransformMode('translate');
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  transformMode === 'translate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                이동
              </button>
              <button
                onClick={() => {
                  setTransformMode('rotate');
                  scene3DRef.current?.setTransformMode('rotate');
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  transformMode === 'rotate'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                회전
              </button>
              <button
                onClick={() => {
                  setTransformMode('scale');
                  scene3DRef.current?.setTransformMode('scale');
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  transformMode === 'scale'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                크기
              </button>
            </div>
          </div>

          {/* Position */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              위치 (Position)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">X</div>
                <input
                  type="number"
                  step="0.01"
                  value={positionInput.x}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPositionInput(prev => ({ ...prev, x: value }));
                    scene3DRef.current?.updateObjectTransform({ position: { x: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Y</div>
                <input
                  type="number"
                  step="0.01"
                  value={positionInput.y}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPositionInput(prev => ({ ...prev, y: value }));
                    scene3DRef.current?.updateObjectTransform({ position: { y: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Z</div>
                <input
                  type="number"
                  step="0.01"
                  value={positionInput.z}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPositionInput(prev => ({ ...prev, z: value }));
                    scene3DRef.current?.updateObjectTransform({ position: { z: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              회전 (Rotation) - 도(°)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">X</div>
                <input
                  type="number"
                  step="0.1"
                  value={rotationInput.x}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setRotationInput(prev => ({ ...prev, x: value }));
                    scene3DRef.current?.updateObjectTransform({ rotation: { x: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Y</div>
                <input
                  type="number"
                  step="0.1"
                  value={rotationInput.y}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setRotationInput(prev => ({ ...prev, y: value }));
                    scene3DRef.current?.updateObjectTransform({ rotation: { y: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Z</div>
                <input
                  type="number"
                  step="0.1"
                  value={rotationInput.z}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setRotationInput(prev => ({ ...prev, z: value }));
                    scene3DRef.current?.updateObjectTransform({ rotation: { z: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              크기 (Scale)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">X</div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={scaleInput.x}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    setScaleInput(prev => ({ ...prev, x: value }));
                    scene3DRef.current?.updateObjectTransform({ scale: { x: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Y</div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={scaleInput.y}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    setScaleInput(prev => ({ ...prev, y: value }));
                    scene3DRef.current?.updateObjectTransform({ scale: { y: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Z</div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={scaleInput.z}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    setScaleInput(prev => ({ ...prev, z: value }));
                    scene3DRef.current?.updateObjectTransform({ scale: { z: value } });
                  }}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Matrix */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Matrix (4x4)
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-xs overflow-x-auto">
              <div className="grid grid-cols-4 gap-1">
                {objectInfo.matrix.map((value, index) => (
                  <div key={index} className="text-gray-900 dark:text-white">
                    {value.toFixed(6)}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div>인덱스 0-3: X축 변환</div>
                <div>인덱스 4-7: Y축 변환</div>
                <div>인덱스 8-11: Z축 변환</div>
                <div>인덱스 12-14: 위치 (X, Y, Z)</div>
                <div>인덱스 15: 동차 좌표</div>
              </div>
            </div>
          </div>

          {/* Meshes */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Mesh 정보 ({objectInfo.meshes.length}개)
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {objectInfo.meshes.map((mesh, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                    {mesh.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>정점: {mesh.vertices.toLocaleString()}개</div>
                    <div>면: {mesh.faces.toLocaleString()}개</div>
                    {mesh.material && (
                      <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <div className="font-medium mb-1">재질: {mesh.material.name}</div>
                        {mesh.material.color && (
                          <div className="flex items-center gap-2">
                            <span>색상:</span>
                            <span 
                              className="inline-block w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: mesh.material.color }}
                            />
                            <span>{mesh.material.color}</span>
                          </div>
                        )}
                        {mesh.material.metalness !== undefined && (
                          <div>금속성: {mesh.material.metalness.toFixed(2)}</div>
                        )}
                        {mesh.material.roughness !== undefined && (
                          <div>거칠기: {mesh.material.roughness.toFixed(2)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
