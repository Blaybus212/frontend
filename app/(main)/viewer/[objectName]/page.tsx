'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AiPanel, ViewerSidebar, AssemblySlider, ViewerRightPanel, PartsListPanel, PdfModal } from '@/app/_components/viewer';
import Scene3D from '@/app/_components/Scene3D';
import type { Scene3DRef, SelectablePart } from '@/app/_components/3d/types';
import { exportNotePdf, exportSummaryPdf } from '@/app/_components/viewer/utils/pdfExport';

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

  /** 조립/분해 슬라이더 값 (0-100, 기본값: 0=조립 상태) */
  const [assemblyValue, setAssemblyValue] = useState(0);
  /** 메모 입력 필드의 값 */
  const [noteValue, setNoteValue] = useState('');
  /** 현재 선택된 뷰어 아이콘 (홈, 줌인, 줌아웃 등) */
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  /** 3D 씬에서 선택된 모델의 인덱스 배열 */
  const [selectedModelIndices, setSelectedModelIndices] = useState<number[]>([]);
  /** AI 패널 표시 여부 */
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [parts, setParts] = useState<SelectablePart[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [rightPanelWidthPercent, setRightPanelWidthPercent] = useState(30);
  const [modelRootName, setModelRootName] = useState<string>('모델');
  const [isPrinting, setIsPrinting] = useState(false);
  /** 3D 씬 ref */
  const scene3DRef = useRef<Scene3DRef>(null);
  const noteExportRef = useRef<HTMLDivElement | null>(null);

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

  const handleIconSelect = (iconId: string) => {
    if (iconId !== 'parts') {
      setSelectedIcon(iconId);
    }
    if (iconId === 'zoomin') {
      scene3DRef.current?.zoomIn();
      window.setTimeout(() => {
        setSelectedIcon((prev) => (prev === 'zoomin' ? null : prev));
      }, 150);
      return;
    }
    if (iconId === 'zoomout') {
      scene3DRef.current?.zoomOut();
      window.setTimeout(() => {
        setSelectedIcon((prev) => (prev === 'zoomout' ? null : prev));
      }, 150);
      return;
    }
    if (iconId === 'refresh') {
      scene3DRef.current?.resetToAssembly();
      window.setTimeout(() => {
        setSelectedIcon((prev) => (prev === 'refresh' ? null : prev));
      }, 150);
    }
    if (iconId === 'pdf') {
      setIsPdfOpen((prev) => !prev);
      setSelectedIcon((prev) => (prev === 'pdf' ? null : 'pdf'));
      return;
    }
    if (iconId === 'parts') {
      setIsPartsOpen((prev) => !prev);
      return;
    }
  };

  useEffect(() => {
    if (!isPartsOpen) return;
    const list = scene3DRef.current?.getSelectableParts() || [];
    setParts(list);
  }, [isPartsOpen]);

  useEffect(() => {
    const name = scene3DRef.current?.getModelRootName();
    if (name) {
      setModelRootName(name);
    }
  }, [models]);


  useEffect(() => {
    if (!scene3DRef.current) return;
    scene3DRef.current.setSelectedNodeIds(selectedPartIds);
  }, [selectedPartIds]);

  const updateSelectedPartIds = (nextIds: string[]) => {
    setSelectedPartIds((prev) => {
      if (prev.length === nextIds.length && nextIds.every((id) => prev.includes(id))) {
        return prev;
      }
      return nextIds;
    });
  };

  const allPartIds = useMemo(() => parts.map((part) => part.nodeId), [parts]);

  const handlePdfPrint = async (config: {
    screenshotMode: 'full' | 'current';
    partMode: 'all' | 'viewed';
    summary: string;
    keywords: string;
  }) => {
    if (!scene3DRef.current || isPrinting) return;
    setIsPrinting(true);

    const includeSummary = Boolean(config.summary);
    const includeKeywords = Boolean(config.keywords);
    const dateLabel = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });

    const modelName = modelRootName;
    const modelEnglish = objectData.english;
    const modelSnapshots = await scene3DRef.current.captureModelSnapshots(models[0]?.id ?? 'model');

    const availableParts = scene3DRef.current?.getSelectableParts() || parts;
    const targetParts =
      config.partMode === 'viewed' && selectedPartIds.length > 0
        ? availableParts.filter((part) => selectedPartIds.includes(part.nodeId))
        : availableParts;

    const partSnapshots: { title: string; images: [string | null, string | null, string | null] }[] = [];
    for (const part of targetParts) {
      const images = await scene3DRef.current.capturePartSnapshots(part.nodeId);
      partSnapshots.push({ title: part.nodeName, images });
    }

    await exportSummaryPdf({
      documentTitle: `${modelName} 총정리`,
      modelName,
      modelEnglish,
      dateLabel,
      includeSummary,
      summaryText: includeSummary ? 'AI와 대화를 나눈 기록이 없어요' : '',
      includeKeywords,
      keywords: [],
      modelSnapshots,
      parts: partSnapshots,
    });

    await exportNotePdf({
      documentTitle: `${modelName} 노트 기록`,
      modelName,
      dateLabel,
      includeSummary,
      summaryText: includeSummary ? 'AI와 대화를 나눈 기록이 없어요' : '',
      noteHtml: noteValue,
      noteElement: noteExportRef.current,
    });

    setIsPrinting(false);
    setIsPdfOpen(false);
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-surface">
      {/* 3D 씬 렌더링 영역: 상단 네비게이션 바와 우측 패널을 제외한 전체 영역 (전체 너비의 70%) */}
      <div
        className="absolute top-[0px] left-0 bottom-0"
        style={{ right: `${rightPanelWidthPercent}%` }}
      >
        <Scene3D
          ref={scene3DRef}
          models={models}
          selectedModelIndices={selectedModelIndices}
          onModelSelect={setSelectedModelIndices}
          onSelectedNodeIdsChange={updateSelectedPartIds}
        onSelectablePartsChange={setParts}
          assemblyValue={assemblyValue}
        />
      </div>

      {/* AI 어시스턴트 패널: 3D 뷰어 영역 하단에 배치되며, 뷰어 영역의 80% 너비를 차지 */}
      {isAiPanelOpen && (
        <div
          className="absolute z-20"
          style={{
            left: '7%',
            right: `calc(${rightPanelWidthPercent}% + 12px)`,
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}
        >
          {/* 3D 뷰어 영역의 전체 높이를 따라가도록 하는 래퍼 */}
          <div className="w-full h-full flex items-end" style={{ pointerEvents: 'none' }}>
            <div className="w-full" style={{ pointerEvents: 'auto' }}>
              <AiPanel
                isVisible={isAiPanelOpen}
                onClose={() => setIsAiPanelOpen(false)}
                maxExpandedHeight="100%"
              />
            </div>
          </div>
        </div>
      )}

      {/* 좌측 컨트롤 사이드바 */}
      <ViewerSidebar
        selectedIcon={selectedIcon}
        isPartsOpen={isPartsOpen}
        onIconSelect={handleIconSelect}
        isAiPanelOpen={isAiPanelOpen}
        onOpenAiPanel={() => setIsAiPanelOpen(true)}
      />

      {isPartsOpen && (
        <div className="absolute left-[112px] top-[210px] z-20">
          <PartsListPanel
            parts={parts}
            selectedIds={selectedPartIds}
            onTogglePart={(nodeId) => {
              setSelectedPartIds((prev) =>
                prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
              );
            }}
            onToggleAll={() => {
              setSelectedPartIds((prev) => (prev.length === allPartIds.length ? [] : allPartIds));
            }}
            onClose={() => setIsPartsOpen(false)}
          />
        </div>
      )}

      {isPdfOpen && (
        <div className="absolute left-[112px] top-[420px] z-20">
          <PdfModal
            onClose={() => setIsPdfOpen(false)}
            onPrintClick={handlePdfPrint}
            isPrinting={isPrinting}
          />
        </div>
      )}

      {/* 조립/분해 슬라이더 */}
      <AssemblySlider
        value={assemblyValue}
        onChange={setAssemblyValue}
      />

      {/* 우측 정보 사이드바 */}
      <ViewerRightPanel
        objectData={objectData}
        noteValue={noteValue}
        onNoteChange={setNoteValue}
        noteExportRef={noteExportRef}
        widthPercent={rightPanelWidthPercent}
        onResizeWidth={setRightPanelWidthPercent}
        parts={parts}
        onInsertPartSnapshot={async (nodeId) => {
          return scene3DRef.current?.capturePartSnapshot(nodeId) ?? null;
        }}
        onInsertModelSnapshot={async (modelId) => {
          return scene3DRef.current?.captureModelSnapshot(modelId) ?? null;
        }}
        modelName={modelRootName}
        modelId={models[0]?.id ?? 'model'}
      />

    </div>
  );
}
