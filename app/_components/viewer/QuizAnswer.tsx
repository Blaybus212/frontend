'use client';

import React from 'react';

/**
 * QuizAnswer 컴포넌트의 Props 인터페이스
 * @interface QuizAnswerProps
 * @property {string} answer - 표시할 정답 텍스트
 * @property {boolean} [visible=true] - 컴포넌트 표시 여부 (false일 경우 렌더링되지 않음)
 * @property {boolean} [isCorrect=false] - 이 답이 정답인지 여부 (true일 경우 초록색 테두리)
 * @property {boolean} [isSelected=false] - 사용자가 이 답을 선택했는지 여부 (오답 선택 시 빨간색 테두리)
 * @property {string} [className=''] - 추가 CSS 클래스명
 */
interface QuizAnswerProps {
  answer: string;
  visible?: boolean;
  isCorrect?: boolean;
  isSelected?: boolean;
  className?: string;
}

/**
 * 퀴즈 정답 표시 컴포넌트
 * 
 * 퀴즈의 정답을 표시하는 컴포넌트입니다. 정답 여부와 사용자 선택 여부에 따라 테두리 색상이 변경됩니다.
 * 
 * **상태별 스타일:**
 * - 정답: 초록색 테두리(sub-green)
 * - 선택한 오답: 빨간색 테두리(sub-red)
 * - 기본: 회색 테두리(border-default)
 * 
 * **사용 예시:**
 * ```tsx
 * <QuizAnswer
 *   answer="정답입니다"
 *   isCorrect={true}
 *   isSelected={userSelectedThis}
 *   visible={showAnswer}
 * />
 * ```
 * 
 * @param {QuizAnswerProps} props - 컴포넌트 props
 * @returns {JSX.Element | null} QuizAnswer 컴포넌트 또는 null (visible이 false일 때)
 */
export function QuizAnswer({
  answer,
  visible = true,
  isCorrect = false,
  isSelected = false,
  className = '',
}: QuizAnswerProps) {
  if (!visible) {
    return null;
  }

  /**
   * 현재 상태(정답, 선택한 오답, 기본)에 따른 테두리 색상 결정
   * @returns {string} CSS 변수로 표현된 테두리 색상
   */
  const getBorderColor = () => {
    if (isCorrect) {
      return 'var(--color-sub-green)';
    }
    if (isSelected && !isCorrect) {
      return 'var(--color-sub-red)';
    }
    return 'var(--color-border-default)';
  };

  return (
    <div
      className={`
        w-full px-4 py-3 rounded-xl
        bg-bg-default
        text-sub2 text-b-md font-weight-semibold
        border
        ${className}
      `}
      style={{
        borderColor: getBorderColor(),
      }}
    >
      {answer}
    </div>
  );
}
