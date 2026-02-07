'use client';

import { StudiedListItem } from "@/app/_types/home";
import Image from "next/image";

export interface StudiedListProps {
  items: StudiedListItem[];
  onItemClick: (item: StudiedListItem) => void;
}

const StudiedList = ({ items, onItemClick }: StudiedListProps ) => {
  return (
    <div className="w-109.25 px-6 py-[12.5px] rounded-[14px] bg-bg-default">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item) }
            className="group flex items-center justify-between px-3 py-3.5 rounded-[10px] transition-all duration-200 hover:bg-bg-hovered cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-sub text-sub text-b-md font-medium">
                {item.rank}
              </div>

              <div className="flex flex-col">
                <span className="text-b-md font-medium text-title">{item.title}</span>
                <span className="text-b-sm font-medium text-sub">{item.engTitle}</span>
              </div>
            </div>

            {item.rankDiff !== undefined && (
              <div className={`flex gap-1 items-center text-b-sm font-regular ${item.rankDiff > 0 ? "text-sub-red" : "text-sub"}`}>
                {
                  item.rankDiff > 0
                  && 
                  <Image
                    src="/images/up-icon.svg" 
                    alt="세모 상승 모양 아이콘"
                    priority
                    width={16}
                    height={16}
                  />
                }
                <p>{item.rankDiff > 0 ? `+${item.rankDiff}` : item.rankDiff != 0 && `${item.rankDiff}`}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudiedList;