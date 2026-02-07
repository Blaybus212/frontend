/**
 * 뷰어 우측 패널 컴포넌트
 * 
 * 객체 정보와 메모를 표시하는 우측 사이드바입니다.
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Note } from './Note';
import { ObjectInfoPanel } from './ObjectInfoPanel';
import type { SelectablePart } from '@/app/_components/3d/types';

/**
 * 객체 정보 데이터 타입
 */
interface ObjectData {
  /** 한글명 */
  korean: string;
  /** 영문명 */
  english: string;
  /** 설명 */
  description: string;
  /** 재질 배열 */
  materials: string[];
  /** 활용 분야 배열 */
  applications: string[];
}

/**
 * ViewerRightPanel 컴포넌트의 Props 인터페이스
 */
interface ViewerRightPanelProps {
  /** 표시할 객체 정보 데이터 */
  objectData: ObjectData;
  /** 메모 입력 필드의 값 */
  noteValue: string;
  /** 메모 값 변경 핸들러 */
  onNoteChange: (value: string) => void;
  /** 우측 패널 너비(%) */
  widthPercent: number;
  /** 우측 패널 너비 변경 핸들러 */
  onResizeWidth: (nextWidthPercent: number) => void;
  /** 노트에서 사용할 부품 목록 */
  parts: SelectablePart[];
  /** 부품 스냅샷을 생성하는 함수 */
  onInsertPartSnapshot: (nodeId: string) => Promise<string | null>;
  /** 모델 스냅샷을 생성하는 함수 */
  onInsertModelSnapshot: (modelId: string) => Promise<string | null>;
  /** 모델 이름(전체 선택용) */
  modelName: string;
  /** 모델 id(전체 선택용) */
  modelId: string;
}

/**
 * 뷰어 우측 패널 컴포넌트
 * 
 * 객체 정보와 메모를 표시하는 우측 사이드바입니다.
 * 
 * **구성 요소:**
 * - 객체 정보 패널 (상단, 전체 높이의 4/9)
 * - 메모 작성 패널 (하단, 전체 높이의 5/9)
 * 
 * @param props - 컴포넌트 props
 * @returns 뷰어 우측 패널 JSX
 * 
 * @example
 * ```tsx
 * <ViewerRightPanel
 *   objectData={objectData}
 *   noteValue={noteValue}
 *   onNoteChange={setNoteValue}
 * />
 * ```
 */
