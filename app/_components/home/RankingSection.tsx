import { RankingSectionData } from "@/app/_types/home";
import RankingSectionClient from "./RankingSectionClient";
import { $fetch } from "@/app/_utils/fetch";

interface RankingSectionProps {
  rank: string;
}

const RankingSection = async ({
  rank
}: RankingSectionProps) => {
  // "오늘 사람들이 많이 학습한 오브젝트" 정보 (GET /scenes/ranks/?category=)
  const data: RankingSectionData = await $fetch(`/scenes/ranks${rank == "" ? "" : `?category=${rank}`}`)
  const filteredScenes = data.scenes.filter((scene) => scene.id !== "2");

  return <RankingSectionClient {...data} scenes={filteredScenes} />
}

export default RankingSection;