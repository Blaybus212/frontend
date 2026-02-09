'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AiPanel, ViewerSidebar, AssemblySlider, ViewerRightPanel, PartsListPanel, PdfModal } from '@/app/_components/viewer';
import Scene3D from '@/app/_components/Scene3D';
import type { Scene3DRef, SelectablePart } from '@/app/_components/3d/types';
import { exportNotePdf, exportSummaryPdf } from '@/app/_components/viewer/utils/pdfExport';
import { downloadAndExtractModelZip } from '@/app/_components/3d/utils/modelZip';
import { syncSceneState, fetchSceneInfo, type SceneInfo, fetchConversation, sendMessage, type ConversationMessage } from './actions';
import { useSaveStatus } from '@/app/_contexts/SaveStatusContext';
import {
  ASSEMBLY_VALUE_ASSEMBLED,
  ICON_FLASH_DELAY_MS,
  PDF_EMPTY_SUMMARY_TEXT,
} from '@/app/_components/viewer/constants';

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
  const sceneIdParam = Number.isFinite(Number(objectName))
    ? String(Number(objectName))
    : objectName;

  // SaveStatus Context
  const { setStatus, setElapsedSeconds, setTriggerSave } = useSaveStatus();

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
  const [aiMessages, setAiMessages] = useState<ConversationMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiLoadingMore, setIsAiLoadingMore] = useState(false);
  const [aiNextCursor, setAiNextCursor] = useState<string | null>(null);
  const [aiHasNext, setAiHasNext] = useState(false);
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [parts, setParts] = useState<SelectablePart[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [rightPanelWidthPercent, setRightPanelWidthPercent] = useState(30);
  const [modelRootName, setModelRootName] = useState<string>('모델');
  const [isPrinting, setIsPrinting] = useState(false);
  const [sceneInfo, setSceneInfo] = useState<SceneInfo | null>(null);
  const [modelUrls, setModelUrls] = useState<{
    defaultUrl: string | null;
    customUrl: string | null;
    parts: Array<{ nodeId: string; nodeName: string }>;
    revoke: () => void;
  } | null>(null);
  const [activeModelUrl, setActiveModelUrl] = useState<string | null>(null);
  /** 3D 씬 ref */
  const scene3DRef = useRef<Scene3DRef>(null);
  const noteExportRef = useRef<HTMLDivElement | null>(null);

  /**
   * 씬 정보 가져오기
   */
  useEffect(() => {
    if (!sceneIdParam) return;

    const loadSceneInfo = async () => {
      try {
        const info = await fetchSceneInfo(sceneIdParam);
        setSceneInfo(info);
      } catch (error) {
        console.error('[viewer] 씬 정보 로드 실패', error);
      }
    };

    loadSceneInfo();
  }, [sceneIdParam]);

  /**
   * AI 패널 열릴 때 대화 이력 로드
   */
  useEffect(() => {
    if (!isAiPanelOpen || !sceneIdParam) return;
    
    // 이미 메시지가 있으면 로드하지 않음
    if (aiMessages.length > 0) return;

    const loadConversation = async () => {
      try {
        const response = await fetchConversation(sceneIdParam, 5);
        setAiMessages(response.messages.reverse()); // 오래된 순서로 정렬
        setAiNextCursor(response.pages.nextCursor);
        setAiHasNext(response.pages.hasNext);
      } catch (error) {
        console.error('[AI] 대화 이력 로드 실패', error);
      }
    };

    loadConversation();
  }, [isAiPanelOpen, sceneIdParam, aiMessages.length]);

  /**
   * AI 메시지 전송 핸들러
   */
  const handleSendAiMessage = async (content: string, references?: Array<{ componentId: number }>) => {
    if (!sceneIdParam) return;

    // 사용자 메시지 즉시 표시
    const userMessage: ConversationMessage = {
      sender: 'USER',
      content,
      postedAt: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(/\. /g, '-').replace('.', ''),
      references: {},
    };
    setAiMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);

    try {
      // references가 있을 때만 포함
      const requestPayload: any = { content };
      if (references && references.length > 0) {
        requestPayload.references = references;
      }
      console.log('📤 AI 메시지 전송:', requestPayload);
      const response = await sendMessage(sceneIdParam, requestPayload);
      console.log('📥 AI 응답 수신:', response);
      
      // 응답이 null이거나 sender가 없는 경우 처리
      if (!response || !response.sender) {
        throw new Error('Invalid response from server');
      }
      
      // AI 응답 추가
      const aiMessage: ConversationMessage = {
        sender: response.sender,
        content: response.content,
        postedAt: response.postedAt,
        references: response.references || {},
      };
      setAiMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('[AI] 메시지 전송 실패', error);
      // 에러 메시지 표시
      const errorMessage: ConversationMessage = {
        sender: 'ASSISTANT',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.',
        postedAt: new Date().toLocaleString('ko-KR'),
        references: {},
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * 이전 대화 로드 (무한 스크롤)
   */
  const handleLoadMoreAi = async () => {
    if (!sceneIdParam || !aiNextCursor || isAiLoadingMore) return;

    setIsAiLoadingMore(true);
    try {
      const response = await fetchConversation(sceneIdParam, 5, aiNextCursor);
      setAiMessages(prev => [...response.messages.reverse(), ...prev]);
      setAiNextCursor(response.pages.nextCursor);
      setAiHasNext(response.pages.hasNext);
    } catch (error) {
      console.error('[AI] 이전 대화 로드 실패', error);
    } finally {
      setIsAiLoadingMore(false);
    }
  };

  /**
   * 선택 상태에 따라 표시할 객체 정보 계산
   * - 선택 없음 or 전체 선택 → 씬 정보
   * - 부품 선택 (단일/다중) → 마지막으로 선택한 부품 정보
   */
  const objectData = useMemo(() => {
    // 기본값: 씬 정보
    if (!sceneInfo) {
      return {
        korean: '로딩 중...',
        english: 'Loading...',
        description: '씬 정보를 불러오는 중입니다.',
      };
    }

    // 선택 없음 or 전체 선택 → 씬 정보
    if (selectedPartIds.length === 0 || selectedPartIds.length === parts.length) {
      return {
        korean: sceneInfo.title,
        english: sceneInfo.engTitle,
        description: sceneInfo.description,
        isSceneInformation: sceneInfo.isSceneInformation,
      };
    }

    // 부품 선택 (단일/다중) → 마지막으로 선택한 부품 정보
    if (selectedPartIds.length > 0) {
      // 배열의 마지막 요소가 가장 최근에 선택한 부품
      const lastSelectedId = selectedPartIds[selectedPartIds.length - 1];
      const selectedPart = parts.find((part) => part.nodeId === lastSelectedId);
      
      if (selectedPart) {
        // 한글 이름에서 끝 숫자 제거
        const removeTrailingNumbers = (text: string) => text.replace(/\d+$/, '');

        return {
          korean: selectedPart.originalName || selectedPart.nodeId,
          english: removeTrailingNumbers(selectedPart.nodeName),
          description: selectedPart.partDescription || '부품 설명이 없습니다.',
          materials: selectedPart.texture ? selectedPart.texture.split(',').map((m) => m.trim()) : [],
          applications: [],
        };
      }
    }

    // 폴백: 씬 정보
    return {
      korean: sceneInfo.title,
      english: sceneInfo.engTitle,
      description: sceneInfo.description,
      isSceneInformation: sceneInfo.isSceneInformation,
    };
  }, [sceneInfo, selectedPartIds, parts]);

  /**
   * 3D 모델 데이터 배열
   * ZIP 파일에서 로드한 모델만 표시 (기본 모델 제거)
   */
  const models = useMemo(
    () => {
      // activeModelUrl이 없으면 빈 배열 (로딩 중)
      if (!activeModelUrl) {
        return [];
      }
      
      return [
        {
          id: 'scene-model',
          url: activeModelUrl,
          nodeIndex: 0,
        },
      ];
    },
    [activeModelUrl]
  );

  const handleIconSelect = (iconId: string) => {
    const flashIcon = () => {
      setSelectedIcon(iconId);
      window.setTimeout(() => {
        setSelectedIcon((prev) => (prev === iconId ? null : prev));
      }, ICON_FLASH_DELAY_MS);
    };

    switch (iconId) {
      case 'zoomin':
        scene3DRef.current?.zoomIn();
        flashIcon();
        return;
      case 'zoomout':
        scene3DRef.current?.zoomOut();
        flashIcon();
        return;
      case 'refresh':
        scene3DRef.current?.resetToAssembly();
        if (modelUrls?.defaultUrl) {
          setActiveModelUrl(modelUrls.defaultUrl);
        }
        flashIcon();
        return;
      case 'pdf':
        setIsPdfOpen((prev) => !prev);
        setSelectedIcon((prev) => (prev === 'pdf' ? null : 'pdf'));
        return;
      case 'download':
        scene3DRef.current?.exportScene();
        flashIcon();
        return;
      case 'parts':
        setIsPartsOpen((prev) => !prev);
        return;
      default:
        setSelectedIcon(iconId);
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
    if (!sceneIdParam) return;
    const controller = new AbortController();
    let disposed = false;

    const loadModels = async () => {
      try {
        const result = await downloadAndExtractModelZip({
          sceneId: sceneIdParam,
          target: 'both',
          signal: controller.signal,
        });
        if (disposed) {
          result.revoke();
          return;
        }
        setModelUrls(result);
        const selectedUrl = result.customUrl ?? result.defaultUrl;
        
        // 부품 정보를 SelectablePart 형식으로 변환
        const selectableParts: SelectablePart[] = result.parts.map((part) => ({
          nodeId: part.nodeId,
          nodeName: part.nodeName,
          originalName: part.originalName,
          modelIndex: 0,
        }));
        
        setParts(selectableParts);
        setActiveModelUrl(selectedUrl);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('[viewer] 모델 다운로드 실패', error);
      }
    };

    loadModels();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [sceneIdParam]);

  /**
   * 씬 상태 저장 함수
   */
  const handleSaveSceneState = useCallback(async () => {
    const sceneState = scene3DRef.current?.getSceneState();
    if (!sceneState) return;
    
    // nodeId로 originalName을 찾기 위한 맵 생성
    const nodeIdToOriginalName = new Map(
      parts.map(part => [part.nodeId, part.originalName || part.nodeName])
    );
    
    console.log('🔍 Parts 배열 확인:', {
      partsCount: parts.length,
      sampleParts: parts.slice(0, 3).map(p => ({
        nodeId: p.nodeId,
        nodeName: p.nodeName,
        originalName: p.originalName,
      })),
      nodeIdToOriginalName: Array.from(nodeIdToOriginalName.entries()).slice(0, 3),
    });
    
    const payload = {
      components: sceneState.nodeTransforms.map(({ nodeId, matrix }) => {
        const name = nodeIdToOriginalName.get(nodeId) || nodeId;
        console.log(`매핑: ${nodeId} → ${name}`);
        return {
          nodeName: name, // 영어 이름 (originalName) 사용
          matrix,
        };
      }),
      assemblyValue: sceneState.assemblyValue,
    };

    console.log('📤 백엔드로 전송하는 데이터:');
    console.log('URL:', `/scenes/${sceneIdParam}/sync`);
    console.log('Body:', JSON.stringify(payload, null, 2));

    setStatus('saving');
    
    try {
      await syncSceneState(sceneIdParam, payload);
      console.log('✅ 저장 완료');
      setStatus('saved');
      
      // 1초 후 saved 상태를 idle로 전환
      setTimeout(() => {
        setStatus('idle');
      }, 1000);
    } catch (error) {
      console.error('❌ 씬 동기화 실패:', error);
      setStatus('error');
      
      // 2초 후 error 상태를 idle로 전환
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  }, [sceneIdParam, setStatus, parts]);

  /**
   * 수동 저장 함수 등록
   */
  useEffect(() => {
    setTriggerSave(handleSaveSceneState);
  }, [handleSaveSceneState, setTriggerSave]);

  /**
   * 30초마다 자동 저장 및 타이머 업데이트
   */
  useEffect(() => {
    if (!sceneIdParam) return;

    let elapsedSeconds = 0;
    
    // 초기 저장
    handleSaveSceneState();
    
    // 1초마다 경과 시간 업데이트
    const timerInterval = window.setInterval(() => {
      elapsedSeconds = (elapsedSeconds + 1) % 30; // 30초마다 0으로 초기화
      setElapsedSeconds(elapsedSeconds);
    }, 1000);
    
    // 30초마다 자동 저장
    const saveInterval = window.setInterval(() => {
      handleSaveSceneState();
      elapsedSeconds = 0; // 저장 후 타이머 초기화
      setElapsedSeconds(0);
    }, 30000);
    
    return () => {
      window.clearInterval(timerInterval);
      window.clearInterval(saveInterval);
    };
  }, [sceneIdParam, setStatus, setElapsedSeconds]);

  useEffect(() => {
    return () => {
      if (modelUrls) {
        modelUrls.revoke();
      }
    };
  }, [modelUrls]);


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

  const waitForNextPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  const captureAssembledModelSnapshots = async (modelId: string) => {
    if (!scene3DRef.current) return [null, null, null] as [null, null, null];
    const prevAssemblyValue = assemblyValue;
    if (prevAssemblyValue !== ASSEMBLY_VALUE_ASSEMBLED) {
      setAssemblyValue(ASSEMBLY_VALUE_ASSEMBLED);
      await waitForNextPaint();
    }
    const snapshots = await scene3DRef.current.captureModelSnapshots(modelId);
    if (prevAssemblyValue !== ASSEMBLY_VALUE_ASSEMBLED) {
      setAssemblyValue(prevAssemblyValue);
      await waitForNextPaint();
    }
    return snapshots;
  };

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
    const modelSnapshots = await captureAssembledModelSnapshots(models[0]?.id ?? 'model');

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
      summaryText: includeSummary ? PDF_EMPTY_SUMMARY_TEXT : '',
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
      summaryText: includeSummary ? PDF_EMPTY_SUMMARY_TEXT : '',
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
            <div className="w-full h-full flex flex-col justify-end" style={{ pointerEvents: 'auto' }}>
              <AiPanel
                sceneId={sceneIdParam}
                messages={aiMessages}
                onSendMessage={handleSendAiMessage}
                isLoading={isAiLoading}
                isVisible={isAiPanelOpen}
                onClose={() => setIsAiPanelOpen(false)}
                maxExpandedHeight="100%"
                hasNext={aiHasNext}
                onLoadMore={handleLoadMoreAi}
                isLoadingMore={isAiLoadingMore}
                parts={parts}
                modelName={modelRootName}
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
        modelName={modelRootName}
      />

    </div>
  );
}
