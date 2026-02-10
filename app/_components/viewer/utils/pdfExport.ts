import { PDF_BACKGROUND, PDF_TEXT } from '../constants';
import type { ObjectData } from '../types';
import { CAPTURE, NOTE_LAYOUT, PDF_LAYOUT } from './pdf/constants';
import { buildNoteHeaderCanvas, buildSummaryBlockCanvas } from './pdf/canvas';
import { buildNoteHtml, buildSummaryHtml } from './pdf/templates';

export type PdfPartSnapshot = {
  title: string;
  images: [string | null, string | null, string | null];
  info: PdfInfoBlock;
};

export type PdfInfoBlock = Omit<ObjectData, 'isSceneInformation'>;

export type PdfSummaryPayload = {
  documentTitle: string;
  modelName: string;
  modelEnglish?: string;
  dateLabel: string;
  includeSummary: boolean;
  summaryText?: string;
  includeKeywords: boolean;
  keywords?: string[];
  modelSnapshots: [string | null, string | null, string | null];
  modelInfo: PdfInfoBlock;
  parts: PdfPartSnapshot[];
};

export type PdfNotePayload = {
  documentTitle: string;
  modelName: string;
  modelEnglish?: string;
  dateLabel: string;
  includeSummary: boolean;
  summaryText?: string;
  noteHtml: string;
  noteElement?: HTMLElement | null;
};

const A4_WIDTH = PDF_LAYOUT.A4_WIDTH;


type PdfBlockRange = { top: number; bottom: number };

const splitCanvasToPdf = async (
  canvas: HTMLCanvasElement,
  fileName: string,
  blockRanges: PdfBlockRange[] = []
) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'px', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const scale = pageWidth / canvas.width;
  const pageHeightPx = pageHeight / scale;
  const guardPx = 24 / scale;

  const sortedRanges = blockRanges
    .map((range) => ({
      top: Math.max(0, Math.floor(range.top)),
      bottom: Math.min(canvas.height, Math.floor(range.bottom)),
    }))
    .filter((range) => range.bottom > range.top)
    .sort((a, b) => a.top - b.top);

  let offsetY = 0;
  let pageIndex = 0;
  while (offsetY < canvas.height) {
    const maxY = Math.min(offsetY + pageHeightPx, canvas.height);
    let nextBreak = maxY;
    const crossing = sortedRanges.find((range) => range.top < maxY && range.bottom > maxY);
    if (crossing && crossing.top > offsetY + 1) {
      nextBreak = crossing.top;
    } else {
      const nextBlock = sortedRanges.find((range) => range.bottom > offsetY + 1);
      if (nextBlock && nextBlock.top > offsetY + 1 && nextBlock.bottom > maxY - guardPx) {
        nextBreak = nextBlock.top;
      }
    }

    if (nextBreak <= offsetY) {
      nextBreak = Math.min(offsetY + pageHeightPx, canvas.height);
    }

    const sliceHeight = Math.max(1, Math.floor(nextBreak - offsetY));
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = PDF_BACKGROUND;
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    const imgData = sliceCanvas.toDataURL('image/png');
    if (pageIndex > 0) pdf.addPage();
    pdf.setFillColor(PDF_BACKGROUND);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, sliceHeight * scale);
    pageIndex += 1;
    offsetY += sliceHeight;
  }

  pdf.save(fileName);
};

/**
 * HTML 문자열을 캔버스로 렌더합니다.
 */
const renderHtmlToCanvas = async (html: string) => {
  const html2canvas = (await import('html2canvas')).default;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.background = PDF_BACKGROUND;
  container.style.width = `${A4_WIDTH}px`;
  container.innerHTML = html;
  document.body.appendChild(container);

  const scale = CAPTURE.SCALE;
  const blocks = Array.from(container.querySelectorAll<HTMLElement>('.pdf-block'));
  const containerRect = container.getBoundingClientRect();
  const blockRanges = blocks
    .map((block) => {
      const rect = block.getBoundingClientRect();
      return {
        top: Math.floor((rect.top - containerRect.top) * scale),
        bottom: Math.floor((rect.bottom - containerRect.top) * scale),
      };
    })
    .filter((range) => Number.isFinite(range.top) && Number.isFinite(range.bottom));

  const canvas = await html2canvas(container, {
    scale,
    backgroundColor: PDF_BACKGROUND,
    useCORS: true,
  });

  document.body.removeChild(container);
  return { canvas, blockRanges };
};

