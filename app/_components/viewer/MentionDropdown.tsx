'use client';

import { useState } from 'react';

export type MentionItem = {
  id: string;
  korean: string;
  english: string;
};

interface MentionDropdownProps {
  /** 선택 가능한 항목 리스트 */
  items?: MentionItem[];
  /** 현재 선택된 항목 id (제어용) */
  selectedItemId?: string;
  /** 항목 선택 시 호출 */
  onSelectItem?: (itemId: string) => void;
  /** 최대 높이 (기본값: 200px) */
  maxHeight?: number;
}

const DEFAULT_ITEMS: MentionItem[] = [
  { id: 'robot-arm', korean: '로봇 팔', english: 'Robot arm' },
  { id: 'end-effector', korean: '엔드 이펙터', english: 'End effector' },
  { id: 'joint-motor', korean: '관절 모터', english: 'Joint motor' },
  { id: 'base-plate', korean: '베이스 플레이트', english: 'Base plate' },
];

export function MentionDropdown({
  items = DEFAULT_ITEMS,
  selectedItemId,
  onSelectItem,
  maxHeight = 200,
}: MentionDropdownProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const isControlled = selectedItemId !== undefined;
  const currentSelectedId = isControlled ? selectedItemId : internalSelectedId;

  const handleSelect = (itemId: string) => {
    if (!isControlled) {
      setInternalSelectedId(itemId);
    }
    onSelectItem?.(itemId);
  };

  return (
    <div
        className="w-[267px] h-[195px] bg-bg-default rounded-xl border border-border-default overflow-hidden"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <div className="overflow-y-auto custom-scrollbar px-1 py-1" style={{ maxHeight: `${maxHeight}px` }}>
          {items.map((item) => {
            const isSelected = currentSelectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`
                  w-full h-[52px] my-1 px-3 text-left transition-colors duration-150 rounded-xl
                  flex flex-col items-start justify-center
                  ${isSelected ? 'bg-bg-sub' : 'bg-bg-default hover:bg-bg-sub'}
                `}
              >
                <div className="text-b-md font-weight-semibold text-text-title">
                  {item.korean}
                </div>
                <div className="text-b-sm font-weight-regular text-sub3 mt-0.5">
                  {item.english}
                </div>
              </button>
            );
          })}
        </div>
      </div>
  );
}
