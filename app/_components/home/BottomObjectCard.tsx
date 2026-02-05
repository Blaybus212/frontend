import Image from 'next/image';
import React from 'react';

interface BottomObjectCardProps {
  imageSrc: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  participantCount: number;
}

const BottomObjectCard: React.FC<BottomObjectCardProps> = ({
  imageSrc,
  title,
  subtitle,
  description,
  category,
  participantCount,
}) => {
  return (
    <div className="group w-full max-w-108 rounded-[14px] overflow-hidden bg-bg-default hover:bg-bg-hovered cursor-pointer">
      {/* 상단 이미지 영역 */}
      <div className="relative w-full h-52.5 overflow-hidden bg-bg-sub">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition-transform duration-250 ease-out group-hover:scale-105"
        />
      </div>

      {/* 하단 정보 영역 */}
      <div className="px-4 py-[16.56px] space-y-3.5">
        {/* 타이틀 세션 */}
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-b-lg font-medium text-title">{title}</h3>
          <span className="text-b-md font-regular text-sub">{subtitle}</span>
        </div>

        {/* 상세 설명 */}
        <p className="text-b-md font-regular text-description leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* 푸터 세션: 카테고리 & 인원 */}
        <div className="flex items-center justify-between pt-px">
          <span className="px-3 py-1 rounded-full bg-bg-sub text-sub2 text-b-sm font-regular">
            {category}
          </span>
          
          <div className="flex items-center gap-0.5 text-sub2">
            {/* TODO: 유저 svg 추가 */}
            <span className="text-b-md font-medium">{participantCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomObjectCard;