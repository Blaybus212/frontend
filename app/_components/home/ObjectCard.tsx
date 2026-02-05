import Image from 'next/image';
import React from 'react';

interface ObjectCardProps {
  imageSrc: string;
  title: string;
  subtitle: string;
  category: string;
  progress: number; // 0 to 100
  isPopular?: boolean;
}

const ObjectCard: React.FC<ObjectCardProps> = ({
  imageSrc,
  title,
  subtitle,
  category,
  progress,
  isPopular = false,
}) => {
  return (
    <div className="group w-70 rounded-[14px] overflow-hidden bg-bg-default hover:bg-bg-hovered">
      {/* 상단 이미지 영역 */}
      <div className="relative w-70 h-52.5 overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          layout='fill'
          objectFit="cover"
          className="transition-transform duration-250 ease-out group-hover:scale-105"
        />
        
        {/* 인기 배지 */}
        {isPopular && (
          <div className="absolute top-3.5 left-4 bg-base-white px-2 py-1 rounded-md flex items-center">
            <span className=" text-base-black text-b-sm font-medium">🔥 인기</span>
          </div>
        )}
      </div>

      {/* 하단 정보 영역 */}
      <div className="p-4 space-y-4">
        {/* 제목과 소제목 */}
        <div>
          <p className="text-title text-b-lg font-medium">{title}</p>
          <p className="text-sub text-b-md font-regular">{subtitle}</p>
        </div>
        
        {/* 카테고리 */}
        <div>
          <span className="inline-block bg-bg-sub text-sub2 px-3 py-1 rounded-full text-b-sm font-regular">
            {category}
          </span>
        </div>

        {/* 학습 진행률 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sub text-b-sm">학습 진행률</span>
            <span className="text-selected text-b-sm font-regular">{progress}%</span>
          </div>
          
          {/* 프로그레스 바 배경 */}
          <div className="w-full h-2 bg-bg-sub rounded-full overflow-hidden">
            {/* 실제 채워지는 바 */}
            <div 
              className="h-full bg-point-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectCard;