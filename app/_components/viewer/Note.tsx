'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type MutableRefObject } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import { textblockTypeInputRule, mergeAttributes, Mark } from '@tiptap/core';
import { MarkdownSerializer, defaultMarkdownSerializer } from 'prosemirror-markdown';
import type { SelectablePart } from '@/app/_components/3d/types';
import { SlashMenu } from './SlashMenu';
import { MentionMenu } from './MentionMenu';
import {
  NOTE_EDITOR_CONTENT_MIN_HEIGHT_PX,
  NOTE_EDITOR_MIN_HEIGHT_PX,
  NOTE_HEADING_LEVELS,
  NOTE_MENU_OFFSET_PX,
  NOTE_PLACEHOLDER,
  NOTE_TEXT_LOOKBACK,
} from './constants';

/**
 * Note 컴포넌트의 Props 인터페이스
 * @interface NoteProps
 * @property {boolean} [selected=false] - 노트의 선택/활성 상태 (true일 경우 자동 포커스 및 밝은 테두리)
 * @property {string} [value] - 제어 컴포넌트용 텍스트 값
 * @property {string} [defaultValue=''] - 비제어 컴포넌트용 초기 텍스트 값
 * @property {(value: string) => void} [onChange] - 텍스트 값 변경 시 호출되는 콜백 함수
 * @property {() => void} [onFocus] - 텍스트 영역 포커스 시 호출되는 콜백 함수
 * @property {() => void} [onBlur] - 텍스트 영역 포커스 해제 시 호출되는 콜백 함수
 * @property {() => void} [onClick] - 텍스트 영역 클릭 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 * @property {string} [placeholder='메모를 입력하세요...'] - 플레이스홀더 텍스트
 */
interface NoteProps {
  selected?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
  className?: string;
  placeholder?: string;
  parts?: SelectablePart[];
  modelName?: string;
  exportContainerRef?: MutableRefObject<HTMLDivElement | null>;
}

/**
 * 메모 작성 컴포넌트
 * 
 * 사용자가 학습 내용을 자유롭게 작성할 수 있는 텍스트 입력 영역입니다.
 * 제어형/비제어형 컴포넌트 모두 지원하며, 선택 상태에 따라 자동으로 포커스됩니다.
 * 
 * **주요 기능:**
 * - 제어형/비제어형 컴포넌트 지원
 * - 선택 상태에 따른 자동 포커스
 * - 포커스/블러 상태에 따른 테두리 색상 변경
 * - 자동 높이 조절 (flex-1 클래스 사용 시)
 * 
 * **상태별 스타일:**
 * - 기본: 회색 테두리
 * - 포커스/선택: 네온 그린 테두리 (border-focus 색상)
 * 
 * **사용 예시:**
 * ```tsx
 * // 비제어형 컴포넌트
 * <Note
 *   defaultValue="초기 메모"
 *   onChange={(value) => {
 *     // handle change
 *   }}
 * />
 * 
 * // 제어형 컴포넌트
 * <Note
 *   value={noteValue}
 *   onChange={setNoteValue}
 *   selected={isSelected}
 * />
 * ```
 * 
 * @param {NoteProps} props - 컴포넌트 props
 * @returns {JSX.Element} Note 컴포넌트
 */
