import { PDF_BACKGROUND, PDF_EMPTY_SUMMARY_TEXT, PDF_SUBTEXT, PDF_TEXT } from '../../constants';
import { PDF_LAYOUT, PDF_FONT } from './constants';
import type { PdfNotePayload, PdfSummaryPayload } from '../pdfExport';

/**
 * PDF HTML 템플릿 모음
 * - 요약/노트 HTML을 문자열로 생성합니다.
 * - 캔버스 렌더/HTML 렌더에서 공통으로 사용합니다.
 */

const { A4_WIDTH } = PDF_LAYOUT;

/**
 * 총정리 PDF의 HTML 템플릿을 생성합니다.
 */
export const buildSummaryHtml = (payload: PdfSummaryPayload) => {
  const keywords = payload.includeKeywords ? payload.keywords ?? [] : [];
  const summaryText = payload.includeSummary
    ? payload.summaryText || PDF_EMPTY_SUMMARY_TEXT
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
    <div style="width:${A4_WIDTH}px; padding:40px 48px; font-family:${PDF_FONT.FAMILY}; color:${PDF_TEXT}; background:${PDF_BACKGROUND};">
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

/**
 * 노트 기록 PDF의 HTML 템플릿을 생성합니다.
 */
export const buildNoteHtml = (payload: PdfNotePayload) => {
  const summaryText = payload.includeSummary
    ? payload.summaryText || PDF_EMPTY_SUMMARY_TEXT
    : '';

  return `
    <div style="width:${A4_WIDTH}px; padding:40px 48px; font-family:${PDF_FONT.FAMILY}; color:${PDF_TEXT}; background:${PDF_BACKGROUND};">
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
