'use client';

import { useState } from 'react';

/**
 * 스크린샷 저장 모드 타입
 * @typedef {'full' | 'current'} ScreenshotMode
 * - 'full': 전체 화면 스크린샷
 * - 'current': 현재 화면 스크린샷
 */
type ScreenshotMode = 'full' | 'current';

/**
 * PDF 출력 설정 정보
 * @typedef {Object} PdfPrintConfig
 * @property {ScreenshotMode} screenshotMode - 스크린샷 저장 모드
 * @property {string} summary - AI 대화 요약 내용
 */
type PdfPrintConfig = {
  screenshotMode: ScreenshotMode;
  summary: string;
};

/**
 * PdfModal 컴포넌트의 Props 인터페이스
 * @interface PdfModalProps
 * @property {boolean} [isPrinting=false] - PDF 출력 진행 중 여부 (true일 경우 버튼 비활성화 및 "출력 중..." 텍스트 표시)
 * @property {(config: PdfPrintConfig) => void} [onPrintClick] - 출력하기 버튼 클릭 시 호출되는 콜백 함수 (현재 설정값을 함께 전달)
 */
interface PdfModalProps {
  isPrinting?: boolean;
  onPrintClick?: (config: PdfPrintConfig) => void;
  onClose?: () => void;
}

/**
 * PDF 출력 모달 컴포넌트
 * 
 * 3D 뷰어의 내용을 PDF로 출력하기 위한 설정을 할 수 있는 모달입니다.
 * 
 * **주요 기능:**
 * - 스크린샷 저장 모드 선택 (전체 화면 / 현재 화면)
 * - 부품 설명 모드 선택 (전체 부품 / 본 부품만)
 * - AI 대화 요약 입력
 * - 핵심 키워드 입력
 * - PDF 출력 실행
 * 
 * **사용 예시:**
 * ```tsx
 * <PdfModal
 *   isPrinting={isPrinting}
 *   onPrintClick={(config) => {
 *     // PDF 출력 로직 실행
 *   }}
 * />
 * ```
 * 
 * @param {PdfModalProps} props - 컴포넌트 props
 * @returns {JSX.Element} PdfModal 컴포넌트
 */
export function PdfModal({ isPrinting = false, onPrintClick, onClose }: PdfModalProps) {
  /** 현재 선택된 스크린샷 저장 모드 */
  const [screenshotMode, setScreenshotMode] = useState<ScreenshotMode>('full');
  /** AI 대화 요약 포함 여부 */
  const [includeSummary, setIncludeSummary] = useState(false);

  /**
   * 스크린샷 저장 모드 변경 핸들러
   * @param {ScreenshotMode} mode - 선택할 스크린샷 모드
   */
  const toggleScreenshot = (mode: ScreenshotMode) => {
    setScreenshotMode(mode);
  };

  /** 토글 버튼의 기본 스타일 클래스 */
  const baseToggleButton =
    'h-[32px] flex-1 px-4 py-2 text-b-sm font-weight-medium rounded-lg border border-border-default transition-colors duration-150';
  const singleToggleButton =
    'h-[32px] w-full px-4 py-2 text-b-sm font-weight-medium rounded-lg border border-border-default transition-colors duration-150';

  /**
   * 선택 상태에 따른 토글 버튼 스타일 클래스 반환
   * @param {boolean} selected - 선택 여부
   * @returns {string} 스타일 클래스 문자열
   */
  const getToggleClass = (selected: boolean) =>
    selected
      ? 'bg-point-500 text-base-black'
      : 'bg-bg-sub text-sub';

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 모달 헤더: 제목과 닫기 버튼 */}
      <div className="flex items-center justify-between">
        <h2 className="text-b-md font-weight-semibold text-text-title">PDF 출력</h2>
        <button
          type="button"
          className="w-[22px] h-[22px] flex items-center justify-center border border-border-default rounded-full bg-bg-sub text-text-sub3 text-b-md hover:bg-bg-hovered transition-colors"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* 스크린샷 저장 모드 선택 섹션 */}
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

      {/* 추가 정보 선택 섹션 */}
      <section className="space-y-3">
        <p className="text-b-sm font-weight-regular text-sub2">추가(선택)</p>
        <div className="space-y-2">
          <button
            type="button"
            className={`${singleToggleButton} ${getToggleClass(includeSummary)}`}
            onClick={() => setIncludeSummary((prev) => !prev)}
          >
            AI 대화 요약
          </button>
        </div>
      </section>

      {/* PDF 출력 실행 버튼 */}
      <button
        type="button"
        disabled={isPrinting}
        onClick={() =>
          onPrintClick?.({
            screenshotMode,
            summary: includeSummary ? 'AI 대화 요약' : '',
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

