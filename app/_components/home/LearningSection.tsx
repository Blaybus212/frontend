import { LearningSectionData } from "@/app/_types/home";
import LearningSectionClient from "./LearningSectionClient";
import { $fetch } from "@/app/_utils/fetch";

const LearningSection = async () => {
  // "학습 중인 오브젝트" 정보 (GET /my/recent/scenes)
  const data: LearningSectionData = await $fetch("/my/recent/scenes");
  const filteredScenes = data.scenes.filter(scene => scene.id !== "2");

  return <LearningSectionClient scenes={filteredScenes} />
}

export default LearningSection;