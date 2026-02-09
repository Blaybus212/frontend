'use client';

import { useEffect, useRef } from 'react';
import type { SelectablePart } from '@/app/_components/3d/types';

interface AiMentionMenuProps {
  parts: SelectablePart[];
  query: string;
  position: { top: number; left: number };
  onSelect: (part: SelectablePart) => void;
  onClose: () => void;
  modelName: string;
}

/**
 * AI 패널 멘션 드롭다운
 * @ 입력 시 부품 목록 표시
 */
export function AiMentionMenu({
  parts,
  query,
  position,
  onSelect,
  onClose,
  modelName,
}: AiMentionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 검색어로 부품 필터링
  const filtered = parts.filter((part) => {
    const searchText = query.toLowerCase();
    const nameMatch = part.nodeName?.toLowerCase().includes(searchText);
    const originalMatch = part.originalName?.toLowerCase().includes(searchText);
    return nameMatch || originalMatch;
  });

  // 모델 전체 선택 옵션
  const showModel = !query || modelName.toLowerCase().includes(query.toLowerCase());

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-64 rounded-xl border border-border-default bg-bg-default shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
        {showModel && (
          <li>
            <button
              type="button"
              onClick={() => {
                // 모델 전체 선택 시에는 특별한 처리 필요하면 추가
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-b-sm text-text-title hover:bg-bg-hovered transition-colors"
            >
              {modelName}
            </button>
          </li>
        )}
        {filtered.length === 0 && !showModel ? (
          <li className="px-3 py-2 text-b-sm text-sub3">부품 없음</li>
        ) : (
          filtered.map((part) => (
            <li key={part.nodeId}>
              <button
                type="button"
                onClick={() => onSelect(part)}
                className="w-full text-left px-3 py-2 hover:bg-bg-hovered transition-colors"
              >
                <div className="text-b-sm text-text-title">{part.originalName}</div>
                <div className="text-b-xs text-sub3">{part.nodeName}</div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
