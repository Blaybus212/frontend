'use client';

import type { Editor } from '@tiptap/react';
import type { SelectablePart } from '@/app/_components/3d/types';

interface MentionMenuProps {
  editor: Editor;
  parts: SelectablePart[];
  query: string;
  position: { top: number; left: number };
  range: { from: number; to: number };
  onClose: () => void;
  modelName: string;
  onSelectPart?: (part: SelectablePart) => void;
}

/**
 * 노트 멘션 메뉴
 * - 부품/모델을 선택해 헤딩 블록을 삽입합니다.
 */
export function MentionMenu({
  editor,
  parts,
  query,
  position,
  range,
  onClose,
  modelName,
  onSelectPart,
}: MentionMenuProps) {
  const normalizedQuery = query.toLowerCase();
  const filtered = parts.filter((part) => {
    const english = (part.originalName || '').toLowerCase();
    const local = (part.nodeName || '').toLowerCase();
    return english.includes(normalizedQuery) || local.includes(normalizedQuery);
  });
  const handleSelect = (part: SelectablePart) => {
    editor.chain().focus().deleteRange(range).run();
    onClose();
    onSelectPart?.(part);
    const label = part.originalName || part.nodeName;
    editor
      .chain()
      .focus()
      .insertContent([
        { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: label }] },
        { type: 'paragraph', content: [{ type: 'text', text: ' ' }] },
      ])
      .run();
  };

  return (
    <div
      className="absolute z-10 w-56 rounded-xl border border-border-default bg-bg-default shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-b-sm text-sub3">부품 없음</li>
        ) : (
          filtered.map((part) => (
            <li key={part.nodeId}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(part);
                }}
                className="w-full text-left px-3 py-2 text-b-sm text-sub2 hover:bg-bg-hovered transition-colors"
              >
                {part.originalName || part.nodeName}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
