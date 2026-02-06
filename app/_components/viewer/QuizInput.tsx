'use client';

import React, { useState, useRef } from 'react';

/**
 * QuizInput 컴포넌트의 Props 인터페이스
 * @interface QuizInputProps
 * @property {string} [value] - 제어형 컴포넌트용 입력값
 * @property {string} [defaultValue=''] - 비제어형 컴포넌트용 초기값
 * @property {string} [placeholder='단어를 입력하세요!'] - 플레이스홀더 텍스트
 * @property {(value: string) => void} [onChange] - 입력값 변경 시 호출되는 콜백 함수
 * @property {() => void} [onFocus] - 입력 필드 포커스 시 호출되는 콜백 함수
 * @property {() => void} [onBlur] - 입력 필드 포커스 해제 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 */
interface QuizInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

/**
 * 퀴즈 입력 필드 컴포넌트
 * 
 * 퀴즈에서 사용자가 답을 입력할 수 있는 텍스트 입력 필드입니다.
 * 제어형/비제어형 컴포넌트 모두 지원하며, 포커스 상태에 따라 테두리 색상이 변경됩니다.
 * 
 * **상태별 스타일:**
 * - 기본: 어두운 배경(bg-sub), 회색 테두리(border-default)
 * - 포커스: 노란색 테두리(border-focus)
 * 
 * **사용 예시:**
 * ```tsx
 * // 비제어형 컴포넌트
 * <QuizInput
 *   defaultValue=""
 *   placeholder="답을 입력하세요"
 *   onChange={(value) => console.log(value)}
 * />
 * 
 * // 제어형 컴포넌트
 * <QuizInput
 *   value={answer}
 *   onChange={setAnswer}
 * />
 * ```
 * 
 * @param {QuizInputProps} props - 컴포넌트 props
 * @returns {JSX.Element} QuizInput 컴포넌트
 */
export function QuizInput({
  value: controlledValue,
  defaultValue = '',
  placeholder = '단어를 입력하세요!',
  onChange,
  onFocus,
  onBlur,
  className = '',
}: QuizInputProps) {
  /** 비제어형 컴포넌트용 내부 입력값 상태 */
  const [internalValue, setInternalValue] = useState(defaultValue);
  /** 입력 필드의 포커스 상태 */
  const [isFocused, setIsFocused] = useState(false);
  /** 입력 필드 DOM 참조 */
  const inputRef = useRef<HTMLInputElement>(null);

  /** 제어형 컴포넌트인지 여부 */
  const isControlled = controlledValue !== undefined;
  /** 현재 사용할 입력값 (제어형이면 props, 아니면 내부 상태) */
  const value = isControlled ? controlledValue : internalValue;

  /**
   * 입력값 변경 핸들러
   * 비제어형 컴포넌트인 경우 내부 상태를 업데이트하고, onChange 콜백을 호출합니다.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  /**
   * 포커스 핸들러
   * 포커스 상태를 업데이트하고, onFocus 콜백을 호출합니다.
   */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.();
  };

  /**
   * 블러 핸들러
   * 포커스 상태를 해제하고, onBlur 콜백을 호출합니다.
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.();
  };

  /**
   * 현재 상태(포커스, 기본)에 따른 테두리 색상 결정
   * @returns {string} CSS 변수로 표현된 테두리 색상
   */
  const getBorderColor = () => {
    if (isFocused) {
      return 'var(--color-border-focus)';
    }
    return 'var(--color-border-default)';
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 rounded-xl
        bg-bg-sub
        text-text-title text-b-md
        placeholder:text-placeholder
        border transition-colors duration-150
        focus:outline-none
        ${className}
      `}
      style={{
        borderColor: getBorderColor(),
      }}
    />
  );
}