/**
 * 노트 DOM을 PDF 캡처용으로 정규화합니다.
 * - 리스트 마커를 텍스트 기반 마커로 변환해 정렬을 고정합니다.
 */
const normalizeExportNoteElement = (root: HTMLElement) => {
  const lists = root.querySelectorAll('ul, ol');
  lists.forEach((list) => {
    const isOrdered = list.tagName === 'OL';
    let index = 1;
    Array.from(list.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child.tagName !== 'LI') return;
      const li = child;
      if (li.querySelector(':scope .pdf-list-row')) {
        index += 1;
        return;
      }

      li.style.listStyle = 'none';
      li.style.paddingLeft = '0';
      li.style.marginLeft = '0';

      const row = document.createElement('div');
      row.className = 'pdf-list-row';
      row.style.display = 'flex';
      row.style.alignItems = 'baseline';
      row.style.columnGap = '6px';

      const marker = document.createElement('span');
      marker.textContent = isOrdered ? `${index}.` : '•';
      marker.style.flex = '0 0 auto';
      marker.style.lineHeight = 'inherit';

      const content = document.createElement('div');
      content.style.flex = '1';
      content.style.minWidth = '0';

      const nodes = Array.from(li.childNodes);
      nodes.forEach((node) => content.appendChild(node));

      row.appendChild(marker);
      row.appendChild(content);
      li.appendChild(row);
      index += 1;
    });
  });
};

/**
 * 노트 본문 DOM을 PDF 캡처용 컨테이너로 감쌉니다.
 */
const buildNoteContentContainer = (noteElement: HTMLElement) => {
  const container = document.createElement('div');
  container.style.width = `${A4_WIDTH}px`;
  container.style.padding = `0 ${NOTE_LAYOUT.PADDING_X}px ${NOTE_LAYOUT.PADDING_BOTTOM}px`;
  container.style.fontFamily = 'Pretendard, sans-serif';
  container.style.color = PDF_TEXT;
  container.style.background = PDF_BACKGROUND;
  container.style.boxSizing = 'border-box';

  const contentWrapper = document.createElement('div');
  contentWrapper.style.marginTop = '0';
  const clone = noteElement.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.boxSizing = 'border-box';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.minHeight = 'auto';
  clone.style.overflow = 'visible';
  clone.style.position = 'relative';
  clone.classList.add('pdf-note-export');
  normalizeExportNoteElement(clone);
  contentWrapper.appendChild(clone);
  container.appendChild(contentWrapper);

  const style = document.createElement('style');
  style.textContent = `
    .pdf-note-export {
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    }
  `;
  container.appendChild(style);

  return container;
};


/**
 * 노트 DOM을 캡처해 PDF용 캔버스로 변환합니다.
 */
const renderNoteElementToCanvas = async (payload: PdfNotePayload, noteElement: HTMLElement) => {
  const html2canvas = (await import('html2canvas')).default;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.background = PDF_BACKGROUND;
  container.appendChild(buildNoteContentContainer(noteElement));
  document.body.appendChild(container);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const scale = CAPTURE.SCALE;
  const noteCanvas = await html2canvas(container, {
    scale,
    backgroundColor: PDF_BACKGROUND,
    useCORS: true,
  });

  document.body.removeChild(container);
  const headerCanvas = buildNoteHeaderCanvas(payload);
  const composite = document.createElement('canvas');
  composite.width = headerCanvas.width;
  composite.height = headerCanvas.height + noteCanvas.height;
  const ctx = composite.getContext('2d');
  if (!ctx) return { canvas: noteCanvas };
  ctx.fillStyle = PDF_BACKGROUND;
  ctx.fillRect(0, 0, composite.width, composite.height);
  ctx.drawImage(headerCanvas, 0, 0);
  ctx.drawImage(noteCanvas, 0, headerCanvas.height);
  return { canvas: composite };
};

/**
 * 총정리 PDF를 생성합니다.
 */
