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
}: MentionMenuProps) {
  const filtered = parts.filter((part) =>
    part.nodeName.toLowerCase().includes(query.toLowerCase())
  );
  const showModel = modelName.toLowerCase().includes(query.toLowerCase());

  const handleSelect = (part: SelectablePart) => {
    editor.chain().focus().deleteRange(range).run();
    onClose();
    const label = part.nodeName;
    editor
      .chain()
      .focus()
      .insertContent([
        { type: 'text', text: label, marks: [{ type: 'mentionHighlight' }] },
        { type: 'text', text: ' ' },
      ])
      .run();
  };

  const handleSelectModel = () => {
    editor.chain().focus().deleteRange(range).run();
    onClose();
    const label = modelName;
    editor
      .chain()
      .focus()
      .insertContent([
        { type: 'text', text: label, marks: [{ type: 'mentionHighlight' }] },
        { type: 'text', text: ' ' },
      ])
      .run();
  };

  return (
    <div
      className="absolute z-10 w-56 rounded-xl border border-border-default bg-bg-default shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
        {showModel && (
          <li>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelectModel();
              }}
              className="w-full text-left px-3 py-2 text-b-sm text-text-title hover:bg-bg-hovered transition-colors"
            >
              {modelName}
            </button>
          </li>
        )}
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
                {part.nodeName}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
