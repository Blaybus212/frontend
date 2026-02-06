'use client';

import React from 'react';

/**
 * QuizButton 컴포넌트의 Props 인터페이스
 * @interface QuizButtonProps
 * @property {string} label - 버튼에 표시될 텍스트
 * @property {boolean} [selected=false] - 버튼의 선택 상태 (true일 경우 노란색 배경)
 * @property {() => void} [onClick] - 버튼 클릭 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 */
interface QuizButtonProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * 퀴즈 선택 버튼 컴포넌트
 * 
 * 퀴즈에서 선택지를 표시하는 버튼입니다. 선택 상태에 따라 스타일이 변경됩니다.
 * 
 * **상태별 스타일:**
 * - 기본/호버: 어두운 배경(bg-default), 회색 테두리, 밝은 회색 텍스트
 * - 선택: 노란색 배경(point-500), 검은색 텍스트
 * 
 * **사용 예시:**
 * ```tsx
 * <QuizButton
 *   label="선택지 1"
 *   selected={selectedId === 'option1'}
 *   onClick={() => handleSelect('option1')}
 * />
 * ```
 * 
 * @param {QuizButtonProps} props - 컴포넌트 props
 * @returns {JSX.Element} QuizButton 컴포넌트
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
