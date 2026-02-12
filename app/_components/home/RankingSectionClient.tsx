'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { RankingSectionData, SceneCategory } from '@/app/_types/home';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const RankingSectionClient: React.FC<RankingSectionData> = ({
  today,
  scenes
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [rank, setRank] = useState<string>(searchParams.get("rank")?.toString() || 'all');

  const handleClick = (rank: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (rank == "my") {
      rank = session?.loginUser?.preferCategory ?? "";
      newParams.set("rank", SceneCategory[rank as keyof typeof SceneCategory] ?? "robotics");
    } else {
      newParams.delete("rank");
    }

    setRank(rank);


    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-5 items-start">
      <div className="w-full flex items-center">
        <Image
          src="images/ranking-icon.svg"
          alt="상승하는 모양 아이콘"
          width={20}
          height={20}
        />
        <h3 className="text-b-xl font-semibold text-title ml-2 mr-auto">오늘 사람들이 많이 학습한 오브젝트</h3>
        <p className="text-b-sm font-medium text-sub3">{today.slice(11,)} 기준</p>
      </div>
      <div className="flex flex-row gap-5">
        <div className="flex flex-col justify-end w-109.25 px-6 py-[12.5px] rounded-[14px] bg-bg-default">
          <div className="flex p-1 bg-bg-sub rounded-lg ml-auto">
            <button
              onClick={() => handleClick("all")}
              className={`rounded-lg px-3.75 py-1.5 text-b-sm font-medium ${
                rank === "all" ? "text-selected bg-[#2C342A]" : "text-sub bg-bg-sub"
              }`}
            >
              전체 분야
            </button>

            <button
              onClick={() => handleClick("my")}
              className={`rounded-lg px-3.75 py-1.5 text-b-sm font-medium ${
                rank !== "all" ? "text-selected bg-[#2C342A]" : "text-sub bg-bg-sub"
              }`}
            >
              내 분야
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {scenes.map((item, index) => (
              <div
                key={item.id}
                onClick={() => router.push(`viewer/${item.id}`) }
                className="group flex items-center justify-between px-3 py-3.5 rounded-[10px] transition-all duration-200 hover:bg-bg-hovered cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-sub text-sub text-b-md font-medium">
                    {index + 1}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-b-md font-medium text-title">{item.title}</span>
                    <span className="text-b-sm font-medium text-sub">{item.engTitle}</span>
                  </div>
                </div>

                {item.rankDiff !== undefined && (
                  <div className={`flex gap-1.5 items-center text-b-sm font-regular ${item.rankDiff > 0 ? "text-sub-red" : "text-sub"}`}>
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
      </div>
    </div>
  );
};

export default RankingSectionClient;