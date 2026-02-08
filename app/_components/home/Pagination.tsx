'use client';

import { generatePagination } from "@/app/_utils/home/generatePagination";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ 
  totalPages
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const currentPage = Number(searchParams.get("curr")) || 1;
  const allPages = generatePagination(currentPage, totalPages);

  const handleSearch = (newPageNumber: number | string) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set("curr", newPageNumber.toString());

    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex mt-6 gap-2">
      <button
        onClick={()=>handleSearch(currentPage - 1)}
        className={`
          flex items-center justify-center w-10 h-10 rounded-[10px]  text-b-lg font-regular bg-surface border border-border-default
          ${
            currentPage <= 1 
              ? "text-border-default pointer-events-none"
              : "text-sub2 hover:border-border-hovered"
          }
        `}
      >
        <ChevronLeftIcon className="w-4" />
      </button>
        
      {allPages.map((page, index) => {
        return (
          <button
            key={`${page}-${index}`}
            onClick={()=>handleSearch(page)}
            className={`
              flex items-center justify-center w-10 h-10 rounded-[10px] border text-b-lg font-regular
              
              ${
                currentPage === page
                  ? "bg-bg-hovered-green border-border-focused text-selected"
                  : "bg-surface border-border-default text-sub2 hover:border-border-hovered"
              }
            `}
          >{page}</button>
        );
      })}

      <button
        onClick={()=>handleSearch(currentPage + 1)}
        className={`
          flex items-center justify-center w-10 h-10 rounded-[10px]  text-b-lg font-regular bg-surface border border-border-default
          ${
            currentPage >= totalPages
              ? "text-border-default pointer-events-none"
              : "text-sub2 hover:border-border-hovered"
          }
        `}
      >
        <ChevronRightIcon className="w-4" />
      </button>
    </div>
  );
}

export default Pagination;