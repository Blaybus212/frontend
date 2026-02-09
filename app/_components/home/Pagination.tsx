'use client';

import { generatePagination } from "@/app/_utils/home/generatePagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ totalPages }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // 1. useState 대신 URL 파라미터에서 직접 현재 페이지를 읽습니다.
  const currentPage = Number(searchParams.get("curr")) || 1;

  // 2. 페이지가 1개 이하일 경우 UI를 아예 보여주지 않습니다. (에러 및 UX 방지)
  if (!totalPages || totalPages <= 1) return null;

  // 수정된 유틸리티 함수 호출
  const allPages = generatePagination(currentPage, totalPages);

  const handleSearch = (newPageNumber: number | string) => {
    // '...' 클릭 시 아무 동작 안 함
    if (newPageNumber === "...") return;

    const pageInt = Number(newPageNumber);
    // 현재 페이지와 같거나 유효하지 않은 숫자면 무시
    if (pageInt === currentPage || isNaN(pageInt)) return;
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set("curr", pageInt.toString());

    // scroll: false로 페이지 이동 시 상단으로 튕기는 현상 방지
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex mt-6 gap-2 justify-center">
      {/* 이전 버튼 */}
      <button
        onClick={() => handleSearch(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`
          flex items-center justify-center w-10 h-10 rounded-[10px] text-b-lg font-regular bg-surface border border-border-default
          ${currentPage <= 1 
            ? "text-border-default opacity-50 cursor-not-allowed" 
            : "text-sub2 hover:border-border-hovered"}
        `}
      >
        <ChevronLeftIcon className="w-4" />
      </button>
        
      {/* 페이지 번호들 */}
      {allPages.map((page, index) => (
        <button
          key={`${page}-${index}`}
          onClick={() => handleSearch(page)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-[10px] border text-b-lg font-regular transition-colors
            ${currentPage === page
              ? "bg-bg-hovered-green border-border-focused text-selected font-bold"
              : "bg-surface border-border-default text-sub2 hover:border-border-hovered"}
            ${page === "..." ? "cursor-default border-transparent" : ""}
          `}
        >
          {page}
        </button>
      ))}

      {/* 다음 버튼 */}
      <button
        onClick={() => handleSearch(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`
          flex items-center justify-center w-10 h-10 rounded-[10px] text-b-lg font-regular bg-surface border border-border-default
          ${currentPage >= totalPages 
            ? "text-border-default opacity-50 cursor-not-allowed" 
            : "text-sub2 hover:border-border-hovered"}
        `}
      >
        <ChevronRightIcon className="w-4" />
      </button>
    </div>
  );
}

export default Pagination;