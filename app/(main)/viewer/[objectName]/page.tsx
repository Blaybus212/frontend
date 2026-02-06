'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ViewerIcon, HomeIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, FileIcon, AiIcon, Note, AiPanel } from '@/app/_components/viewer';
import Scene3D from '@/app/_components/Scene3D';

export default function ViewerPage() {
  const params = useParams();
  const objectName = params.objectName as string;

  // 상태 관리
  const [assemblyValue, setAssemblyValue] = useState(50); // 조립/분해 슬라이더 값 (0-100)
  const [noteValue, setNoteValue] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedModelIndices, setSelectedModelIndices] = useState<number[]>([]);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false); // AI 패널 표시 여부

  // 임시 데이터 (나중에 API로 교체)
  const objectData = {
    korean: '로봇팔',
    english: 'Robot arm',
    description: '로봇팔은 산업 자동화에서 핵심적인 역할을 하는 기계 장치입니다. 여러 관절과 링크로 구성되어 있어 3차원 공간에서 자유롭게 움직일 수 있으며, 정밀한 작업부터 무거운 물체 이동까지 다양한 작업을 수행할 수 있습니다.',
    materials: ['알루미늄 합금', '탄소 섬유', '고강도 플라스틱'],
    applications: ['제조', '조립', '용접', '도장', '검사 작업'],
  };

  // 임시 모델 데이터 (나중에 objectName 기반으로 로드)
  const models = [
    {
      id: 'robot-arm',
      url: '/Assets/Robot Gripper/Robot Gripper.gltf',
      nodeIndex: 0,
    },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden bg-surface">
      {/* 3D 씬 - 상단 내브바와 우측 패널을 제외한 영역 */}
      <div className="absolute top-[0px] right-[30%] left-0 bottom-0">
        <Scene3D
          models={models}
          selectedModelIndices={selectedModelIndices}
          onModelSelect={setSelectedModelIndices}
        />
      </div>

      {/* AI 패널 - 하단에 배치 (3D 뷰어 영역의 80% 너비) */}
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
          {/* 3D 뷰어 영역 높이를 그대로 따라가기 위한 래퍼 */}
          <div className="w-full h-full flex items-end" style={{ pointerEvents: 'auto' }}>
            <AiPanel
              isVisible={isAiPanelOpen}
              onClose={() => setIsAiPanelOpen(false)}
              maxExpandedHeight="100%"
            />
          </div>
        </div>
      )}

      {/* 좌측 사이드바 - 오버레이 */}
      <aside className="absolute left-12 top-[96px] bottom-4 flex flex-col items-center gap-[22px] py-4 z-10">
        {/* 각 아이콘 */}
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
        
        {/* 퀴즈 진행도 버튼 */}
        <button className="w-[54px] h-[54px] rounded-full bg-bg-sub border border-border-default flex flex-col items-center justify-center hover:bg-bg-hovered transition-colors">
          <span className="text-b-sm font-weight-semibold text-text-title">퀴즈</span>
          <span className="text-b-xs text-point-500">50%</span>
        </button>

        {/* 하단 AI 아이콘 버튼 */}
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

      {/* 조립/분해 슬라이더 - 오버레이 (3D 뷰어 영역 기준 가운데) */}
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

      {/* 우측 사이드바: 정보 패널 - 오버레이 */}
      {/* 전체 너비의 30% (1440px 기준 432px) */}
      <aside className="absolute right-0 top-0 bottom-0 w-[30%] flex flex-col gap-4 z-10 border-l border-border-default pt-4 pb-4 pl-4 pr-12 bg-surface">
        {/* 정보 패널 - 4:5 비율 중 4 */}
        <div className="flex-[4] bg-bg-default rounded-2xl border border-border-default overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
            {/* 제목 */}
            <div>
              <h1 className="text-h-xl font-weight-semibold text-text-title mb-1">
                {objectData.korean}
              </h1>
              <p className="text-b-md text-sub">
                {objectData.english}
              </p>
            </div>

            {/* 설명 */}
            <section>
              <h2 className="text-b-md font-weight-semibold text-text-title mb-3">설명</h2>
              <p className="text-b-md text-sub2 leading-relaxed">
                {objectData.description}
              </p>
            </section>

            {/* 재질 */}
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

            {/* 활용 */}
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

        {/* Note 패널 - 4:5 비율 중 5 */}
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
