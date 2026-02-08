'use client';

import { useMemo } from 'react';
import type { Editor } from '@tiptap/react';

interface SlashMenuProps {
  editor: Editor;
  query: string;
  position: { top: number; left: number };
  range: { from: number; to: number };
  onClose: () => void;
  onOpenMention: () => void;
}

/**
 * 노트 슬래시 메뉴
 * - 입력한 쿼리에 맞는 블록/명령을 선택해 삽입합니다.
 */
export function SlashMenu({
  editor,
  query,
  position,
  range,
  onClose,
  onOpenMention,
}: SlashMenuProps) {
  const items = useMemo(
    () => [
      { id: 'h1', label: '제목 1', run: () => editor.chain().focus().setHeading({ level: 1 }).run() },
      { id: 'h2', label: '제목 2', run: () => editor.chain().focus().setHeading({ level: 2 }).run() },
      { id: 'h3', label: '제목 3', run: () => editor.chain().focus().setHeading({ level: 3 }).run() },
      { id: 'bullet', label: '불릿 리스트', run: () => editor.chain().focus().toggleBulletList().run() },
      { id: 'ordered', label: '번호 리스트', run: () => editor.chain().focus().toggleOrderedList().run() },
      { id: 'quote', label: '인용문', run: () => {} },
      { id: 'hr', label: '구분선', run: () => editor.chain().focus().setHorizontalRule().run() },
      { id: 'mention', label: '부품 언급', run: () => {} },
    ],
    [editor]
  );

  const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (item: (typeof items)[number]) => {
    editor.chain().focus().deleteRange(range).setTextSelection(range.from).run();
    if (item.id === 'quote') {
      editor
        .chain()
        .focus()
        .insertContentAt(range.from, {
          type: 'blockquote',
          content: [{ type: 'paragraph' }],
        })
        .setTextSelection(range.from + 2)
        .run();
    } else if (item.id === 'mention') {
      editor.chain().focus().insertContent('@').run();
      onOpenMention();
    } else {
      item.run();
    }
    onClose();
  };

  return (
    <div
      className="absolute z-10 w-48 rounded-xl border border-border-default bg-bg-default shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-b-sm text-sub3">결과 없음</li>
        ) : (
          filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(item);
                }}
                className="w-full text-left px-3 py-2 text-b-sm text-sub2 hover:bg-bg-hovered transition-colors"
              >
                {item.label}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
