'use client';
import BottomObjectCard from "@/app/_components/home/BottomObjectCard";
import CategoryChip from "@/app/_components/home/CategoryChip";
import Dropdown from "@/app/_components/home/Dropdown";
import ObjectCard from "@/app/_components/home/ObjectCard";
import StudiedList, { StudiedItem } from "@/app/_components/home/StudiedList";
import SummaryCard, { GrassLevel } from "@/app/_components/home/SummaryCard";
import { useState } from "react";

export default function Playground() {
  const categories = ["기계공학", "전기공학", "소프트웨어", "데이터분석"];
  const [selectedCategory, setSelectedCategory] = useState("기계공학");
  const studiedListData = [
    { id: 1, rank: 1, title: "드론", subTitle: "Drone" },
    { id: 2, rank: 2, title: "터번 엔진", subTitle: "Turbine Engine", diff: 1 },
    { id: 3, rank: 3, title: "서스펜션 시스템", subTitle: "Suspension System", diff: -1 },
    { id: 4, rank: 4, title: "유압 실린더", subTitle: "Hydraulic Cylinder", diff: 2 },
    { id: 5, rank: 5, title: "차동 기어", subTitle: "Differential Gear" },
  ];
  const grassData: GrassLevel[][] = [
    [0, 0, 0, 0, 0, 4, 0, 2, 0, 3],
    [4, 0, 2, 4, 0, 2, 4, 4, 4, 2],
    [0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... 이런식으로 4개 행을 구성
  ];

  return (
    <div className="p-4 bg-white">
      <Dropdown options={["인기순", "가나다순"]} />
      <br/>
      <BottomObjectCard
        imageSrc="/images/objectcard_example.png"
        title="로봇 팔"
        subtitle="Robot Arm"
        description="로봇 팔은 총 32개의 부품으로 구성되어 있으며, 정밀 조립과 반복 작업 등 다양한 산업 현장에서 활용되고 있어요."
        category="기계공학"
        participantCount={32}
      />
      <br/>
      {categories.map((category) => (
        <CategoryChip
          key={category}
          label={category}
          isSelected={selectedCategory === category}
          onClick={() => setSelectedCategory(category)}
        />
      ))}
      <br/>
      <br/>
      <StudiedList 
        items={studiedListData} 
        onItemClick={(item: StudiedItem) => alert(item.title)} 
      />
      <br/>
      <ObjectCard 
        imageSrc="/images/objectcard_example.png"
        title="로봇 팔"
        subtitle="Robot Arm"
        category="기계공학"
        progress={68}
        isPopular={true}
      />
      <br/>
      <SummaryCard 
        month="Feb"
        colorType="green"
        grassData={grassData}
        maxStreak={11}
        solvedQuizzes={25}
      />
    </div>
  );
}