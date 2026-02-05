'use client';

import React from 'react';

interface QuizButtonProps {
  /** 버튼 텍스트 */
  label: string;
  /** 선택된 상태 여부 */
  selected?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 퀴즈 선택 버튼 컴포넌트
 * 기본/호버 상태: 어두운 배경, 밝은 텍스트
 * 선택 상태: 노란색 배경, 검은색 텍스트
 */
export function QuizButton({
  label,
  selected = false,
  onClick,
  className = '',
}: QuizButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full h-[44px] px-4 rounded-xl
        text-b-md font-weight-semibold
        transition-colors duration-150
        flex items-center justify-start
        ${
          selected
            ? 'bg-point-500 text-base-black'
            : 'bg-bg-default border border-border-default text-sub2 hover:bg-bg-hovered'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
}
