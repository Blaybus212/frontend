"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LIST } from "@/app/_constants/onboard";

const Categories = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (category: string) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set("category", category);
    newParams.set("curr", "1");

    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-3.5">
      {CATEGORY_LIST.map((category) => (
        <button
          key={category}
          onClick={() => handleClick(category)}
          className={`
            /* 기본 스타일 */
            px-4 py-2.5 rounded-[10px] border text-b-lg font-regular
            
            ${
              category === searchParams.get("category")?.toString()
                ? "bg-bg-hovered-green border-border-focus text-selected" // Selected 상태
                : "bg-bg-default border-border-default text-sub2 hover:bg-bg-default hover:border-border-hovered hover:text-title" // Default & Hover 상태
            }
          `}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default Categories;