'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * Note 컴포넌트의 Props 인터페이스
 * @interface NoteProps
 * @property {boolean} [selected=false] - 노트의 선택/활성 상태 (true일 경우 자동 포커스 및 밝은 테두리)
 * @property {string} [value] - 제어 컴포넌트용 텍스트 값
 * @property {string} [defaultValue=''] - 비제어 컴포넌트용 초기 텍스트 값
 * @property {(value: string) => void} [onChange] - 텍스트 값 변경 시 호출되는 콜백 함수
 * @property {() => void} [onFocus] - 텍스트 영역 포커스 시 호출되는 콜백 함수
 * @property {() => void} [onBlur] - 텍스트 영역 포커스 해제 시 호출되는 콜백 함수
 * @property {() => void} [onClick] - 텍스트 영역 클릭 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 * @property {string} [placeholder='메모를 입력하세요...'] - 플레이스홀더 텍스트
 */
interface NoteProps {
  selected?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
  className?: string;
  placeholder?: string;
}

/**
 * 메모 작성 컴포넌트
 * 
 * 사용자가 학습 내용을 자유롭게 작성할 수 있는 텍스트 입력 영역입니다.
 * 제어형/비제어형 컴포넌트 모두 지원하며, 선택 상태에 따라 자동으로 포커스됩니다.
 * 
 * **주요 기능:**
 * - 제어형/비제어형 컴포넌트 지원
 * - 선택 상태에 따른 자동 포커스
 * - 포커스/블러 상태에 따른 테두리 색상 변경
 * - 자동 높이 조절 (flex-1 클래스 사용 시)
 * 
 * **상태별 스타일:**
 * - 기본: 회색 테두리
 * - 포커스/선택: 네온 그린 테두리 (border-focus 색상)
 * 
 * **사용 예시:**
 * ```tsx
 * // 비제어형 컴포넌트
 * <Note
 *   defaultValue="초기 메모"
 *   onChange={(value) => console.log(value)}
 * />
 * 
 * // 제어형 컴포넌트
 * <Note
 *   value={noteValue}
 *   onChange={setNoteValue}
 *   selected={isSelected}
 * />
 * ```
 * 
 * @param {NoteProps} props - 컴포넌트 props
 * @returns {JSX.Element} Note 컴포넌트
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
  /** 비제어형 컴포넌트용 내부 텍스트 상태 */
  const [internalValue, setInternalValue] = useState(defaultValue);
  /** 텍스트 영역의 포커스 상태 */
  const [isFocused, setIsFocused] = useState(false);
  /** 텍스트 영역 DOM 참조 */
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** 제어형 컴포넌트인지 여부 */
  const isControlled = controlledValue !== undefined;
  /** 현재 사용할 텍스트 값 (제어형이면 props, 아니면 내부 상태) */
  const value = isControlled ? controlledValue : internalValue;

  /**
   * selected prop이 변경되면 텍스트 영역에 자동 포커스
   * 외부에서 노트를 선택했을 때 자동으로 입력 가능한 상태로 만듭니다.
   */
  useEffect(() => {
    if (selected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selected]);

  /**
   * 텍스트 변경 핸들러
   * 비제어형 컴포넌트인 경우 내부 상태를 업데이트하고, onChange 콜백을 호출합니다.
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.();
  };

  /**
   * 블러 핸들러
   * 포커스 상태를 해제하고, onBlur 콜백을 호출합니다.
   */
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.();
  };

  /**
   * 현재 상태(선택, 포커스, 기본)에 따른 테두리 색상 결정
   * @returns {string} CSS 변수로 표현된 테두리 색상
   */
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
      {/* 컴포넌트 제목 */}
      <h3 className="text-h-md font-weight-semibold text-b-md--line-height mb-3">
        Note
      </h3>

      {/* 사용 안내 문구 */}
      <p className="text-b-lg font-weight-regular text-sub3 mb-2">
        학습 내용을 자유롭게 적어보세요!
      </p>

      {/* 텍스트 입력 영역: 사용자가 메모를 작성하는 textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={onClick}
        placeholder={placeholder}
        className={`
          w-full
          ${className.includes('flex-1') ? 'flex-1' : 'min-h-[200px]'}
          p-4
          rounded-2xl
          bg-bg-sub
          text-text-title
          text-b-lg
          placeholder:text-placeholder
          resize-none
          transition-all duration-200
          focus:outline-none
        `}
        style={{
          border: `1px solid ${getBorderColor()}`,
        }}
      />
    </div>
  );
}

