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
  onInsertPartSnapshot?: (nodeId: string) => Promise<string | null>;
  onInsertModelSnapshot?: (modelId: string) => Promise<string | null>;
  modelName: string;
  modelId: string;
}

/**
 * 노트 멘션 메뉴
 * - 부품/모델을 선택해 헤딩+이미지 블록을 삽입합니다.
 */
export function MentionMenu({
  editor,
  parts,
  query,
  position,
  range,
  onClose,
  onInsertPartSnapshot,
  onInsertModelSnapshot,
  modelName,
  modelId,
}: MentionMenuProps) {
  const filtered = parts.filter((part) =>
    part.nodeName.toLowerCase().includes(query.toLowerCase())
  );
  const showModel = modelName.toLowerCase().includes(query.toLowerCase());

  const handleSelect = async (part: SelectablePart) => {
    editor.chain().focus().deleteRange(range).run();
    onClose();

    const snapshot = onInsertPartSnapshot ? await onInsertPartSnapshot(part.nodeId) : null;
    const content: Array<Record<string, unknown>> = [
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: part.nodeName }] },
    ];
    if (snapshot) {
      content.push({
        type: 'image',
        attrs: { src: snapshot, alt: part.nodeName },
      });
    }
    content.push({ type: 'paragraph' });
    editor.chain().focus().insertContent(content).run();
  };

  const handleSelectModel = async () => {
    editor.chain().focus().deleteRange(range).run();
    onClose();
    const snapshot = onInsertModelSnapshot ? await onInsertModelSnapshot(modelId) : null;
    const content: Array<Record<string, unknown>> = [
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: modelName }] },
    ];
    if (snapshot) {
      content.push({
        type: 'image',
        attrs: { src: snapshot, alt: modelName },
      });
    }
    content.push({ type: 'paragraph' });
    editor.chain().focus().insertContent(content).run();
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
