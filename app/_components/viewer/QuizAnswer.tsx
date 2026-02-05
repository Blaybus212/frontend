'use client';

import React from 'react';

interface QuizAnswerProps {
  /** 정답 텍스트 */
  answer: string;
  /** 표시 여부 */
  visible?: boolean;
  /** 이 답이 정답인지 여부 */
  isCorrect?: boolean;
  /** 사용자가 이 답을 선택했는지 여부 */
  isSelected?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 퀴즈 정답 표시 컴포넌트
 * - 정답: sub-green 보더
 * - 선택한 오답: sub-red 보더
 * - 기본: 기본 보더
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

  // 보더 색상 결정
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
