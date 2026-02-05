"use client";

interface PageButtonProps {
  page: number | string;
  isSelected?: boolean;
  onClick?: () => void;
}

const PageButton = ({ page, isSelected = false, onClick }: PageButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        /* 기본 레이아웃: 정사각형 형태 유지 */
        flex items-center justify-center w-10 h-10 rounded-[10px] 
        transition-all duration-200 border-1 text-b-lg font-regular
        
        ${
          isSelected
            ? "bg-[#151A09] border-border-focused text-selected " // Selected: 테두리 포인트 컬러
            : "bg-base-black border-border-default text-sub2 hover:border-border-hovered" // Default & Hover
        }
      `}
    >
      {page}
    </button>
  );
};

export default PageButton;