export const exportSummaryPdf = async (payload: PdfSummaryPayload) => {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  const html = buildSummaryHtml(payload);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.background = PDF_BACKGROUND;
  container.style.width = `${A4_WIDTH}px`;
  container.innerHTML = html;
  document.body.appendChild(container);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const scale = CAPTURE.SCALE;
  const blocks = Array.from(container.querySelectorAll<HTMLElement>('.pdf-block'));
  const pdf = new jsPDF({ unit: 'px', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { PAGE_PADDING_X, PAGE_PADDING_TOP, PAGE_PADDING_BOTTOM, BLOCK_GAP } = PDF_LAYOUT;
  const usableWidth = pageWidth - PAGE_PADDING_X * 2;
  const usableHeight = pageHeight - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;

  const captureHost = document.createElement('div');
  captureHost.style.position = 'fixed';
  captureHost.style.left = '-9999px';
  captureHost.style.top = '0';
  captureHost.style.width = `${A4_WIDTH}px`;
  captureHost.style.background = PDF_BACKGROUND;
  document.body.appendChild(captureHost);

  let cursorY = 0;
  let pageIndex = 0;

  const startNewPage = () => {
    if (pageIndex > 0) pdf.addPage();
    pdf.setFillColor(PDF_BACKGROUND);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pageIndex += 1;
    cursorY = 0;
  };

  const drawSlice = (imgData: string, heightPx: number) => {
    startNewPage();
    pdf.addImage(imgData, 'PNG', PAGE_PADDING_X, PAGE_PADDING_TOP, usableWidth, heightPx);
  };

  for (const block of blocks) {
    let blockCanvas: HTMLCanvasElement;
    if (block.classList.contains('pdf-summary-block') && payload.includeSummary) {
      blockCanvas = buildSummaryBlockCanvas(payload);
    } else {
      const wrapper = document.createElement('div');
      wrapper.style.width = `${A4_WIDTH}px`;
      wrapper.style.background = PDF_BACKGROUND;
      wrapper.style.paddingTop = '6px';
      wrapper.style.paddingBottom = '6px';
      wrapper.style.boxSizing = 'border-box';
      const clone = block.cloneNode(true) as HTMLElement;
      clone.style.margin = '0';
      wrapper.appendChild(clone);
      captureHost.appendChild(wrapper);

      blockCanvas = await html2canvas(wrapper, {
        scale,
        backgroundColor: PDF_BACKGROUND,
        useCORS: true,
      });
      captureHost.removeChild(wrapper);
    }
    const blockHeight = blockCanvas.height;
    const blockScale = usableWidth / blockCanvas.width;
    const blockHeightOnPage = blockHeight * blockScale;

    if (blockHeightOnPage > usableHeight) {
      let offsetY = 0;
      while (offsetY < blockCanvas.height) {
        const sliceHeight = Math.min(blockCanvas.height - offsetY, usableHeight / blockScale);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = blockCanvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = PDF_BACKGROUND;
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          blockCanvas,
          0,
          offsetY,
          blockCanvas.width,
          sliceHeight,
          0,
          0,
          blockCanvas.width,
          sliceHeight
        );
        drawSlice(sliceCanvas.toDataURL('image/png'), sliceHeight * blockScale);
        offsetY += sliceHeight;
      }
      cursorY = 0;
      continue;
    }

    if (pageIndex === 0 && cursorY === 0) {
      startNewPage();
      cursorY = PAGE_PADDING_TOP;
    }

    if (cursorY + blockHeightOnPage > pageHeight - PAGE_PADDING_BOTTOM) {
      startNewPage();
      cursorY = PAGE_PADDING_TOP;
    }

    const imgData = blockCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', PAGE_PADDING_X, cursorY, usableWidth, blockHeightOnPage);
    cursorY += blockHeightOnPage + BLOCK_GAP;
  }

  document.body.removeChild(container);
  document.body.removeChild(captureHost);
  pdf.save(`${payload.documentTitle}.pdf`);
};

/**
 * 노트 PDF를 생성합니다.
 * - noteElement가 있으면 실 DOM 기반 캡처를 사용합니다.
 */
export const exportNotePdf = async (payload: PdfNotePayload) => {
  if (payload.noteElement) {
    const { canvas } = await renderNoteElementToCanvas(payload, payload.noteElement);
    await splitCanvasToPdf(canvas, `${payload.documentTitle}.pdf`);
    return;
  }

  const html = buildNoteHtml(payload);
  const { canvas } = await renderHtmlToCanvas(html);
  await splitCanvasToPdf(canvas, `${payload.documentTitle}.pdf`);
};
