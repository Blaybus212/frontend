'use client';

import { useState } from 'react';

type QuizType = {
  id: string;
  label: string;
  description?: string;
};

interface QuizModalProps {
  /** 선택 가능한 퀴즈 유형 리스트 */
  quizTypes?: QuizType[];
  /** 현재 선택된 퀴즈 유형 id (제어용) */
  selectedQuizTypeId?: string;
  /** 퀴즈 유형 선택 시 호출 */
  onSelectQuizType?: (id: string) => void;
  /**
   * 퀴즈 시작 중 여부
   * - true: 버튼 비활성화 + "퀴즈 풀기..." 텍스트
   * - false: 항상 노란색 활성 버튼
   */
  isStarting?: boolean;
  /** 퀴즈 풀기 버튼 클릭 시 호출 */
  onStartQuizClick?: (selectedId: string | null) => void;
}

const DEFAULT_QUIZ_TYPES: QuizType[] = [
  { id: 'naming-structure', label: '명칭 및 구조 파악' },
  { id: 'mechanism', label: '작동 원리 및 메커니즘' },
  { id: 'ai-review', label: 'AI 대화 기반 나의 취약점 공략' },
];

export function QuizModal({
  quizTypes = DEFAULT_QUIZ_TYPES,
  selectedQuizTypeId,
  onSelectQuizType,
  isStarting = false,
  onStartQuizClick,
}: QuizModalProps) {
  // 첫 렌더링 시에는 어떤 퀴즈 유형도 선택되지 않은 상태로 시작
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const isControlled = selectedQuizTypeId !== undefined;
  const currentSelectedId = isControlled ? selectedQuizTypeId : internalSelectedId;

  const handleSelect = (id: string) => {
    if (!isControlled) {
      setInternalSelectedId(id);
    }
    onSelectQuizType?.(id);
  };

  const baseOptionButton =
    'h-[32px] w-full px-3 text-b-sm font-weight-regular rounded-lg border border-border-default text-left transition-colors duration-150';

  const getOptionClass = (selected: boolean) =>
    selected
      ? 'bg-point-500 text-base-black'
      : 'bg-bg-sub text-sub';

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border 0.8px solid border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-b-md font-weight-semibold text-text-title">퀴즈를 풀러 가볼까요?</h2>
        <button
          type="button"
          className="w-[22px] h-[22px] flex items-center justify-center border border-border-default rounded-full bg-bg-sub text-text-sub3 text-b-md hover:bg-bg-hovered transition-colors"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      {/* 풀어볼 문제 유형 */}
      <section className="space-y-3">
        <p className="text-b-sm font-weight-regular text-sub2">풀어볼 문제 유형</p>

        <div className="space-y-2">
          {quizTypes.map((type) => {
            const selected = currentSelectedId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={`${baseOptionButton} ${getOptionClass(selected)}`}
                onClick={() => handleSelect(type.id)}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 퀴즈 풀기 버튼 */}
      <button
        type="button"
        disabled={isStarting || !currentSelectedId}
        onClick={() => onStartQuizClick?.(currentSelectedId ?? null)}
        className={`
          w-full py-3 text-b-sm font-semibold rounded-xl
          transition-all active:scale-[0.98]
          bg-point-500 text-base-black hover:bg-selected
          disabled:bg-bg-sub disabled:text-sub disabled:cursor-not-allowed
        `}
      >
        {isStarting ? '퀴즈 풀기...' : '퀴즈 풀기'}
      </button>
    </div>
  );
}

