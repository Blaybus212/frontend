'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ModelList from './components/ModelList';

/**
 * ModelViewer를 동적 import로 로드
 * 
 * Three.js는 서버 사이드 렌더링(SSR)을 지원하지 않으므로,
 * 클라이언트에서만 로드되도록 dynamic import를 사용합니다.
 * ssr: false 옵션으로 SSR을 비활성화합니다.
 */
const ModelViewer = dynamic(() => import('./components/ModelViewer'), {
  ssr: false,
});

/**
 * 모델 정보 인터페이스
 * @interface Model
 * @property {string} name - 모델의 표시 이름
 * @property {string} path - 모델 파일의 경로
 */
interface Model {
  name: string;
  path: string;
}

/**
 * 메인 페이지 컴포넌트
 * 
 * 3D 모델 뷰어 애플리케이션의 메인 페이지입니다.
 * 
 * 주요 기능:
 * - API에서 모델 목록을 가져옴
 * - 모델 목록을 사이드바에 표시
 * - 선택된 모델을 3D 뷰어에 표시
 * - 사용자 컨트롤 가이드 표시
 * 
 * 레이아웃:
 * - 왼쪽: 모델 목록 사이드바 (고정 너비 320px)
 * - 오른쪽: 3D 모델 뷰어 (나머지 공간)
 * - 하단: 컨트롤 가이드 오버레이
 * 
 * @component
 * @returns {JSX.Element} 메인 페이지 컴포넌트
 */
export default function Home() {
  const router = useRouter();
  /** 사용 가능한 모델 목록 */
  const [models, setModels] = useState<Model[]>([]);
  /** 현재 선택된 모델의 경로 */
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  /** 모델 목록 로딩 상태 */
  const [loading, setLoading] = useState(true);

  /**
   * 모델 목록 가져오기
   * 
   * 컴포넌트가 마운트될 때 API에서 모델 목록을 가져옵니다.
   * 
   * @effect
   * @dependencies [] - 마운트 시 한 번만 실행
   */
  useEffect(() => {
    /**
     * API에서 모델 목록을 가져오는 비동기 함수
     * 
     * @async
     * @function fetchModels
     * @returns {Promise<void>}
     */
    const fetchModels = async () => {
      try {
        /**
         * API 엔드포인트 호출
         * /api/models 엔드포인트에서 모델 목록을 가져옵니다.
         */
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('모델 목록을 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          /**
           * 첫 번째 모델을 기본으로 선택
           * 사용자가 모델을 선택하지 않았을 때 기본 모델을 표시합니다.
           */
          setSelectedModel(data.models[0].path);
        } else {
          console.warn('모델 파일을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('모델 목록 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  /**
   * 모델 선택 핸들러
   * 
   * 사용자가 모델 목록에서 모델을 선택했을 때 호출됩니다.
   * 선택된 모델의 경로를 상태에 저장하여 ModelViewer에 전달합니다.
   * 
   * @param {string} modelPath - 선택된 모델의 경로
   */
  const handleSelectModel = (modelPath: string) => {
    setSelectedModel(modelPath);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden fixed inset-0">
      {/* 자유공간 버튼 */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => router.push('/composer')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold transition-colors duration-200 flex items-center gap-2"
        >
          <span>🎨</span>
          <span>자유공간</span>
        </button>
      </div>

      {/* 모델 리스트 사이드바 */}
      <div className="w-80 flex-shrink-0 overflow-y-auto h-full">
        <ModelList
          models={models}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
        />
      </div>

      {/* 3D 뷰어 메인 영역 */}
      <div className="flex-1 relative overflow-hidden h-full">
        {selectedModel ? (
          <div className="w-full h-full">
            <ModelViewer modelPath={selectedModel} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            모델을 선택해주세요.
          </div>
        )}
        
        {/* 컨트롤 안내 */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">컨트롤 가이드</div>
          <div>🖱️ 왼쪽 클릭 + 드래그: 회전</div>
          <div>🖱️ 오른쪽 클릭 + 드래그: 패닝</div>
          <div>🖱️ 휠: 줌 인/아웃</div>
        </div>
      </div>
    </div>
  );
}
