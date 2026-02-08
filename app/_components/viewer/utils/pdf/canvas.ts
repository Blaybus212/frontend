import { PDF_BACKGROUND, PDF_EMPTY_SUMMARY_TEXT, PDF_TEXT } from '../../constants';
import { CAPTURE, NOTE_LAYOUT, PDF_FONT, PDF_LAYOUT, SUMMARY_BOX, TITLE_LAYOUT } from './constants';
import type { PdfNotePayload, PdfSummaryPayload } from '../pdfExport';

/**
 * PDF 캔버스 렌더 유틸
 * - 요약 박스와 노트 헤더를 캔버스로 그려 정렬 오차를 줄입니다.
 */

/**
 * 캔버스 기준 너비에 맞춰 줄바꿈된 텍스트 라인을 계산합니다.
 */
const buildSummaryLines = (
  text: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number
) => {
  const lines: string[] = [];
  const tokens = text.split(/\s+/);
  if (tokens.length > 1) {
    let line = '';
    tokens.forEach((token) => {
      const next = line ? `${line} ${token}` : token;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
      } else {
        if (line) lines.push(line);
        line = token;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  let line = '';
  Array.from(text).forEach((char) => {
    const next = line + char;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = char;
    }
  });
  if (line) lines.push(line);
  return lines;
};

/**
 * 노트 PDF 상단(제목 + 요약 박스)을 캔버스로 렌더합니다.
 */
export const buildNoteHeaderCanvas = (payload: PdfNotePayload) => {
  const summaryText = payload.summaryText || PDF_EMPTY_SUMMARY_TEXT;
  const { A4_WIDTH } = PDF_LAYOUT;

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    const fallback = document.createElement('canvas');
    fallback.width = A4_WIDTH * CAPTURE.SCALE;
    fallback.height = NOTE_LAYOUT.PADDING_TOP * CAPTURE.SCALE;
    return fallback;
  }

  const summaryLines =
    payload.includeSummary && summaryText
      ? (() => {
          measureCtx.font = PDF_FONT.SUMMARY_TEXT;
          const maxWidth = A4_WIDTH - NOTE_LAYOUT.PADDING_X * 2 - SUMMARY_BOX.PADDING_X * 2;
          return buildSummaryLines(summaryText, measureCtx, maxWidth);
        })()
      : [];

  const summaryBoxHeight = payload.includeSummary
    ? SUMMARY_BOX.PADDING_TOP +
      SUMMARY_BOX.LINE_HEIGHT +
      SUMMARY_BOX.GAP +
      summaryLines.length * SUMMARY_BOX.LINE_HEIGHT +
      SUMMARY_BOX.PADDING_BOTTOM
    : 0;
  const headerHeight =
    NOTE_LAYOUT.PADDING_TOP +
    TITLE_LAYOUT.LINE_HEIGHT +
    TITLE_LAYOUT.MARGIN_BOTTOM +
    (payload.includeSummary ? summaryBoxHeight + SUMMARY_BOX.WRAPPER_PADDING + 2 : 0);

  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH * CAPTURE.SCALE;
  canvas.height = Math.ceil(headerHeight * CAPTURE.SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(CAPTURE.SCALE, CAPTURE.SCALE);
  ctx.fillStyle = PDF_BACKGROUND;
  ctx.fillRect(0, 0, A4_WIDTH, headerHeight);
  ctx.textBaseline = 'top';

  ctx.fillStyle = PDF_TEXT;
  ctx.font = PDF_FONT.TITLE;
  ctx.fillText(
    `${payload.modelName} 노트 기록`,
    NOTE_LAYOUT.PADDING_X,
    NOTE_LAYOUT.PADDING_TOP
  );

  if (payload.includeSummary) {
    const boxX = NOTE_LAYOUT.PADDING_X;
    const boxY = NOTE_LAYOUT.PADDING_TOP + TITLE_LAYOUT.LINE_HEIGHT + TITLE_LAYOUT.MARGIN_BOTTOM;
    const boxW = A4_WIDTH - NOTE_LAYOUT.PADDING_X * 2;

    ctx.fillStyle = '#2A303A';
    ctx.beginPath();
    const radius = SUMMARY_BOX.RADIUS;
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxW - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
    ctx.lineTo(boxX + boxW, boxY + summaryBoxHeight - radius);
    ctx.quadraticCurveTo(
      boxX + boxW,
      boxY + summaryBoxHeight,
      boxX + boxW - radius,
      boxY + summaryBoxHeight
    );
    ctx.lineTo(boxX + radius, boxY + summaryBoxHeight);
    ctx.quadraticCurveTo(boxX, boxY + summaryBoxHeight, boxX, boxY + summaryBoxHeight - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PDF_TEXT;
    ctx.font = PDF_FONT.SUMMARY_LABEL;
    ctx.fillText('AI와의 대화 세줄 요약', boxX + SUMMARY_BOX.PADDING_X, boxY + SUMMARY_BOX.PADDING_TOP);

    ctx.font = PDF_FONT.SUMMARY_TEXT;
    let textY = boxY + SUMMARY_BOX.PADDING_TOP + SUMMARY_BOX.LINE_HEIGHT + SUMMARY_BOX.GAP;
    summaryLines.forEach((line) => {
      ctx.fillText(line, boxX + SUMMARY_BOX.PADDING_X, textY);
      textY += SUMMARY_BOX.LINE_HEIGHT;
    });
  }

  return canvas;
};

/**
 * 총정리 PDF 요약 박스를 캔버스로 렌더합니다.
 */
export const buildSummaryBlockCanvas = (payload: PdfSummaryPayload) => {
  const summaryText = payload.summaryText || PDF_EMPTY_SUMMARY_TEXT;
  const { A4_WIDTH } = PDF_LAYOUT;

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    const fallback = document.createElement('canvas');
    fallback.width = A4_WIDTH * CAPTURE.SCALE;
    fallback.height = (SUMMARY_BOX.PADDING_TOP + SUMMARY_BOX.PADDING_BOTTOM + SUMMARY_BOX.LINE_HEIGHT * 2) * CAPTURE.SCALE;
    return fallback;
  }

  measureCtx.font = PDF_FONT.SUMMARY_TEXT;
  const maxWidth = A4_WIDTH - SUMMARY_BOX.PADDING_X * 2;
  const summaryLines = buildSummaryLines(summaryText, measureCtx, maxWidth);

  const boxHeight =
    SUMMARY_BOX.PADDING_TOP +
    SUMMARY_BOX.LINE_HEIGHT +
    SUMMARY_BOX.GAP +
    summaryLines.length * SUMMARY_BOX.LINE_HEIGHT +
    SUMMARY_BOX.PADDING_BOTTOM;
  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH * CAPTURE.SCALE;
  canvas.height = Math.ceil((boxHeight + SUMMARY_BOX.WRAPPER_PADDING * 2) * CAPTURE.SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(CAPTURE.SCALE, CAPTURE.SCALE);
  ctx.clearRect(0, 0, A4_WIDTH, boxHeight + SUMMARY_BOX.WRAPPER_PADDING * 2);
  ctx.textBaseline = 'top';

  const boxX = 0;
  const boxY = SUMMARY_BOX.WRAPPER_PADDING;
  const boxW = A4_WIDTH;
  const radius = SUMMARY_BOX.RADIUS;
  ctx.fillStyle = '#2A303A';
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxW - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
  ctx.lineTo(boxX + boxW, boxY + boxHeight - radius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxHeight, boxX + boxW - radius, boxY + boxHeight);
  ctx.lineTo(boxX + radius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PDF_TEXT;
  ctx.font = PDF_FONT.SUMMARY_LABEL;
  ctx.fillText('AI와의 대화 세줄 요약', boxX + SUMMARY_BOX.PADDING_X, boxY + SUMMARY_BOX.PADDING_TOP);

  ctx.font = PDF_FONT.SUMMARY_TEXT;
  let textY = boxY + SUMMARY_BOX.PADDING_TOP + SUMMARY_BOX.LINE_HEIGHT + SUMMARY_BOX.GAP;
  summaryLines.forEach((line) => {
    ctx.fillText(line, boxX + SUMMARY_BOX.PADDING_X, textY);
    textY += SUMMARY_BOX.LINE_HEIGHT;
  });

  return canvas;
};
