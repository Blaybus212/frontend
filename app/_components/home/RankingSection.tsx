import { RankingSectionData } from "@/app/_types/home";
import RankingSectionClient from "./RankingSectionClient";

interface RankingSectionProps {
  rank: string;
}

const RankingSection = ({
  rank
}: RankingSectionProps) => {
  // "오늘 사람들이 많이 학습한 오브젝트" 정보 (GET /scenes/ranks/?category=)
  const data: RankingSectionData = {
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

  return <RankingSectionClient {...data} />
}

export default RankingSection;