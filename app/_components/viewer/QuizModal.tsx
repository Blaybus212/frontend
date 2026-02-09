'use client';

import { useState } from 'react';

/**
 * 퀴즈 유형 데이터 구조
 * @typedef {Object} QuizType
 * @property {string} id - 퀴즈 유형의 고유 식별자
 * @property {string} label - 퀴즈 유형의 표시 이름
 * @property {string} [description] - 퀴즈 유형의 설명 (선택 사항)
 */
type QuizType = {
  id: string;
  label: string;
  description?: string;
};

/**
 * QuizModal 컴포넌트의 Props 인터페이스
 * @interface QuizModalProps
 * @property {QuizType[]} [quizTypes] - 선택 가능한 퀴즈 유형 리스트 (기본값: DEFAULT_QUIZ_TYPES)
 * @property {string} [selectedQuizTypeId] - 현재 선택된 퀴즈 유형 id (제어형 컴포넌트 사용 시 필수)
 * @property {(id: string) => void} [onSelectQuizType] - 퀴즈 유형 선택 시 호출되는 콜백 함수
 * @property {boolean} [isStarting=false] - 퀴즈 시작 진행 중 여부 (true일 경우 버튼 비활성화 및 "퀴즈 풀기..." 텍스트 표시)
 * @property {(selectedId: string | null) => void} [onStartQuizClick] - 퀴즈 풀기 버튼 클릭 시 호출되는 콜백 함수
 */
interface QuizModalProps {
  quizTypes?: QuizType[];
  selectedQuizTypeId?: string;
  onSelectQuizType?: (id: string) => void;
  isStarting?: boolean;
  onStartQuizClick?: (selectedId: string | null) => void;
}

/** 기본 퀴즈 유형 리스트 */
const DEFAULT_QUIZ_TYPES: QuizType[] = [
  { id: 'naming-structure', label: '명칭 및 구조 파악' },
  { id: 'mechanism', label: '작동 원리 및 메커니즘' },
  { id: 'ai-review', label: 'AI 대화 기반 나의 취약점 공략' },
];

/**
 * 퀴즈 모달 컴포넌트
 * 
 * 사용자가 풀고 싶은 퀴즈 유형을 선택하고 퀴즈를 시작할 수 있는 모달입니다.
 * 
 * **주요 기능:**
 * - 퀴즈 유형 선택 (명칭 및 구조 파악, 작동 원리 및 메커니즘, AI 대화 기반 취약점 공략)
 * - 제어형/비제어형 컴포넌트 지원
 * - 퀴즈 시작 버튼 (선택된 유형이 있을 때만 활성화)
 * - 로딩 상태 표시
 * 
 * **사용 예시:**
 * ```tsx
 * <QuizModal
 *   quizTypes={quizTypes}
 *   selectedQuizTypeId={selectedId}
 *   onSelectQuizType={setSelectedId}
 *   isStarting={isStarting}
 *   onStartQuizClick={(id) => {
 *     // 퀴즈 시작 로직 실행
 *   }}
 * />
 * ```
 * 
 * @param {QuizModalProps} props - 컴포넌트 props
 * @returns {JSX.Element} QuizModal 컴포넌트
 */
export function QuizModal({
  quizTypes = DEFAULT_QUIZ_TYPES,
  selectedQuizTypeId,
  onSelectQuizType,
  isStarting = false,
  onStartQuizClick,
}: QuizModalProps) {
  /** 비제어형 컴포넌트용 내부 선택 상태 (초기값: null, 첫 렌더링 시 선택 없음) */
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  /** 제어형 컴포넌트인지 여부 */
  const isControlled = selectedQuizTypeId !== undefined;
  /** 현재 선택된 퀴즈 유형 id (제어형이면 props, 아니면 내부 상태) */
  const currentSelectedId = isControlled ? selectedQuizTypeId : internalSelectedId;

  /**
   * 퀴즈 유형 선택 핸들러
   * 비제어형 컴포넌트인 경우 내부 상태를 업데이트하고, onSelectQuizType 콜백을 호출합니다.
   * @param {string} id - 선택된 퀴즈 유형의 id
   */
  const handleSelect = (id: string) => {
    if (!isControlled) {
      setInternalSelectedId(id);
    }
    onSelectQuizType?.(id);
  };

  /** 퀴즈 유형 선택 버튼의 기본 스타일 클래스 */
  const baseOptionButton =
    'h-[32px] w-full px-3 text-b-sm font-weight-regular rounded-lg border border-border-default text-left transition-colors duration-150';

  /**
   * 선택 상태에 따른 버튼 스타일 클래스 반환
   * @param {boolean} selected - 선택 여부
   * @returns {string} 스타일 클래스 문자열
   */
  const getOptionClass = (selected: boolean) =>
    selected
      ? 'bg-point-500 text-base-black'
      : 'bg-bg-sub text-sub';

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 모달 헤더: 제목과 닫기 버튼 */}
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

      {/* 퀴즈 유형 선택 섹션 */}
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

      {/* 퀴즈 시작 버튼: 선택된 유형이 있고 시작 중이 아닐 때만 활성화 */}
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

