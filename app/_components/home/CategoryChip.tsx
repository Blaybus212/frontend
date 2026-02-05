"use client";

interface CategoryChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const CategoryChip = ({ label, isSelected = false, onClick }: CategoryChipProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        /* 기본 스타일 */
        px-4 py-2.5 rounded-[10px] border text-b-lg font-regular
        
        ${
          isSelected
            ? "bg-bg-hovered-green border-border-focus text-selected" // Selected 상태
            : "bg-bg-default border-border-default text-sub2 hover:bg-bg-default hover:border-border-hovered hover:text-title" // Default & Hover 상태
        }
      `}
    >
      {label}
    </button>
  );
};

export default CategoryChip;