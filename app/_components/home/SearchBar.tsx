"use client";

import React from "react";
import Image from "next/image";

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
    <label className="
      w-full flex gap-3 px-4 py-4 h-16 
      rounded-[14px]
      bg-bg-default border border-border-default
      text-title text-b-lg font-regular
      placeholder:text-sub
      /* Focused 상태: 테두리색 변경 및 배경 유지 */
    focus-within:border-border-focus focus-within:bg-bg-default
    ">
      {/* 돋보기 아이콘 */}
      <Image
        src="/images/search-icon.svg" 
        alt="돋보기 모양 아이콘"
        width={20}
        height={20}
      />

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="outline-none group"
      />
    </label>
  );
};

export default SearchBar;