'use client';

import { useState } from 'react';

/**
 * 멘션 항목 데이터 구조
 * @typedef {Object} MentionItem
 * @property {string} id - 항목의 고유 식별자
 * @property {string} korean - 항목의 한글명
 * @property {string} english - 항목의 영문명
 */
export type MentionItem = {
  id: string;
  korean: string;
  english: string;
};

/**
 * MentionDropdown 컴포넌트의 Props 인터페이스
 * @interface MentionDropdownProps
 * @property {MentionItem[]} [items] - 선택 가능한 항목 리스트 (기본값: DEFAULT_ITEMS)
 * @property {string} [selectedItemId] - 현재 선택된 항목 id (제어형 컴포넌트 사용 시 필수)
 * @property {(itemId: string) => void} [onSelectItem] - 항목 선택 시 호출되는 콜백 함수
 * @property {number} [maxHeight=200] - 드롭다운의 최대 높이 (픽셀 단위)
 */
interface MentionDropdownProps {
  items?: MentionItem[];
  selectedItemId?: string;
  onSelectItem?: (itemId: string) => void;
  maxHeight?: number;
}

/** 기본 멘션 항목 리스트 (비제어형 컴포넌트 사용 시 초기값) */
const DEFAULT_ITEMS: MentionItem[] = [
  { id: 'robot-arm', korean: '로봇 팔', english: 'Robot arm' },
  { id: 'end-effector', korean: '엔드 이펙터', english: 'End effector' },
  { id: 'joint-motor', korean: '관절 모터', english: 'Joint motor' },
  { id: 'base-plate', korean: '베이스 플레이트', english: 'Base plate' },
];

/**
 * 멘션 드롭다운 컴포넌트
 * 
 * 객체나 부품을 선택할 수 있는 드롭다운 메뉴입니다.
 * 각 항목은 한글명과 영문명을 표시하며, 선택 시 콜백 함수를 호출합니다.
 * 
 * **주요 기능:**
 * - 제어형/비제어형 컴포넌트 지원
 * - 항목 선택 및 하이라이트
 * - 스크롤 가능한 리스트
 * - 호버 효과
 * 
 * **사용 예시:**
 * ```tsx
 * // 비제어형 컴포넌트
 * <MentionDropdown
 *   items={items}
 *   onSelectItem={(id) => {
 *     // handle select
 *   }}
 * />
 * 
 * // 제어형 컴포넌트
 * <MentionDropdown
 *   items={items}
 *   selectedItemId={selectedId}
 *   onSelectItem={setSelectedId}
 * />
 * ```
 * 
 * @param {MentionDropdownProps} props - 컴포넌트 props
 * @returns {JSX.Element} MentionDropdown 컴포넌트
 */
export function MentionDropdown({
  items = DEFAULT_ITEMS,
  selectedItemId,
  onSelectItem,
  maxHeight = 200,
}: MentionDropdownProps) {
  /** 비제어형 컴포넌트용 내부 선택 상태 */
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  /** 제어형 컴포넌트인지 여부 */
  const isControlled = selectedItemId !== undefined;
  /** 현재 선택된 항목 id (제어형이면 props, 아니면 내부 상태) */
  const currentSelectedId = isControlled ? selectedItemId : internalSelectedId;

  /**
   * 항목 선택 핸들러
   * 비제어형 컴포넌트인 경우 내부 상태를 업데이트하고, onSelectItem 콜백을 호출합니다.
   * @param {string} itemId - 선택된 항목의 id
   */
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
