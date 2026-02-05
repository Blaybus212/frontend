'use client';

import React, { useState, ReactNode } from 'react';

interface ViewerIconProps {
  /**
   * 아이콘의 선택 상태
   * - true: 선택된 상태 (네온 그린)
   * - false: 기본 상태
   */
  selected?: boolean;
  /**
   * 아이콘 크기 (px)
   * @default 54
   */
  size?: number;
  /**
   * 클릭 핸들러
   */
  onClick?: () => void;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 아이콘 컴포넌트
   * 색상은 자동으로 상태에 따라 적용됩니다.
   */
  icon?: ReactNode;
  /**
   * aria-label
   */
  'aria-label'?: string;
}

/**
 * Viewer 아이콘 컴포넌트
 * 기본, 호버, 선택 상태를 지원하는 원형 아이콘 버튼
 * 
 * 모든 색상은 globals.css의 CSS 변수를 사용합니다.
 */
export function ViewerIcon({
  selected = false,
  size = 54,
  onClick,
  className = '',
  icon,
  'aria-label': ariaLabel = 'Viewer 아이콘',
}: ViewerIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 상태에 따른 CSS 변수 결정
  const getColorClasses = () => {
    if (selected) {
      return {
        border: 'var(--color-border-focus)',
        icon: 'var(--color-border-focus)',
      };
    }
    if (isHovered) {
      return {
        border: 'var(--color-border-hovered)',
        icon: 'var(--color-description)',
      };
    }
    return {
      border: 'var(--color-border-default)',
      icon: 'var(--color-sub3)',
    };
  };

  const colors = getColorClasses();
  const iconSize = size * 0.5; // 아이콘은 원의 절반 크기

  // 아이콘이 제공되지 않으면 기본 집 아이콘 사용
  const defaultIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 집 아이콘 - 삼각형 지붕과 사각형 몸체, 중앙 문 */}
      <path
        d="M12 3L3 10V20H9V14H15V20H21V10L12 3Z"
        stroke={colors.icon}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 문 */}
      <rect
        x="9"
        y="14"
        width="6"
        height="6"
        stroke={colors.icon}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );

  // 아이콘에 색상 적용
  const renderIcon = () => {
    if (!icon) {
      return defaultIcon;
    }

    // icon이 ReactElement이고 color prop을 받을 수 있는 경우
    if (React.isValidElement(icon)) {
      const iconProps = (icon as React.ReactElement<any>).props;
      // color prop이 있는 경우 색상 주입
      if (typeof iconProps === 'object' && 'color' in iconProps) {
        return React.cloneElement(icon as React.ReactElement<any>, {
          color: colors.icon,
          size: iconSize,
        });
      }
      // color prop이 없는 경우 style로 주입 시도
      return React.cloneElement(icon as React.ReactElement<any>, {
        style: {
          ...iconProps?.style,
          color: colors.icon,
        },
        size: iconSize,
      });
    }

    return icon;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        bg-grass-green-0
        ${selected ? 'cursor-default' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `1px solid ${colors.border}`,
      }}
      aria-label={ariaLabel}
    >
      {renderIcon()}
    </button>
  );
}
