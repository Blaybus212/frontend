import { PDF_A4_WIDTH } from '../../constants';

/**
 * PDF 렌더링에서 사용하는 레이아웃/타이포/스케일 상수 모음
 * - 템플릿/캔버스 렌더가 동일한 값을 공유하도록 분리합니다.
 */

/** A4 페이지 기본 레이아웃 값 */
export const PDF_LAYOUT = {
  A4_WIDTH: PDF_A4_WIDTH,
  PAGE_PADDING_X: 48,
  PAGE_PADDING_TOP: 40,
  PAGE_PADDING_BOTTOM: 40,
  BLOCK_GAP: 24,
} as const;

/** 노트 PDF 레이아웃 기본 패딩 */
export const NOTE_LAYOUT = {
  PADDING_X: 48,
  PADDING_TOP: 40,
  PADDING_BOTTOM: 40,
} as const;

/** 요약 박스(세줄 요약) 렌더링 설정 */
export const SUMMARY_BOX = {
  PADDING_TOP: 20,
  PADDING_BOTTOM: 12,
  PADDING_X: 18,
  LINE_HEIGHT: 20,
  GAP: 6,
  RADIUS: 16,
  WRAPPER_PADDING: 6,
} as const;

/** 타이틀 텍스트 레이아웃 */
export const TITLE_LAYOUT = {
  LINE_HEIGHT: 32,
  MARGIN_BOTTOM: 20,
} as const;

/** 캡처 스케일 (html2canvas용) */
export const CAPTURE = {
  SCALE: 2,
} as const;

/** PDF 텍스트 스타일 프리셋 */
export const PDF_FONT = {
  FAMILY: 'Pretendard, sans-serif',
  TITLE: '700 26px Pretendard, sans-serif',
  SUMMARY_LABEL: '600 14px Pretendard, sans-serif',
  SUMMARY_TEXT: '400 14px Pretendard, sans-serif',
} as const;
