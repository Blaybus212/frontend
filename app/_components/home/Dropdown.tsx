"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  options: string[];
  defaultLabel?: string;
  onSelect?: (option: string) => void;
}

const Dropdown = ({ options, defaultLabel = "정렬", onSelect }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultLabel);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
    if (onSelect) onSelect(option);
  };

  return (
    <div className="relative w-39.75" ref={dropdownRef}>
      {/* 드롭다운 버튼 (Trigger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-3.5 py-3 rounded-[14px]
          text-b-lg font-medium border-2
          bg-bg-default
          border-border-default
          ${isOpen 
            ? " text-sub2" 
            : " text-sub"}
        `}
      >
        <span>{selected}</span>
        {/* 화살표 아이콘: Open 상태에 따라 회전 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 (Menu) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] w-full p-1.5 bg-bg-hovered rounded-[10px] z-50 animate-in fade-in zoom-in">
          <ul className="flex flex-col gap-1">
            {options.map((option) => (
              <li key={option}>
                <button
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-b-lg font-medium text-sub2 hover:bg-bg-sub transition-colors"
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;