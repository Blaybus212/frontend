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
  if(rank=="all") rank = ""
  const data: RankingSectionData = await $fetch(`/scenes/ranks?category=${rank}`)

  return <RankingSectionClient {...data} />
}

export default RankingSection;