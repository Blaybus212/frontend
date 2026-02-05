'use client';

import React, { useState, useRef, useEffect } from 'react';

interface QuizInputProps {
  /** 입력값 (제어형) */
  value?: string;
  /** 기본값 (비제어형) */
  defaultValue?: string;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 변경 핸들러 */
  onChange?: (value: string) => void;
  /** 포커스 핸들러 */
  onFocus?: () => void;
  /** 블러 핸들러 */
  onBlur?: () => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 퀴즈 입력 필드 컴포넌트
 * 기본 상태: 어두운 배경, 회색 보더
 * 포커스 상태: 노란색 보더
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
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.();
  };

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
