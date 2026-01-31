'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

/**
 * ModelComposer를 동적 import로 로드
 * Three.js는 서버 사이드 렌더링(SSR)을 지원하지 않으므로 클라이언트에서만 로드
 */
const ModelComposer = dynamic(() => import('../components/ModelComposer'), {
  ssr: false,
});

/**
 * 컴포저 페이지 컴포넌트
 * 
 * 여러 OBJ 파일을 추가하고, 각 오브젝트를 선택하고 이동시킬 수 있는 3D 컴포저 페이지입니다.
 * 
 * 주요 기능:
 * - 여러 OBJ 파일 추가
 * - 각 오브젝트 선택 및 이동
 * - 오브젝트별 툴팁 표시
 * 
 * @component
 * @returns {JSX.Element} 컴포저 페이지 컴포넌트
 */
export default function ComposerPage() {
  const router = useRouter();

  return (
    <div className="w-full h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-50 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          3D 컴포저
        </h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          ← 메인으로
        </button>
      </div>

      {/* 컴포저 영역 */}
      <div className="w-full h-full pt-16">
        <ModelComposer />
      </div>
    </div>
  );
}