export function ViewerRightPanel({
  objectData,
  noteValue,
  onNoteChange,
  widthPercent,
  onResizeWidth,
  parts,
  onInsertPartSnapshot,
  onInsertModelSnapshot,
  modelName,
  modelId,
}: ViewerRightPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const splitHandleRef = useRef<HTMLDivElement | null>(null);
  const [infoHeight, setInfoHeight] = useState<number | null>(null);
  const [availableHeight, setAvailableHeight] = useState(0);
  const resizingWidthRef = useRef(false);
  const resizingSplitRef = useRef(false);
  const splitDragStateRef = useRef<{
    startY: number;
    startHeight: number;
    availableHeight: number;
    minHeight: number;
    maxHeight: number;
  } | null>(null);
  const minSectionHeight = 180;

  const updateCursor = (cursor: string | null) => {
    document.body.style.cursor = cursor ?? '';
    document.body.style.userSelect = cursor ? 'none' : '';
  };

  const handleWidthResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingWidthRef.current = true;
    updateCursor('col-resize');

    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizingWidthRef.current) return;
      const nextPercent = ((window.innerWidth - moveEvent.clientX) / window.innerWidth) * 100;
      const clamped = Math.min(45, Math.max(22, nextPercent));
      onResizeWidth(clamped);
    };

    const handleUp = () => {
      resizingWidthRef.current = false;
      updateCursor(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [onResizeWidth]);

  const handleSplitResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingSplitRef.current = true;
    updateCursor('row-resize');

    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const handleHeight = splitHandleRef.current?.getBoundingClientRect().height ?? 0;
    const styles = window.getComputedStyle(contentRef.current);
    const rowGap = parseFloat(styles.rowGap || '0') || 0;
    const paddingTop = parseFloat(styles.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(styles.paddingBottom || '0') || 0;
    const totalGap = rowGap * 2;
    const nextAvailableHeight = rect.height - handleHeight - totalGap - paddingTop - paddingBottom;
    if (nextAvailableHeight <= 0) return;

    const minHeight = Math.min(minSectionHeight, nextAvailableHeight / 2);
    const maxHeight = Math.max(minHeight, nextAvailableHeight - minHeight);
    const startHeight = infoHeight ?? nextAvailableHeight / 2;

    splitDragStateRef.current = {
      startY: event.clientY,
      startHeight,
      availableHeight: nextAvailableHeight,
      minHeight,
      maxHeight,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizingSplitRef.current) return;
      const dragState = splitDragStateRef.current;
      if (!dragState) return;

      const delta = moveEvent.clientY - dragState.startY;
      const nextHeight = Math.min(
        dragState.maxHeight,
        Math.max(dragState.minHeight, dragState.startHeight + delta)
      );
      setInfoHeight(nextHeight);
    };

    const handleUp = () => {
      resizingSplitRef.current = false;
      updateCursor(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [infoHeight, minSectionHeight]);

  const updateContentMetrics = useCallback(() => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const handleHeight = splitHandleRef.current?.getBoundingClientRect().height ?? 0;
    const styles = window.getComputedStyle(contentRef.current);
    const rowGap = parseFloat(styles.rowGap || '0') || 0;
    const paddingTop = parseFloat(styles.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(styles.paddingBottom || '0') || 0;
    const totalGap = rowGap * 2;
    const nextAvailableHeight = rect.height - handleHeight - totalGap - paddingTop - paddingBottom;
    if (nextAvailableHeight <= 0) return;

    const minHeight = Math.min(minSectionHeight, nextAvailableHeight / 2);
    const maxHeight = Math.max(minHeight, nextAvailableHeight - minHeight);
    setAvailableHeight(nextAvailableHeight);
    setInfoHeight((prev) => {
      const base = prev ?? nextAvailableHeight / 2;
      return Math.min(maxHeight, Math.max(minHeight, base));
    });
  }, [minSectionHeight]);

  useLayoutEffect(() => {
    updateContentMetrics();
    window.addEventListener('resize', updateContentMetrics);
    return () => {
      window.removeEventListener('resize', updateContentMetrics);
    };
  }, [updateContentMetrics]);

  return (
    <aside
      ref={panelRef}
      className="absolute right-0 top-0 bottom-0 z-10 border-l border-border-default bg-surface"
      style={{ width: `${widthPercent}%` }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize"
        onPointerDown={handleWidthResizeStart}
        aria-label="우측 패널 너비 조절"
      >
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-[4px] h-16 bg-border-default opacity-80 rounded-full" />
      </div>

      <div
        ref={contentRef}
        className="h-full grid gap-4 pt-4 pb-4 pl-4 pr-12"
        style={{
          gridTemplateRows:
            availableHeight > 0 && infoHeight !== null
              ? `${infoHeight}px auto ${Math.max(minSectionHeight, availableHeight - infoHeight)}px`
              : `minmax(${minSectionHeight}px, 1fr) auto minmax(${minSectionHeight}px, 1fr)`,
        }}
      >
        <ObjectInfoPanel objectData={objectData} />

        <div
          ref={splitHandleRef}
          className="h-2 -my-1 cursor-row-resize flex items-center justify-center"
          onPointerDown={handleSplitResizeStart}
          aria-label="설명/노트 높이 조절"
        >
          <div className="h-1 w-12 rounded-full bg-border-default" />
        </div>

        <div className="bg-bg-default rounded-2xl border border-border-default flex flex-col overflow-hidden">
          <Note
            value={noteValue}
            onChange={onNoteChange}
            placeholder="메모를 입력하세요..."
            className="flex-1 flex flex-col"
            parts={parts}
            onInsertPartSnapshot={onInsertPartSnapshot}
            onInsertModelSnapshot={onInsertModelSnapshot}
            modelName={modelName}
            modelId={modelId}
          />
        </div>
      </div>
    </aside>
  );
}
