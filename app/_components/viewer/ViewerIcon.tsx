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
  /**
   * 커스텀 배경색 (CSS 변수 또는 색상 값)
   */
  backgroundColor?: string;
  /**
   * 커스텀 아이콘 색상 (CSS 변수 또는 색상 값)
   */
  iconColor?: string;
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
  backgroundColor,
  iconColor,
}: ViewerIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 상태에 따른 CSS 변수 결정
  const getColorClasses = () => {
    if (selected) {
      return {
        border: 'var(--color-border-focus)',
        icon: iconColor || 'var(--color-border-focus)',
      };
    }
    // 호버와 기본 상태는 아이콘 색상이 동일, 보더만 다름
    const defaultIconColor = iconColor || 'var(--color-sub)';
    if (isHovered) {
      return {
        border: 'var(--color-border-hovered)',
        icon: defaultIconColor,
      };
    }
    return {
      border: 'var(--color-border-default)',
      icon: defaultIconColor,
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

    // icon이 ReactElement인 경우 색상과 크기 주입
    if (React.isValidElement(icon)) {
      const iconProps = (icon as React.ReactElement<any>).props;
      // 항상 color와 size prop을 전달
      return React.cloneElement(icon as React.ReactElement<any>, {
        color: colors.icon,
        size: iconSize,
        ...iconProps,
      });
    }

    return icon;
  };

  const bgColor = backgroundColor || 'var(--color-grass-green-0)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        ${selected ? 'cursor-default' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `1px solid ${colors.border}`,
        backgroundColor: bgColor,
      }}
      aria-label={ariaLabel}
    >
      <div style={{ color: colors.icon }}>
        {renderIcon()}
      </div>
    </button>
  );
}
