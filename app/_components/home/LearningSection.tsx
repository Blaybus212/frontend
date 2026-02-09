import { LearningSectionData } from "@/app/_types/home";
import LearningSectionClient from "./LearningSectionClient";
import { $fetch } from "@/app/_utils/fetch";

const LearningSection = async () => {
  // "학습 중인 오브젝트" 정보 (GET /my/recent/scenes)
  // TODO: API에 맞게 변경
  const objectCardData: LearningSectionData = await $fetch("/my/recent/scenes");

  return <LearningSectionClient {...objectCardData} />
}

export default LearningSection;