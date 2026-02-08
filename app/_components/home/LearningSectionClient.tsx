'use client';

import { LearningSectionData } from "@/app/_types/home";
import Image from "next/image";

const LearningSectionClient: React.FC<LearningSectionData> = ({
  length,
	scenes
}) => {
  return (
    <div className="flex flex-col gap-5 items-start">
      <div className="flex gap-2 items-center">
        <Image
          src="images/learning-object-icon.svg"
          alt="스택 모양 아이콘"
          width={20}
          height={20}
        />
        <h3 className="text-b-xl font-semibold text-title">학습 중인 오브젝트</h3>
      </div>
      <div className="flex flex-row gap-5">
        {scenes.map((scene)=> (
          <div key={scene.id} className="group w-70 rounded-[14px] overflow-hidden bg-bg-default hover:bg-bg-hovered">
            {/* 상단 이미지 영역 */}
            <div className="relative w-70 h-52.5 overflow-hidden">
              <Image
                src={scene.imageUrl}
                alt={scene.title}
                layout='fill'
                className="transition-transform duration-250 ease-out group-hover:scale-105 object-cover"
              />
              
              {/* 인기 배지 */}
              {scene.isPopular && (
                <div className="absolute top-3.5 left-4 bg-base-white px-2 py-1 rounded-md flex items-center">
                  <span className=" text-base-black text-b-sm font-medium">🔥 인기</span>
                </div>
              )}
            </div>

            {/* 하단 정보 영역 */}
            <div className="p-4 space-y-4">
              {/* 제목과 소제목 */}
              <div>
                <p className="text-title text-b-lg font-medium">{scene.title}</p>
                <p className="text-sub text-b-md font-regular">{scene.engTitle}</p>
              </div>
              
              {/* 카테고리 */}
              <div>
                <span className="inline-block bg-bg-sub text-sub2 px-3 py-1 rounded-full text-b-sm font-regular">
                  {scene.category}
                </span>
              </div>

              {/* 학습 진행률 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sub text-b-sm">학습 진행률</span>
                  <span className="text-selected text-b-sm font-regular">{scene.progress}%</span>
                </div>
                
                {/* 프로그레스 바 배경 */}
                <div className="w-full h-2 bg-bg-sub rounded-full overflow-hidden">
                  {/* 실제 채워지는 바 */}
                  <div 
                    className="h-full bg-point-500 rounded-full"
                    style={{ width: `${scene.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default LearningSectionClient;