'use client';

import React, { useState } from 'react';

type ScreenshotMode = 'full' | 'current';
type PartMode = 'all' | 'viewed';

interface PdfModalProps {
  /**
   * 출력 중 여부
   * - true: 버튼 비활성화 + "출력 중..." 텍스트
   * - false: 항상 노란색 활성 버튼
   */
  isPrinting?: boolean;
  /**
   * 출력하기 버튼 클릭 시 호출
   * 추후 실제 PDF 출력 로직과 쉽게 연결할 수 있도록
   * 현재 설정 값을 함께 전달합니다.
   */
  onPrintClick?: (config: {
    screenshotMode: ScreenshotMode;
    partMode: PartMode;
    summary: string;
    keywords: string;
  }) => void;
}

export function PdfModal({ isPrinting = false, onPrintClick }: PdfModalProps) {
  const [screenshotMode, setScreenshotMode] = useState<ScreenshotMode>('full');
  const [partMode, setPartMode] = useState<PartMode>('all');
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState('');

  const toggleScreenshot = (mode: ScreenshotMode) => {
    setScreenshotMode(mode);
  };

  const togglePartMode = (mode: PartMode) => {
    setPartMode(mode);
  };

  const baseToggleButton =
    'h-[32px] flex-1 px-4 py-2 text-b-sm font-weight-medium rounded-lg border border-border-default transition-colors duration-150';

  const getToggleClass = (selected: boolean) =>
    selected
      ? 'bg-point-500 text-base-black'
      : 'bg-bg-sub text-sub';

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border 0.8px solid border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-b-md font-weight-semibold text-text-title">PDF 출력</h2>
        <button
          type="button"
          className="w-[22px] h-[22px] flex items-center justify-center border border-border-default rounded-full bg-bg-sub text-text-sub3 text-b-md hover:bg-bg-hovered transition-colors"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      {/* 스크린샷 저장 */}
      <section className="space-y-3">
        <p className="text-b-sm font-weight-regular text-sub2">스크린샷 저장</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${baseToggleButton} ${getToggleClass(screenshotMode === 'full')}`}
            onClick={() => toggleScreenshot('full')}
          >
            전체 화면
          </button>
          <button
            type="button"
            className={`${baseToggleButton} ${getToggleClass(screenshotMode === 'current')}`}
            onClick={() => toggleScreenshot('current')}
          >
            현재 화면
          </button>
        </div>
      </section>

      {/* 부품 설명 */}
      <section className="space-y-3">
        <p className="text-b-sm font-weight-regular text-sub2">부품 설명</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${baseToggleButton} ${getToggleClass(partMode === 'all')}`}
            onClick={() => togglePartMode('all')}
          >
            전체 부품
          </button>
          <button
            type="button"
            className={`${baseToggleButton} ${getToggleClass(partMode === 'viewed')}`}
            onClick={() => togglePartMode('viewed')}
          >
            내가 본 부품만
          </button>
        </div>
      </section>

      {/* 추가(선택) */}
      <section className="space-y-3">
        <p className="text-b-sm font-weight-regular text-sub2">추가(선택)</p>
        <div className="space-y-2">
        {/* AI 대화 요약 */}
        <div className="h-[32px] space-y-1">
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="AI 대화 요약"
            className="w-full rounded-lg bg-bg-sub border border-border-default px-3 py-2 text-b-sm font-weight-regular text-text-title placeholder:text-placeholder outline-none focus:border-border-focus transition-colors"
          />
        </div>

        {/* 핵심 키워드 */}
        <div className="h-[32px] space-y-1">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="핵심 키워드"
            className="w-full rounded-lg bg-bg-sub border border-border-default px-3 py-2 text-b-sm font-weight-regular text-text-title placeholder:text-placeholder outline-none focus:border-border-focus transition-colors"
          />
        </div>
        </div>
      </section>

      {/* 출력 버튼 */}
      <button
        type="button"
        disabled={isPrinting}
        onClick={() =>
          onPrintClick?.({
            screenshotMode,
            partMode,
            summary,
            keywords,
          })
        }
        className={`
          w-full mt-2 py-3 text-b-sm font-semibold rounded-xl
          transition-all active:scale-[0.98]
          bg-point-500 text-base-black hover:bg-selected
          disabled:bg-bg-sub disabled:text-text-sub3 disabled:cursor-not-allowed
        `}
      >
        {isPrinting ? '출력 중...' : '출력하기'}
      </button>
    </div>
  );
}