export function Note({
  selected = false,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onFocus,
  onBlur,
  onClick,
  className = '',
  placeholder = NOTE_PLACEHOLDER,
  parts = [],
  modelName = '모델',
  exportContainerRef,
}: NoteProps) {
  const MarkdownHeading = Heading.extend({
    addInputRules() {
      return [
        textblockTypeInputRule({
          find: /^(#{1,6})\s$/,
          type: this.type,
          getAttributes: (match: string[]) => ({
            level: match[1].length,
          }),
        }),
      ];
    },
    renderHTML({ node, HTMLAttributes }) {
      const level = node.attrs.level as number;
      const className =
        level === 1
          ? 'text-h-xl font-weight-semibold text-text-title'
          : level === 2
            ? 'text-h-lg font-weight-semibold text-text-title'
            : level === 3
              ? 'text-h-md font-weight-semibold text-text-title'
              : level === 4
                ? 'text-h-sm font-weight-semibold text-text-title'
                : 'text-b-lg font-weight-semibold text-text-title';
      return [`h${level}`, mergeAttributes(HTMLAttributes, { class: className }), 0];
    },
  });
  const MentionHighlight = Mark.create({
    name: 'mentionHighlight',
    addAttributes() {
      return {
        style: {
          default:
            'background-color: rgba(197, 255, 0, 0.2); color: var(--color-text-title); padding: 0 4px; border-radius: 4px;',
        },
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-mention-highlight]' }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, { 'data-mention-highlight': 'true' }),
        0,
      ];
    },
  });
  /** 비제어형 컴포넌트용 내부 텍스트 상태 */
  const [internalValue, setInternalValue] = useState(defaultValue);
  /** 텍스트 영역의 포커스 상태 */
  const [isFocused, setIsFocused] = useState(false);
  /** 에디터 래퍼 DOM 참조 */
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    from: number;
    to: number;
    top: number;
    left: number;
  }>({
    open: false,
    query: '',
    from: 0,
    to: 0,
    top: 0,
    left: 0,
  });
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    query: string;
    from: number;
    to: number;
    top: number;
    left: number;
  }>({
    open: false,
    query: '',
    from: 0,
    to: 0,
    top: 0,
    left: 0,
  });

  /** 제어형 컴포넌트인지 여부 */
  const isControlled = controlledValue !== undefined;
  /** 현재 사용할 텍스트 값 (제어형이면 props, 아니면 내부 상태) */
  const value = isControlled ? controlledValue : internalValue;

  const isHtmlLike = useCallback((input: string) => /<\/?[a-z][\s\S]*>/i.test(input), []);

  const markdownToHtml = useCallback((markdown: string) => {
    if (!markdown) return '';
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        blocks.push('');
        return;
      }
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        blocks.push(`<h${level}>${content}</h${level}>`);
        return;
      }
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      blocks.push(`<p>${escaped}</p>`);
    });
    return blocks.filter((block) => block !== '').join('');
  }, []);

  const serializeMarkdown = useCallback((editorInstance: Editor) => {
    const serializer = new MarkdownSerializer(
      defaultMarkdownSerializer.nodes,
      {
        ...defaultMarkdownSerializer.marks,
        mentionHighlight: {
          open: '',
          close: '',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
      }
    );
    return serializer.serialize(editorInstance.state.doc);
  }, []);

  const normalizeContent = useCallback(
    (input: string) => {
      if (!input) return '';
      if (isHtmlLike(input)) return input;
      return markdownToHtml(input);
    },
    [isHtmlLike, markdownToHtml]
  );

  const editor = useEditor({
    immediatelyRender: false, // SSR hydration 문제 방지
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      MarkdownHeading.configure({
        levels: NOTE_HEADING_LEVELS,
      }),
      MentionHighlight,
      Placeholder.configure({
        placeholder,
        showOnlyCurrent: true,
      }),
    ],
    content: normalizeContent(value ?? ''),
    editorProps: {
      attributes: {
        class: 'note-editor w-full outline-none text-text-title text-b-lg leading-relaxed',
        style: `min-height: ${NOTE_EDITOR_CONTENT_MIN_HEIGHT_PX}px;`,
      },
      handleKeyDown: (_view, event): boolean => {
        const current = editorInstanceRef.current;
        if (!current) return false;
        if (event.key === 'Tab') {
          event.preventDefault();
          if (current.isActive('listItem')) {
            if (event.shiftKey) {
              return current.commands.liftListItem('listItem');
            }
            return current.commands.sinkListItem('listItem');
          }
          return current.commands.insertContent('  ');
        }
        if (event.key === 'Escape' && slashState.open) {
          setSlashState((prev) => ({ ...prev, open: false, query: '' }));
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor }) => {
      editorInstanceRef.current = editor;
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      const markdown = serializeMarkdown(editor);
      if (!isControlled) {
        setInternalValue(markdown);
      }
      onChange?.(markdown);

      const { state, view } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - NOTE_TEXT_LOOKBACK),
        from,
        '\n',
        '\n'
      );
      const slashMatch = textBefore.match(/(?:^|\s)\/([^\s]*)$/);
      const mentionMatch = textBefore.match(/(?:^|\s)@([^\s]*)$/);
      if (mentionMatch) {
        const query = mentionMatch[1] ?? '';
        const mentionFrom = from - query.length - 1;
        const mentionTo = from;
        const coords = view.coordsAtPos(from);
        const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
        const top = wrapperRect
          ? coords.bottom - wrapperRect.top + editorWrapperRef.current!.scrollTop
          : coords.bottom;
        const left = wrapperRect ? coords.left - wrapperRect.left : coords.left;
        setMentionState({
          open: true,
          query,
          from: mentionFrom,
          to: mentionTo,
          top: top + NOTE_MENU_OFFSET_PX,
          left,
        });
        if (slashState.open) {
          setSlashState((prev) => ({ ...prev, open: false, query: '' }));
        }
      } else if (slashMatch) {
        const query = slashMatch[1] ?? '';
        const slashFrom = from - query.length - 1;
        const slashTo = from;
        const coords = view.coordsAtPos(from);
        const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
        const top = wrapperRect
          ? coords.bottom - wrapperRect.top + editorWrapperRef.current!.scrollTop
          : coords.bottom;
        const left = wrapperRect ? coords.left - wrapperRect.left : coords.left;
        setSlashState({
          open: true,
          query,
          from: slashFrom,
          to: slashTo,
          top: top + NOTE_MENU_OFFSET_PX,
          left,
        });
        if (mentionState.open) {
          setMentionState((prev) => ({ ...prev, open: false, query: '' }));
        }
      } else {
        if (slashState.open) {
          setSlashState((prev) => ({ ...prev, open: false, query: '' }));
        }
        if (mentionState.open) {
          setMentionState((prev) => ({ ...prev, open: false, query: '' }));
        }
      }
    },
    onFocus: () => {
      setIsFocused(true);
      onFocus?.();
    },
    onBlur: () => {
      setIsFocused(false);
      onBlur?.();
    },
  });

  /**
   * selected prop이 변경되면 텍스트 영역에 자동 포커스
   * 외부에서 노트를 선택했을 때 자동으로 입력 가능한 상태로 만듭니다.
   */
  useEffect(() => {
    if (selected && editor) {
      editor.commands.focus('end');
    }
  }, [selected, editor]);

  useEffect(() => {
    if (!editor) return;
    const nextContent = normalizeContent(value ?? '');
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, value, normalizeContent]);

  useEffect(() => {
    if (!exportContainerRef) return;
    exportContainerRef.current = editorWrapperRef.current;
    return () => {
      exportContainerRef.current = null;
    };
  }, [exportContainerRef]);

  /**
   * 텍스트 변경 핸들러
   * 비제어형 컴포넌트인 경우 내부 상태를 업데이트하고, onChange 콜백을 호출합니다.
   */
  /**
   * 현재 상태(선택, 포커스, 기본)에 따른 테두리 색상 결정
   * @returns {string} CSS 변수로 표현된 테두리 색상
   */
  const getBorderColor = () => {
    if (selected || isFocused) {
      return 'var(--color-border-focus)';
    }
    return 'var(--color-border-default)';
  };

  return (
    <div
      className={`
        bg-bg-default
        rounded-2xl
        p-6
        min-h-0
        transition-all duration-200
        border border-border-default
        ${className}
      `}
    >
      <h3 className="text-h-md font-weight-semibold text-b-md--line-height mb-3">
        Note
      </h3>

      {/* 사용 안내 문구 */}
      <p className="text-b-lg font-weight-regular text-sub3 mb-2">
        학습 내용을 자유롭게 적어보세요!
      </p>

      {/* 텍스트 입력 영역: 사용자가 메모를 작성하는 textarea */}
      <div
        className={`
          w-full
          ${className.includes('flex-1') ? 'flex-1 min-h-0' : ''}
          p-4
          rounded-2xl
          bg-bg-sub
          text-text-title
          text-b-lg
          custom-scrollbar
          overflow-y-auto
          transition-all duration-200
          focus:outline-none
          ${isFocused ? 'note-editor-focused' : ''}
        `}
        onClick={onClick}
        ref={editorWrapperRef}
        style={{
          position: 'relative',
          border: `1px solid ${getBorderColor()}`,
          minHeight: className.includes('flex-1') ? undefined : NOTE_EDITOR_MIN_HEIGHT_PX,
        }}
      >
        {editor ? (
          <>
            <EditorContent editor={editor} />
            {slashState.open && (
              <SlashMenu
                editor={editor}
                query={slashState.query}
                position={{ top: slashState.top, left: slashState.left }}
                range={{ from: slashState.from, to: slashState.to }}
                onClose={() => setSlashState((prev) => ({ ...prev, open: false, query: '' }))}
                onOpenMention={() => {
                  const coords = editor.view.coordsAtPos(editor.state.selection.from);
                  const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
                  const top = wrapperRect
                    ? coords.bottom - wrapperRect.top + editorWrapperRef.current!.scrollTop
                    : coords.bottom;
                  const left = wrapperRect ? coords.left - wrapperRect.left : coords.left;
                  setMentionState({
                    open: true,
                    query: '',
                    from: editor.state.selection.from,
                    to: editor.state.selection.from,
                    top: top + NOTE_MENU_OFFSET_PX,
                    left,
                  });
                }}
              />
            )}
            {mentionState.open && (
              <MentionMenu
                editor={editor}
                parts={parts}
                query={mentionState.query}
                position={{ top: mentionState.top, left: mentionState.left }}
                range={{ from: mentionState.from, to: mentionState.to }}
                onClose={() => setMentionState((prev) => ({ ...prev, open: false, query: '' }))}
                modelName={modelName}
              />
            )}
          </>
        ) : (
          !value && <p className="text-placeholder select-none">{placeholder}</p>
        )}
      </div>
    </div>
  );
}

