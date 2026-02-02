'use client';

import { useEffect, useState, useCallback } from 'react';
import Scene3D from '../components/Scene3D';

interface Folder {
  name: string;
  path: string;
}

interface File {
  name: string;
  path: string;
  type?: 'gltf' | 'glb';
}

interface Model {
  url: string;
  id: string;
  name: string;
}

export default function TestPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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

  // 선택된 폴더의 파일 목록 가져오기
  useEffect(() => {
    if (!selectedFolder) {
      setFiles([]);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/assets/files?folder=${selectedFolder}`);
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [selectedFolder]);

  // 모델 추가
  const addModel = useCallback((file: File) => {
    const newModel: Model = {
      url: file.path,
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
    };
    setModels((prev) => [...prev, newModel]);
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
      {/* 사이드바 */}
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
                  onClick={() => setSelectedFolder(folder.name)}
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

        {/* 파일 목록 */}
        {selectedFolder && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              3D 모델 파일 ({files.length})
            </h3>
            {loading ? (
              <div className="text-xs text-gray-400">로딩 중...</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
                {files.length === 0 ? (
                  <div className="text-xs text-gray-400">파일이 없습니다</div>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => addModel(file)}
                      className="w-full text-left p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                    >
                      <span>+</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      {file.type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {file.type.toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 추가된 모델 목록 */}
        <div className="mb-6 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            추가된 모델 ({models.length})
          </h3>
          <div className="space-y-2">
            {models.length === 0 ? (
              <div className="text-xs text-gray-400">모델을 추가해주세요</div>
            ) : (
              models.map((model, index) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelIndex(index)}
                  className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedModelIndex === index
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3D 뷰어 */}
      <div className="flex-1 relative bg-black/90 overflow-hidden">
        <Scene3D
          models={models}
          selectedModelIndex={selectedModelIndex}
          onModelSelect={setSelectedModelIndex}
        />

        {models.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 bg-black/50 p-6 rounded-xl backdrop-blur-md">
              <div className="text-xl mb-2 font-bold">모델을 추가해주세요</div>
              <div className="text-sm">왼쪽 사이드바에서 폴더를 선택하고 GLTF/GLB 파일을 추가하세요</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
