'use client';

import React, { useState, ReactNode } from 'react';

interface ViewerIconProps {
  selected?: boolean;
  size?: number;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  'aria-label'?: string;
  tooltip?: string;
  backgroundColor?: string;
  iconColor?: string;
}

/** 뷰어 사이드바 원형 아이콘 버튼 (선택/호버 시 테두리 색상 변경) */
export function ViewerIcon({
  selected = false,
  size = 54,
  onClick,
  className = '',
  icon,
  'aria-label': ariaLabel = 'Viewer 아이콘',
  tooltip,
  backgroundColor,
  iconColor,
}: ViewerIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getColorClasses = () => {
    if (selected) {
      return {
        border: 'var(--color-border-focus)',
        icon: iconColor || 'var(--color-border-focus)',
      };
    }
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
  /** 아이콘의 실제 크기 (원 크기의 절반) */
  const iconSize = size * 0.5;

  /**
   * 기본 아이콘: 아이콘이 제공되지 않았을 때 사용되는 집 모양 아이콘
   */
  const defaultIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3L3 10V20H9V14H15V20H21V10L12 3Z"
        stroke={colors.icon}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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

  const renderIcon = () => {
    if (!icon) {
      return defaultIcon;
    }

    // ReactElement인 경우 color와 size prop을 자동으로 주입
    if (React.isValidElement(icon)) {
      const iconProps = (icon as React.ReactElement<any>).props;
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
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={`
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${onClick ? 'cursor-pointer' : 'cursor-default'}
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
      {tooltip && isHovered && (
        <div className="absolute left-[68px] whitespace-nowrap rounded-lg border border-border-default bg-bg-default px-3 py-2 text-b-xs text-text-title shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );
}
