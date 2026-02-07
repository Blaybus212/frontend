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
};

const A4_WIDTH = 794;
const IMAGE_SCALE = 0.5;
const PDF_BACKGROUND = '#1B1F27';
const PDF_TEXT = '#E9EDF3';
const PDF_SUBTEXT = '#9AA3B2';

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
        <div class="pdf-block" style="margin-top:18px; background:#2A303A; padding:14px 18px; border-radius:16px; font-size:14px; color:${PDF_TEXT};">
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
        .note-content {
          font-size: 16px;
          line-height: 1.5;
          color: ${PDF_TEXT};
          white-space: pre-wrap;
          word-break: break-word;
          tab-size: 4;
        }
        .note-content > * { margin: 0; }
        .note-content > * + * { margin-top: 8px; }
        .note-content p { margin: 0; }
        .note-content h1 { font-size: 28px; font-weight: 700; }
        .note-content h2 { font-size: 24px; font-weight: 700; }
        .note-content h3 { font-size: 20px; font-weight: 700; }
        .note-content h4 { font-size: 18px; font-weight: 600; }
        .note-content h5 { font-size: 16px; font-weight: 600; }
        .note-content h6 { font-size: 15px; font-weight: 600; }
        .note-content ul, .note-content ol {
          padding-left: 1.5rem;
          list-style-position: outside;
          margin: 0;
        }
        .note-content ul { list-style: disc; }
        .note-content ol { list-style: decimal; }
        .note-content li {
          margin: 4px 0;
        }
        .note-content li::marker {
          font-size: 0.8em;
          line-height: 1;
        }
        .note-content ul ul, .note-content ol ol { margin-top: 4px; }
        .note-content code { background: #1B1F27; color: ${PDF_SUBTEXT}; padding: 2px 6px; border-radius: 6px; font-size: 0.9em; }
        .note-content pre { background: #1B1F27; border: 1px solid #394150; border-radius: 12px; padding: 12px 14px; overflow-x: auto; color: ${PDF_SUBTEXT}; margin: 12px 0; }
        .note-content pre code { background: transparent; padding: 0; color: inherit; font-size: inherit; }
        .note-content blockquote { border-left: 3px solid #394150; padding-left: 12px; color: ${PDF_SUBTEXT}; padding-top: 6px; padding-bottom: 6px; }
        .note-content hr { border: none; border-top: 1px solid #394150; margin: 16px 0; }
      </style>
      <div style="font-size:26px; font-weight:700; margin-bottom:20px;">${payload.modelName} 노트 기록</div>
      ${
        payload.includeSummary
          ? `
        <div style="margin-top:0; margin-bottom:8px; background:#2A303A; padding:14px 18px; border-radius:16px; font-size:14px; color:${PDF_TEXT};">
          <div style="font-weight:600; margin-bottom:6px;">AI와의 대화 세줄 요약</div>
          <div>${summaryText}</div>
        </div>
      `
          : ''
      }
      <div style="margin-top:0;">
        <div class="note-content">
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

    const blockCanvas = await html2canvas(wrapper, {
      scale,
      backgroundColor: PDF_BACKGROUND,
      useCORS: true,
    });
    captureHost.removeChild(wrapper);
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
  const html = buildNoteHtml(payload);
  const { canvas } = await renderHtmlToCanvas(html);
  await splitCanvasToPdf(canvas, `${payload.documentTitle}.pdf`);
};
