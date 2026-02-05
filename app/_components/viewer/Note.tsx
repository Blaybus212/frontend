'use client';

import React, { useState, useRef, useEffect } from 'react';

interface NoteProps {
  /**
   * 노트의 선택/활성 상태
   * - true: 선택된 상태 (밝은 테두리)
   * - false: 기본 상태
   */
  selected?: boolean;
  /**
   * 제어 컴포넌트용 값
   */
  value?: string;
  /**
   * 초기 값 (비제어 컴포넌트용)
   */
  defaultValue?: string;
  /**
   * 값 변경 핸들러
   */
  onChange?: (value: string) => void;
  /**
   * 포커스 핸들러
   */
  onFocus?: () => void;
  /**
   * 블러 핸들러
   */
  onBlur?: () => void;
  /**
   * 클릭 핸들러
   */
  onClick?: () => void;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 플레이스홀더 텍스트
   * @default "메모를 입력하세요..."
   */
  placeholder?: string;
}

/**
 * Note 컴포넌트
 * 학습 내용을 자유롭게 작성할 수 있는 텍스트 입력 컴포넌트
 * 
 * 모든 색상은 globals.css의 CSS 변수를 사용합니다.
 */
export function Note({
  selected = false,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onFocus,
  onBlur,
  onClick,
  className = '',
  placeholder = '메모를 입력하세요...',
}: NoteProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 제어 컴포넌트인지 확인
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  // 외부에서 selected prop이 변경되면 포커스 처리
  useEffect(() => {
    if (selected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selected]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.();
  };

  // 상태에 따른 테두리 색상 결정
  const getBorderColor = () => {
    if (selected || isFocused) {
      return 'var(--color-border-focus)';
    }
    return 'var(--color-border-default)';
  };

  return (
    <div
      className={`
        bg-bg-default
        rounded-2xl
        p-6
        transition-all duration-200
        border border-border-default
        ${className}
      `}
    >
      {/* 제목 */}
      <h3 className="text-h-md font-weight-semibold text-b-md--line-height mb-3">
        Note
      </h3>

      {/* 부제목/안내 */}
      <p className="text-b-lg font-weight-regular text-sub3 mb-2">
        학습 내용을 자유롭게 적어보세요!
      </p>

      {/* 텍스트 입력 영역 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={onClick}
        placeholder={placeholder}
        className="
          w-full
          min-h-[200px]
          p-4
          rounded-2xl
          bg-bg-sub
          text-text-title
          text-b-lg
          placeholder:text-placeholder
          resize-none
          transition-all duration-200
          focus:outline-none
        "
        style={{
          border: `1px solid ${getBorderColor()}`,
        }}
      />
    </div>
  );
}

