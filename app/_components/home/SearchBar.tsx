"use client";

import React from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
}

const SearchBar = ({ 
  placeholder = "찾고자 하는 오브젝트 이름을 입력해 주세요", 
  value, 
  onChange,
  onSearch 
}: SearchBarProps) => {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch && value) {
      onSearch(value);
    }
  };

  return (
    <div className="relative w-full max-w-300 group">
      {/* 돋보기 아이콘 */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-sub">
        <SearchIcon />
      </div>

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          w-full h-16 pl-14 pr-6 rounded-[14px]
          bg-bg-default border border-border-default
          text-title text-b-lg font-regular
          placeholder:text-sub
          outline-none transition-all duration-250 ease-out
          /* Focused 상태: 테두리색 변경 및 배경 유지 */
          focus:border-border-focus focus:bg-bg-default
        `}
      />
    </div>
  );
};

// TODO: 병합 후 아이콘 분리
// --- 아이콘 컴포넌트 ---
const SearchIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default SearchBar;