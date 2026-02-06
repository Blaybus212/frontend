'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ViewerIcon, HomeIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, FileIcon, AiIcon, Note, AiPanel } from '@/app/_components/viewer';
import Scene3D from '@/app/_components/Scene3D';

/**
 * 3D 객체 뷰어 페이지 컴포넌트
 * 
 * URL 파라미터로 전달된 객체 이름을 기반으로 3D 모델을 로드하고 표시합니다.
 * 
 * **주요 기능:**
 * - 3D 모델 렌더링 및 조작
 * - 객체 정보 표시 (설명, 재질, 활용 분야)
 * - 메모 작성 기능
 * - AI 어시스턴트 패널
 * - 조립/분해 슬라이더
 * - 뷰어 컨트롤 아이콘 (홈, 줌인/아웃, 리프레시, PDF 등)
 * 
 * **레이아웃 구조:**
 * - 좌측: 컨트롤 아이콘 사이드바
 * - 중앙: 3D 뷰어 영역 (전체 너비의 70%)
 * - 우측: 정보 패널 및 메모 영역 (전체 너비의 30%)
 * - 하단: AI 패널 (3D 뷰어 영역의 80% 너비)
 * 
 * @returns {JSX.Element} 뷰어 페이지 컴포넌트
 */
export default function ViewerPage() {
  const params = useParams();
  /** URL에서 추출한 객체 이름 */
  const objectName = params.objectName as string;

  /** 조립/분해 슬라이더 값 (0-100, 기본값: 50) */
  const [assemblyValue, setAssemblyValue] = useState(50);
  /** 메모 입력 필드의 값 */
  const [noteValue, setNoteValue] = useState('');
  /** 현재 선택된 뷰어 아이콘 (홈, 줌인, 줌아웃 등) */
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  /** 3D 씬에서 선택된 모델의 인덱스 배열 */
  const [selectedModelIndices, setSelectedModelIndices] = useState<number[]>([]);
  /** AI 패널 표시 여부 */
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  /**
   * 객체 정보 데이터
   * TODO: 나중에 API로 교체 예정
   */
  const objectData = {
    korean: '로봇팔',
    english: 'Robot arm',
    description: '로봇팔은 산업 자동화에서 핵심적인 역할을 하는 기계 장치입니다. 여러 관절과 링크로 구성되어 있어 3차원 공간에서 자유롭게 움직일 수 있으며, 정밀한 작업부터 무거운 물체 이동까지 다양한 작업을 수행할 수 있습니다.',
    materials: ['알루미늄 합금', '탄소 섬유', '고강도 플라스틱'],
    applications: ['제조', '조립', '용접', '도장', '검사 작업'],
  };

  /**
   * 3D 모델 데이터 배열
   * TODO: 나중에 objectName 기반으로 API에서 로드 예정
   */
  const models = [
    {
      id: 'robot-arm',
      url: '/Assets/Robot Gripper/Robot Gripper.gltf',
      nodeIndex: 0,
    },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden bg-surface">
      {/* 3D 씬 렌더링 영역: 상단 네비게이션 바와 우측 패널을 제외한 전체 영역 (전체 너비의 70%) */}
      <div className="absolute top-[0px] right-[30%] left-0 bottom-0">
        <Scene3D
          models={models}
          selectedModelIndices={selectedModelIndices}
          onModelSelect={setSelectedModelIndices}
        />
      </div>

      {/* AI 어시스턴트 패널: 3D 뷰어 영역 하단에 배치되며, 뷰어 영역의 80% 너비를 차지 */}
      {isAiPanelOpen && (
        <div
          className="absolute z-20"
          style={{
            left: '7%',
            width: '62.5%',
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}
        >
          {/* 3D 뷰어 영역의 전체 높이를 따라가도록 하는 래퍼 */}
          <div className="w-full h-full flex items-end" style={{ pointerEvents: 'auto' }}>
            <AiPanel
              isVisible={isAiPanelOpen}
              onClose={() => setIsAiPanelOpen(false)}
              maxExpandedHeight="100%"
            />
          </div>
        </div>
      )}

      {/* 좌측 컨트롤 사이드바: 뷰어 조작 아이콘들이 세로로 배치된 오버레이 영역 */}
      <aside className="absolute left-12 top-[96px] bottom-4 flex flex-col items-center gap-[22px] py-4 z-10">
        {/* 뷰어 컨트롤 아이콘들 */}
        <ViewerIcon
          icon={<HomeIcon />}
          selected={selectedIcon === 'home'}
          onClick={() => setSelectedIcon('home')}
          aria-label="홈"
        />
        <ViewerIcon
          icon={<ZoomInIcon />}
          selected={selectedIcon === 'zoomin'}
          onClick={() => setSelectedIcon('zoomin')}
          aria-label="줌인"
        />
        <ViewerIcon
          icon={<ZoomOutIcon />}
          selected={selectedIcon === 'zoomout'}
          onClick={() => setSelectedIcon('zoomout')}
          aria-label="줌아웃"
        />
        <ViewerIcon
          icon={<RefreshIcon />}
          selected={selectedIcon === 'refresh'}
          onClick={() => setSelectedIcon('refresh')}
          aria-label="리프레시"
        />
        <ViewerIcon
          icon={<FileIcon />}
          selected={selectedIcon === 'pdf'}
          onClick={() => setSelectedIcon('pdf')}
          aria-label="PDF"
        />
        
        {/* 퀴즈 진행도 표시 버튼: 현재 퀴즈 완료율을 표시 */}
        <button className="w-[54px] h-[54px] rounded-full bg-bg-sub border border-border-default flex flex-col items-center justify-center hover:bg-bg-hovered transition-colors">
          <span className="text-b-sm font-weight-semibold text-text-title">퀴즈</span>
          <span className="text-b-xs text-point-500">50%</span>
        </button>

        {/* AI 패널 열기 버튼: AI 아이콘이 하단에 고정되어 있으며, 클릭 시 AI 패널을 엽니다 */}
        {!isAiPanelOpen && (
          <div className="mt-auto mb-[40px] ai-icon-ripple">
            <ViewerIcon
              icon={<AiIcon />}
              selected={true}
              onClick={() => setIsAiPanelOpen(true)}
              aria-label="AI"
              backgroundColor="var(--color-point-500)"
              iconColor="var(--color-base-black)"
            />
          </div>
        )}
      </aside>

      {/* 조립/분해 슬라이더: 3D 모델의 조립/분해 상태를 조절하는 컨트롤 (3D 뷰어 영역 상단 중앙에 배치) */}
      <div className="absolute flex flex-row items-center gap-4 top-10 left-[35%] transform -translate-x-1/2 w-[550px] h-[54px] px-[37.5px] bg-bg-default rounded-full border border-border-default z-10">
        <span className="text-b-md font-weight-medium text-sub whitespace-nowrap">조립</span>
        <input
          type="range"
          min="0"
          max="100"
          value={assemblyValue}
          onChange={(e) => setAssemblyValue(Number(e.target.value))}
          className="flex-1 h-2 bg-bg-sub rounded-full appearance-none cursor-pointer slider-custom"
          style={{
            background: `linear-gradient(to right, var(--color-point-500) 0%, var(--color-point-500) ${assemblyValue}%, var(--color-bg-sub) ${assemblyValue}%, var(--color-bg-sub) 100%)`,
          }}
        />
        <span className="text-b-md font-weight-medium text-sub whitespace-nowrap">분해</span>
      </div>

      {/* 우측 정보 사이드바: 객체 정보와 메모를 표시하는 오버레이 영역 (전체 너비의 30%) */}
      <aside className="absolute right-0 top-0 bottom-0 w-[30%] flex flex-col gap-4 z-10 border-l border-border-default pt-4 pb-4 pl-4 pr-12 bg-surface">
        {/* 객체 정보 패널: 제목, 설명, 재질, 활용 분야를 표시 (전체 높이의 4/9 비율) */}
        <div className="flex-[4] bg-bg-default rounded-2xl border border-border-default overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
            {/* 객체 제목 영역: 한글명과 영문명 표시 */}
            <div>
              <h1 className="text-h-xl font-weight-semibold text-text-title mb-1">
                {objectData.korean}
              </h1>
              <p className="text-b-md text-sub">
                {objectData.english}
              </p>
            </div>

            {/* 객체 설명 섹션 */}
            <section>
              <h2 className="text-b-md font-weight-semibold text-text-title mb-3">설명</h2>
              <p className="text-b-md text-sub2 leading-relaxed">
                {objectData.description}
              </p>
            </section>

            {/* 재질 정보 섹션: 객체를 구성하는 재질들을 태그 형태로 표시 */}
            <section>
              <h2 className="text-b-md font-weight-semibold text-text-title mb-3">재질</h2>
              <div className="flex flex-wrap gap-2">
                {objectData.materials.map((material, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-bg-sub text-b-sm text-sub2 rounded-lg"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </section>

            {/* 활용 분야 섹션: 객체의 활용 분야를 태그 형태로 표시 */}
            <section>
              <h2 className="text-b-md font-weight-semibold text-text-title mb-3">활용</h2>
              <div className="flex flex-wrap gap-2">
                {objectData.applications.map((app, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-bg-sub text-b-sm text-sub2 rounded-lg"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* 메모 작성 패널: 사용자가 학습 내용을 기록할 수 있는 텍스트 영역 (전체 높이의 5/9 비율) */}
        <div className="flex-[5] bg-bg-default rounded-2xl border border-border-default flex flex-col overflow-hidden">
          <Note
            value={noteValue}
            onChange={setNoteValue}
            placeholder="메모를 입력하세요..."
            className="flex-1 flex flex-col"
          />
        </div>
      </aside>

    </div>
  );
}
