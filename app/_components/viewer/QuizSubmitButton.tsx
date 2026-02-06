'use client';

import React from 'react';

interface QuizSubmitButtonProps {
  /** 버튼 텍스트 */
  label?: string;
  /** 활성화 상태 여부 */
  enabled?: boolean;
  /** 제출 중 여부 */
  isSubmitting?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 퀴즈 제출 버튼 컴포넌트
 * 비활성 상태: 어두운 배경, 밝은 회색 텍스트
 * 활성 상태: 노란색 배경, 검은색 텍스트
 */
export function QuizSubmitButton({
  label = '제출하기',
  enabled = false,
  isSubmitting = false,
  onClick,
  className = '',
}: QuizSubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled || isSubmitting}
      className={`
        w-full py-3 rounded-xl
        text-b-md font-weight-semibold
        transition-colors duration-150
        ${
          enabled && !isSubmitting
            ? 'bg-point-500 text-base-black hover:bg-selected'
            : 'bg-bg-sub text-sub cursor-not-allowed'
        }
        ${className}
      `}
    >
      {isSubmitting ? '제출 중...' : label}
    </button>
  );
}
