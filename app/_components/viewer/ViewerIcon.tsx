'use client';

import React, { useState, ReactNode } from 'react';

/**
 * ViewerIcon 컴포넌트의 Props 인터페이스
 * @interface ViewerIconProps
 * @property {boolean} [selected=false] - 아이콘의 선택 상태 (true일 경우 네온 그린 테두리)
 * @property {number} [size=54] - 아이콘의 크기 (픽셀 단위)
 * @property {() => void} [onClick] - 아이콘 클릭 시 호출되는 콜백 함수
 * @property {string} [className=''] - 추가 CSS 클래스명
 * @property {ReactNode} [icon] - 표시할 아이콘 컴포넌트 (색상은 자동으로 상태에 따라 적용됨)
 * @property {string} [aria-label='Viewer 아이콘'] - 접근성을 위한 aria-label 속성
 * @property {string} [backgroundColor] - 커스텀 배경색 (CSS 변수 또는 색상 값)
 * @property {string} [iconColor] - 커스텀 아이콘 색상 (CSS 변수 또는 색상 값)
 */
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

/**
 * 뷰어 컨트롤 아이콘 컴포넌트
 * 
 * 3D 뷰어의 좌측 사이드바에 표시되는 원형 아이콘 버튼입니다.
 * 기본, 호버, 선택 상태를 지원하며, 상태에 따라 테두리 색상이 자동으로 변경됩니다.
 * 
 * **상태별 스타일:**
 * - 기본: 회색 테두리
 * - 호버: 밝은 회색 테두리
 * - 선택: 네온 그린 테두리 (border-focus 색상)
 * 
 * **사용 예시:**
 * ```tsx
 * <ViewerIcon
 *   icon={<HomeIcon />}
 *   selected={isSelected}
 *   onClick={() => handleClick()}
 *   aria-label="홈"
 * />
 * ```
 * 
 * @param {ViewerIconProps} props - 컴포넌트 props
 * @returns {JSX.Element} ViewerIcon 컴포넌트
 */
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
  /** 마우스 호버 상태 */
  const [isHovered, setIsHovered] = useState(false);

  /**
   * 현재 상태(선택, 호버, 기본)에 따른 테두리 및 아이콘 색상 결정
   * @returns {Object} 테두리 색상과 아이콘 색상을 포함한 객체
   */
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

  /**
   * 아이콘 렌더링 함수
   * 아이콘이 ReactElement인 경우 색상과 크기를 자동으로 주입합니다.
   * @returns {ReactNode} 렌더링된 아이콘 컴포넌트
   */
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

  /** 배경색 (커스텀 배경색이 제공되지 않으면 기본값 사용) */
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
