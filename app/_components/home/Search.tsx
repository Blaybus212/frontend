"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from 'use-debounce';

interface SearchParams {
  placeholder?: string;
}

const Search = ({
  placeholder = "찾고자 하는 오브젝트 이름을 입력해 주세요",
}: SearchParams) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = useDebouncedCallback((input: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if(input) {
      newParams.set("query", input);
    } else {
      newParams.delete("query");
    }

    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, 300);

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
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
        placeholder={placeholder}
        className="outline-none group"
      />
    </label>
  );
};

export default Search;