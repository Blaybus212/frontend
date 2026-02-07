'use client';

import BottomObjectCard from "@/app/_components/home/BottomObjectCard";
import CategoryChip from "@/app/_components/home/CategoryChip";
import Dropdown from "@/app/_components/home/Dropdown";
import ObjectCard from "@/app/_components/home/ObjectCard";
import PageButton from "@/app/_components/home/PageButton";
import SearchBar from "@/app/_components/home/SearchBar";
import StudiedList from "@/app/_components/home/StudiedList";
import SummaryCard from "@/app/_components/home/SummaryCard";
import { CATEGORY_LIST, ORDER_LIST } from "@/app/_constants/onboard";
import { BottomObjectCardData, ObjectCardData, StudiedListData, StudiedListItem, SummaryCardData } from "@/app/_types/home";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  // 사용자 정보
  const { data: userData } = useSession();
  const name: string = userData?.loginUser?.name ?? '';

  // "잔디" 정보 (GET /my/activity)
  const summaryCardData: SummaryCardData = {
    streak: 3,
    solvedQuizCount: 40,
    cells: {
      "2026-02-06": { solved: 2 },
      "2026-02-05": { solved: 3 },
      "2026-02-04": { solved: 1 },
      "2026-02-01": { solved: 4 }
    },
    themeColor: "green"
  }

  // "학습 중인 오브젝트" 정보 (GET /my/recent/scenes)
  const objectCardData: ObjectCardData = {
    length: 3, // 로드된 scene 개수
    scenes: [
      {
        id: "scene-001",
        title: "터번 엔진",
        engTitle: "Turbine Engine",
        category: "기계공학",
        imageUrl: "/images/objectcard_example.png",
        progress: 85,
      },
      {
        id: "scene-002",
        title: "유압 실린더",
        engTitle: "Hydraulic Cylinder",
        category: "기계공학",
        imageUrl: "/images/objectcard_example.png",
        progress: 40, // 40% 완료
      },
      {
        id: "scene-003",
        title: "차동 기어",
        engTitle: "Differential Gear",
        category: "자동차공학",
        imageUrl: "/images/objectcard_example.png",
        progress: 100, // 완료
      },
    ],
  };

  // "오늘 사람들이 많이 학습한 오브젝트" 정보 (GET /scenes/ranks/?category=)
  // 인기 학습 오브젝트 랭킹 (예시: GET /ranking/scenes)
  const studiedListData: StudiedListData = {
    today: "2024-05-22 14:30",
    scenes: [
      {
        id: "scene-001",
        rank: 1,
        title: "터번 엔진",
        engTitle: "Turbine Engine",
        rankDiff: 0,
      },
      {
        id: "scene-002",
        rank: 2,
        title: "유압 실린더",
        engTitle: "Hydraulic Cylinder",
        rankDiff: 2,
      },
      {
        id: "scene-003",
        rank: 3,
        title: "차동 기어",
        engTitle: "Differential Gear",
        rankDiff: -1,
      },
      {
        id: "scene-004",
        rank: 4,
        title: "원자력 발전소",
        engTitle: "Nuclear Power Plant",
        rankDiff: 5,
      },
      {
        id: "scene-005",
        rank: 5,
        title: "태양광 패널",
        engTitle: "Solar Panel",
        rankDiff: -2
      },
    ],
  };

  // "오브젝트 모두 보기" 정보
  const bottomObjectListData: BottomObjectCardData = {
    scenes: Array(9).fill(null).map((_, i) => ({
      title: `정밀 공학 기구 ${i + 1}`,
      engTitle: `Precision Tool ${i + 1}`,
      category: i % 2 === 0 ? "기계공학" : "전자공학",
      description: "이 오브젝트는 실제 산업 현장에서 사용되는 정밀 부품의 내부 구조를 3D로 시뮬레이션하여 학습할 수 있도록 설계되었습니다.",
      imageUrl: "/images/objectcard_example.png",
      participantsCount: 1240 + (i * 15),
    })),
    pages: {
      curPage: 1,
      size: 9,
      totalCount: 45,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false,
    }
  };
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="flex flex-col max-w-min min-w-max py-13.75 gap-17.5 mx-auto">
      {/* 환영 문구와 잔디 */}
      <div className="flex justify-between">
        {/* 환영 문구 */}
        <div className="flex flex-col gap-2.5 text-left">
          <h2 className="text-h-1xl font-semibold text-title">{name}님,<br/>돌아오신 걸 환영해요!</h2>
          <p className="text-b-xl font-regular text-sub">오늘은 어떤 오브젝트를 배워볼까요?</p>
        </div>
        {/* 잔디 */}
        <SummaryCard {...summaryCardData} />
      </div>

      {/* 학습 중인 오브젝트와 오늘 사람들이 많이 학습한 오브젝트 */}
      <div className="flex flex-row gap-6.5">
        {/* 학습 중인 오브젝트 */}
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
            {objectCardData.scenes.map((scene)=> (
              <ObjectCard
                key={scene.id}
                imageSrc={scene.imageUrl}
                title={scene.title}
                subtitle={scene.engTitle}
                category={scene.category}
                progress={scene.progress}
              />
            ))}

          </div>
        </div>
        {/* 오늘 사람들이 많이 학습한 오브젝트 */}
        <div className="flex flex-col gap-5 items-start">
          <div className="w-full flex items-center">
            <Image
              src="images/ranking-icon.svg"
              alt="상승하는 모양 아이콘"
              width={20}
              height={20}
            />
            <h3 className="text-b-xl font-semibold text-title ml-2 mr-auto">오늘 사람들이 많이 학습한 오브젝트</h3>
            <p className="text-b-sm font-medium text-sub3">{studiedListData.today.slice(11,)} 기준</p>
          </div>
          <div className="flex flex-row gap-5">
            <StudiedList
              items={studiedListData.scenes}
              onItemClick={(item: StudiedListItem) => console.log(item.id)}
            />
          </div>
        </div>
      </div>

      {/* 오브젝트 모두 보기 */}
      <div className="flex flex-col">
        {/* 검색창 */}
        <SearchBar />
        {/* 카테고리 및 정렬선택 */}
        <div className="mt-6 mb-6 flex justify-between">
          <div className="flex flex-wrap gap-3.5">
            {CATEGORY_LIST.map((category) => (
              <CategoryChip key={category} label={category} />
            ))}
          </div>
          <Dropdown options={ORDER_LIST} />
        </div>
        {/* 모델들 리스트 (3x3 그리드) */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-10">
          {bottomObjectListData.scenes.map((scene, idx) => (
            <BottomObjectCard key={idx} {...scene} />
          ))}
        </div>

        {/* 2. 페이지네이션 UI */}
        <div className="flex justify-center items-center gap-4 mt-15">
          <button 
            disabled={!bottomObjectListData.pages.hasPrevious}
            className="p-2 disabled:opacity-30 hover:bg-bg-sub rounded-full transition-colors"
          >
            <Image src="images/page-left-arrow.svg" alt="이전" width={24} height={24} />
          </button>
          
          <div className="flex gap-2">
            {[...Array(bottomObjectListData.pages.totalPages)].map((_, i) => (
              <PageButton
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                isSelected={currentPage === i + 1} page={i + 1}
              />
            ))}
          </div>

          <button 
            disabled={!bottomObjectListData.pages.hasNext}
            className={`
              /* 기본 레이아웃: 정사각형 형태 유지 */
              flex items-center justify-center w-10 h-10 rounded-[10px] 
              transition-all duration-200 border text-b-lg font-regular
              bg-base-black border-bg-hovered-green text-sub2 hover:border-border-hovered // Default & Hover
              }
            `}
          >
            <Image src="images/page-right-arrow.svg" alt="다음" width={24} height={24} className="dark:invert" />
          </button>
        </div>
      </div>
    </div>
  );
}