'use client';

import React from 'react';
import Image from 'next/image';
import { GrassSectionData } from '@/app/_types/home';
import { getFullMonthlySolvedList } from '@/app/_utils/home/convertCellsToList';
import { useSession } from 'next-auth/react';

const GrassSectionClient: React.FC<GrassSectionData> = ({
  streak,
  solvedQuizCount,
  cells
}) => {
  console.log(cells);
  // 세션에서 테마 컬러 가져오기
  const { data: userData } = useSession();
  const themeColor: string = 'green'; // userData?.loginUser?.themeColor ??

  // 잔디 데이터 전처리
  const grassData = getFullMonthlySolvedList(cells, 2026, 2);

  // 색상 이름 매치
  const getColorClass = (level: number) => {
    if (level === 0) return 'bg-grass-green-0';
    return `bg-grass-${themeColor}-${level}`;
  };

  return (
    <div className="flex items-center gap-7.5 px-7.5 py-4.5 rounded-[14px] bg-bg-default">
      {/* 왼쪽: 월별 잔디 영역 */}
      <div>
        <div className='flex flex-row gap-2 mb-3'>
          <Image
            src="/images/grass-left-arrow.svg"
            alt="왼쪽 화살표"
            width={24}
            height={24}
          />
          <h3 className="text-h-sm font-semibold text-title">Feb</h3>
          <Image
            src="/images/grass-right-arrow.svg"
            alt="오른쪽 화살표"
            width={24}
            height={24}
          />
        </div>
        <div className="grid grid-cols-10 grid-flow-row gap-[7.23px]">
          {grassData.map((grassLevel, index) =>
              <div
                key={index}
                className={`w-5.25 h-5.25 rounded-md transition-colors duration-300 ${getColorClass(grassLevel)}`}
              />
          )}
        </div>
      </div>

      {/* 오른쪽: 통계 데이터 영역 */}
      <div className="flex flex-col gap-1.5 min-w-35 max-h-min">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sub">
            <Image
              src="images/summarycard-calendar.svg"
              alt="캘린더 아이콘"
              width={16}
              height={16}
            />
            <span className="text-b-sm font-regular">최대 연속 학습일</span>
          </div>
          <p className="text-h-sm font-semibold text-title">
            {streak}일
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sub">
            <Image
              src="images/summarycard-reward.svg"
              alt="캘린더 아이콘"
              width={16}
              height={16}
            />
            <span className="text-b-sm font-regular">맞춘 퀴즈 문항</span>
          </div>
          <p className="text-h-sm font-semibold text-title">
            {solvedQuizCount}개
          </p>
        </div>
      </div>
    </div>
  );
};

export default GrassSectionClient;