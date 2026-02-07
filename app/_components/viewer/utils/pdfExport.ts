import { PDF_A4_WIDTH, PDF_BACKGROUND, PDF_SUBTEXT, PDF_TEXT } from '../constants';

export type PdfPartSnapshot = {
  title: string;
  images: [string | null, string | null, string | null];
};

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
  parts: PdfPartSnapshot[];
};

export type PdfNotePayload = {
  documentTitle: string;
  modelName: string;
  dateLabel: string;
  includeSummary: boolean;
  summaryText?: string;
  noteHtml: string;
  noteElement?: HTMLElement | null;
};

const A4_WIDTH = PDF_A4_WIDTH;

const buildSummaryHtml = (payload: PdfSummaryPayload) => {
  const keywords = payload.includeKeywords ? payload.keywords ?? [] : [];
  const summaryText = payload.includeSummary
    ? payload.summaryText || 'AI와 대화를 나눈 기록이 없어요'
    : '';

  const partsHtml = payload.parts
    .map((part, index) => {
      const number = index + 2;
      const imageRow = part.images
        .map((image) =>
          image
            ? `<div style="flex:1; border:1px solid #394150; border-radius:12px; overflow:hidden;">
                <img src="${image}" style="width:100%; display:block;" />
              </div>`
            : `<div style="flex:1; height:180px; border:1px solid #394150; border-radius:12px; background:#2A303A; display:flex; align-items:center; justify-content:center; font-size:14px; color:${PDF_SUBTEXT};">이미지 없음</div>`
        )
        .join('');
      return `
        <div class="pdf-block" style="margin-top:24px;">
          <div style="font-size:22px; font-weight:600; margin-bottom:12px; color:${PDF_TEXT};">${number}. ${part.title}</div>
          <div style="display:flex; gap:12px;">${imageRow}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div style="width:${A4_WIDTH}px; padding:40px 48px; font-family: Pretendard, sans-serif; color:${PDF_TEXT}; background:${PDF_BACKGROUND};">
      <div class="pdf-block" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:28px; font-weight:700;">${payload.modelName} ${payload.modelEnglish ?? ''}</div>
          <div style="font-size:16px; color:${PDF_SUBTEXT};">${payload.modelEnglish ?? ''}</div>
        </div>
        <div style="font-size:14px; color:${PDF_SUBTEXT};">@${payload.dateLabel}</div>
      </div>
      ${
        keywords.length > 0
          ? `<div class="pdf-block" style="margin-top:6px; font-size:14px; color:${PDF_SUBTEXT};">${keywords
              .map((keyword) => `#${keyword}`)
              .join(' ')}</div>`
          : ''
      }
      ${
        payload.includeSummary
          ? `
        <div class="pdf-block pdf-summary-block" style="margin-top:18px; background:#2A303A; padding:14px 18px; border-radius:16px; font-size:14px; color:${PDF_TEXT};">
          <div style="font-weight:600; margin-bottom:6px;">AI와의 대화 세줄 요약</div>
          <div>${summaryText}</div>
        </div>
      `
          : ''
      }
      <div class="pdf-block" style="margin-top:28px;">
        <div style="font-size:26px; font-weight:700;">1. ${payload.modelName}</div>
        <div style="margin-top:12px;">
          <div style="display:flex; gap:12px;">
            ${payload.modelSnapshots
              .map((image) =>
                image
                  ? `<div style="flex:1; border:1px solid #394150; border-radius:12px; overflow:hidden;">
                      <img src="${image}" style="width:100%; display:block;" />
                    </div>`
                  : `<div style="flex:1; height:200px; border:1px solid #394150; border-radius:12px; background:#2A303A; display:flex; align-items:center; justify-content:center; font-size:14px; color:${PDF_SUBTEXT};">스크린샷</div>`
              )
              .join('')}
          </div>
        </div>
      </div>
      ${partsHtml}
    </div>
  `;
};

const buildNoteHtml = (payload: PdfNotePayload) => {
  const summaryText = payload.includeSummary
    ? payload.summaryText || 'AI와 대화를 나눈 기록이 없어요'
    : '';

  return `
    <div style="width:${A4_WIDTH}px; padding:40px 48px; font-family: Pretendard, sans-serif; color:${PDF_TEXT}; background:${PDF_BACKGROUND};">
      <style>
        :root {
          --color-bg-default: #252931;
          --color-border-default: #364153;
          --color-title: #FFFFFF;
          --color-sub2: #D1D5DC;
          --text-h-xl: 28px;  --text-h-xl--line-height: 36px;
          --text-h-lg: 24px;  --text-h-lg--line-height: 28px;
          --text-h-md: 22px;  --text-h-md--line-height: 32px;
          --text-h-sm: 20px;  --text-h-sm--line-height: 32px;
          --text-b-lg: 16px;  --text-b-lg--line-height: 24px;
          --text-b-md: 14px;  --text-b-md--line-height: 20px;
          --text-b-sm: 12px;  --text-b-sm--line-height: 16px;
          --font-weight-semibold: 600;
        }
        .note-content {
          font-size: var(--text-b-lg);
          line-height: var(--text-b-lg--line-height);
          color: ${PDF_TEXT};
          word-break: break-word;
          tab-size: 4;
        }
        .note-content * { margin: 0; }
        .note-content h1 {
          font-size: var(--text-h-xl);
          line-height: var(--text-h-xl--line-height);
          font-weight: var(--font-weight-semibold);
          color: var(--color-title);
        }
        .note-content h2 {
          font-size: var(--text-h-lg);
          line-height: var(--text-h-lg--line-height);
          font-weight: var(--font-weight-semibold);
          color: var(--color-title);
        }
        .note-content h3 {
          font-size: var(--text-h-md);
          line-height: var(--text-h-md--line-height);
          font-weight: var(--font-weight-semibold);
          color: var(--color-title);
        }
        .note-content h4 {
          font-size: var(--text-h-sm);
          line-height: var(--text-h-sm--line-height);
          font-weight: var(--font-weight-semibold);
          color: var(--color-title);
        }
        .note-content h5,
        .note-content h6 {
          font-size: var(--text-b-lg);
          line-height: var(--text-b-lg--line-height);
          font-weight: var(--font-weight-semibold);
          color: var(--color-title);
        }
        .note-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0;
        }
        .note-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0;
        }
        .note-content li {
          margin: 0.25rem 0;
          line-height: var(--text-b-lg--line-height);
          display: list-item;
        }
        .note-content li::marker {
          font-size: 1em;
        }
        .note-content li > p {
          margin: 0;
          line-height: inherit;
        }
        .note-content blockquote {
          border-left: 3px solid var(--color-border-default);
          padding-left: 12px;
          color: var(--color-sub2);
          display: block;
          width: 100%;
          padding-top: 6px;
          padding-bottom: 6px;
        }
        .note-content hr {
          border: none;
          border-top: 1px solid var(--color-border-default);
          margin: 12px 0;
        }
        .note-content .is-empty.is-editor-empty::before { content: ''; }
        .note-content .is-empty::before { content: ''; }
      </style>
      <div style="font-size:26px; font-weight:700; margin-bottom:20px;">${payload.modelName} 노트 기록</div>
      ${
        payload.includeSummary
          ? `
        <div style="margin-top:0; margin-bottom:8px; background:#2A303A; padding:14px 18px; border-radius:16px; font-size:14px; line-height:20px; color:${PDF_TEXT}; display:flex; flex-direction:column; gap:6px;">
          <div style="font-weight:600; margin:0; line-height:20px;">AI와의 대화 세줄 요약</div>
          <div>${summaryText}</div>
        </div>
      `
          : ''
      }
      <div style="margin-top:0;">
        <div class="note-content note-editor">
          ${payload.noteHtml || `<div style="color:${PDF_SUBTEXT};">노트 내용이 없습니다.</div>`}
        </div>
      </div>
    </div>
  `;
};

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

  const scale = 2;
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

const NOTE_PADDING_X = 48;
const NOTE_PADDING_TOP = 40;
const NOTE_PADDING_BOTTOM = 40;

const buildNoteContentContainer = (noteElement: HTMLElement) => {
  const container = document.createElement('div');
  container.style.width = `${A4_WIDTH}px`;
  container.style.padding = `0 ${NOTE_PADDING_X}px ${NOTE_PADDING_BOTTOM}px`;
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

const buildSummaryLines = (text: string, ctx: CanvasRenderingContext2D, maxWidth: number) => {
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

const buildNoteHeaderCanvas = (payload: PdfNotePayload, scale: number) => {
  const titleLineHeight = 32;
  const titleMarginBottom = 20;
  const summaryMarginBottom = 8;
  const summaryPaddingTop = 20;
  const summaryPaddingBottom = 12;
  const summaryPaddingX = 18;
  const summaryLineHeight = 20;
  const summaryGap = 6;

  const titleText = `${payload.modelName} 노트 기록`;
  const summaryText = payload.summaryText || 'AI와 대화를 나눈 기록이 없어요';

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    const fallback = document.createElement('canvas');
    fallback.width = A4_WIDTH * scale;
    fallback.height = NOTE_PADDING_TOP * scale;
    return fallback;
  }

  const summaryLines =
    payload.includeSummary && summaryText
      ? (() => {
          measureCtx.font = '400 14px Pretendard, sans-serif';
          const maxWidth = A4_WIDTH - NOTE_PADDING_X * 2 - summaryPaddingX * 2;
          return buildSummaryLines(summaryText, measureCtx, maxWidth);
        })()
      : [];

  const summaryBoxHeight = payload.includeSummary
    ? summaryPaddingTop +
      summaryLineHeight +
      summaryGap +
      summaryLines.length * summaryLineHeight +
      summaryPaddingBottom
    : 0;
  const headerHeight =
    NOTE_PADDING_TOP +
    titleLineHeight +
    titleMarginBottom +
    (payload.includeSummary ? summaryBoxHeight + summaryMarginBottom : 0);

  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH * scale;
  canvas.height = Math.ceil(headerHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  ctx.fillStyle = PDF_BACKGROUND;
  ctx.fillRect(0, 0, A4_WIDTH, headerHeight);
  ctx.textBaseline = 'top';

  ctx.fillStyle = PDF_TEXT;
  ctx.font = '700 26px Pretendard, sans-serif';
  ctx.fillText(titleText, NOTE_PADDING_X, NOTE_PADDING_TOP);

  if (payload.includeSummary) {
    const boxX = NOTE_PADDING_X;
    const boxY = NOTE_PADDING_TOP + titleLineHeight + titleMarginBottom;
    const boxW = A4_WIDTH - NOTE_PADDING_X * 2;

    ctx.fillStyle = '#2A303A';
    ctx.beginPath();
    const radius = 16;
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
    ctx.font = '600 14px Pretendard, sans-serif';
    ctx.fillText('AI와의 대화 세줄 요약', boxX + summaryPaddingX, boxY + summaryPaddingTop);

    ctx.font = '400 14px Pretendard, sans-serif';
    let textY = boxY + summaryPaddingTop + summaryLineHeight + summaryGap;
    summaryLines.forEach((line) => {
      ctx.fillText(line, boxX + summaryPaddingX, textY);
      textY += summaryLineHeight;
    });
  }

  return canvas;
};

const buildSummaryBlockCanvas = (payload: PdfSummaryPayload, scale: number) => {
  const summaryPaddingTop = 20;
  const summaryPaddingBottom = 12;
  const summaryPaddingX = 18;
  const summaryLineHeight = 20;
  const summaryGap = 6;
  const wrapperPadding = 6;

  const summaryText = payload.summaryText || 'AI와 대화를 나눈 기록이 없어요';

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) {
    const fallback = document.createElement('canvas');
    fallback.width = A4_WIDTH * scale;
    fallback.height = (summaryPaddingTop + summaryPaddingBottom + summaryLineHeight * 2) * scale;
    return fallback;
  }

  measureCtx.font = '400 14px Pretendard, sans-serif';
  const maxWidth = A4_WIDTH - summaryPaddingX * 2;
  const summaryLines = buildSummaryLines(summaryText, measureCtx, maxWidth);

  const boxHeight =
    summaryPaddingTop +
    summaryLineHeight +
    summaryGap +
    summaryLines.length * summaryLineHeight +
    summaryPaddingBottom;
  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH * scale;
  canvas.height = Math.ceil((boxHeight + wrapperPadding * 2) * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, A4_WIDTH, boxHeight + wrapperPadding * 2);
  ctx.textBaseline = 'top';

  const boxX = 0;
  const boxY = wrapperPadding;
  const boxW = A4_WIDTH;
  const radius = 16;
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
  ctx.font = '600 14px Pretendard, sans-serif';
  ctx.fillText('AI와의 대화 세줄 요약', boxX + summaryPaddingX, boxY + summaryPaddingTop);

  ctx.font = '400 14px Pretendard, sans-serif';
  let textY = boxY + summaryPaddingTop + summaryLineHeight + summaryGap;
  summaryLines.forEach((line) => {
    ctx.fillText(line, boxX + summaryPaddingX, textY);
    textY += summaryLineHeight;
  });

  return canvas;
};

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

  const scale = 2;
  const noteCanvas = await html2canvas(container, {
    scale,
    backgroundColor: PDF_BACKGROUND,
    useCORS: true,
  });

  document.body.removeChild(container);
  const headerCanvas = buildNoteHeaderCanvas(payload, scale);
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

  const scale = 2;
  const blocks = Array.from(container.querySelectorAll<HTMLElement>('.pdf-block'));
  const pdf = new jsPDF({ unit: 'px', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const PAGE_PADDING_X = 48;
  const PAGE_PADDING_TOP = 40;
  const PAGE_PADDING_BOTTOM = 40;
  const BLOCK_GAP = 24;
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
      blockCanvas = buildSummaryBlockCanvas(payload, scale);
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
