'use client';

import React from 'react';

/**
 * QuizSubmitButton 컴포넌트의 Props 인터페이스
 * @interface QuizSubmitButtonProps
 * @property {string} [label='제출하기'] - 버튼에 표시될 텍스트
 * @property {boolean} [enabled=false] - 버튼 활성화 상태 (true일 경우 클릭 가능)
 * @property {boolean} [isSubmitting=false] - 제출 진행 중 여부 (true일 경우 "제출 중..." 텍스트 표시 및 비활성화)
 * @property {() => void} [onClick] - 버튼 클릭 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 */
interface QuizSubmitButtonProps {
  label?: string;
  enabled?: boolean;
  isSubmitting?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * 퀴즈 제출 버튼 컴포넌트
 * 
 * 퀴즈 답안을 제출하는 버튼입니다. 활성화 상태와 제출 진행 상태에 따라 스타일과 동작이 변경됩니다.
 * 
 * **상태별 스타일:**
 * - 비활성: 어두운 배경(bg-sub), 밝은 회색 텍스트(sub), 커서 not-allowed
 * - 활성: 노란색 배경(point-500), 검은색 텍스트, 호버 시 선택 색상
 * - 제출 중: 비활성 상태와 동일하며 "제출 중..." 텍스트 표시
 * 
 * **사용 예시:**
 * ```tsx
 * <QuizSubmitButton
 *   label="제출하기"
 *   enabled={hasAnswer}
 *   isSubmitting={isSubmitting}
 *   onClick={handleSubmit}
 * />
 * ```
 * 
 * @param {QuizSubmitButtonProps} props - 컴포넌트 props
 * @returns {JSX.Element} QuizSubmitButton 컴포넌트
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
