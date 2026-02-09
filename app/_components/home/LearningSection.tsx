import { LearningSectionData } from "@/app/_types/home";
import LearningSectionClient from "./LearningSectionClient";
import { $fetch } from "@/app/_utils/fetch";

const LearningSection = async () => {
  // "학습 중인 오브젝트" 정보 (GET /my/recent/scenes)
  // TODO: API에 맞게 변경
  const objectCardData: LearningSectionData = await $fetch("/my/recent/scenes");
  // const objectCardData: LearningSectionData = {
  //   scenes: [
  //     {
  //       id: "scene-001",
  //       title: "터번 엔진",
  //       engTitle: "Turbine Engine",
  //       category: "기계공학",
  //       imageUrl: "/images/objectcard_example.png",
  //       progress: 85,
  //       popular: true
  //     },
  //     {
  //       id: "scene-002",
  //       title: "유압 실린더",
  //       engTitle: "Hydraulic Cylinder",
  //       category: "기계공학",
  //       imageUrl: "/images/objectcard_example.png",
  //       progress: 40,
  //       popular: false
  //     },
  //     {
  //       id: "scene-003",
  //       title: "차동 기어",
  //       engTitle: "Differential Gear",
  //       category: "자동차공학",
  //       imageUrl: "/images/objectcard_example.png",
  //       progress: 100,
  //       popular: false
  //     },
  //   ],
  // };

  return <LearningSectionClient {...objectCardData} />
}

export default LearningSection;