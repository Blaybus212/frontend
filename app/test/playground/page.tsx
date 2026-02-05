'use client';
import CategoryChip from "@/app/_components/home/CategoryChip";
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