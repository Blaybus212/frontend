import { RankingSectionData, RankingSectionItem } from "@/app/_types/home";
import RankingSectionClient from "./RankingSectionClient";
import { $fetch } from "@/app/_utils/fetch";

interface RankingSectionProps {
  rank: string;
}

/** 전체 분야용 목데이터 */
const MOCK_RANKING_ALL: RankingSectionItem[] = [
  { id: "5", rank: 1, title: "공작기계 바이스", engTitle: "Machine Vice", rankDiff: 2 },
  { id: "1", rank: 2, title: "로봇 집게", engTitle: "Robot Gripper", rankDiff: -1 },
  { id: "3", rank: 3, title: "판스프링", engTitle: "Leaf Spring", rankDiff: 0 },
  { id: "4", rank: 4, title: "드론", engTitle: "Drone", rankDiff: 3 },
];

/** 로봇공학 목데이터 */
const MOCK_RANKING_ROBOTICS: RankingSectionItem[] = [
  { id: "1", rank: 1, title: "로봇 집게", engTitle: "Robot Gripper", rankDiff: 0 },
];

/** 자동차공학 목데이터 */
const MOCK_RANKING_AUTOMOTIVE: RankingSectionItem[] = [
  { id: "3", rank: 1, title: "판스프링", engTitle: "Leaf Spring", rankDiff: 0 }
];

/** 항공우주공학 목데이터 */
const MOCK_RANKING_AEROSPACE: RankingSectionItem[] = [
  { id: "4", rank: 1, title: "드론", engTitle: "Drone", rankDiff: 0 }
];

/** 제조공학 목데이터 */
const MOCK_RANKING_MANUFACTURING: RankingSectionItem[] = [
  { id: "5", rank: 1, title: "공작기계 바이스", engTitle: "Machine Vice", rankDiff: 0 }
];

const MOCK_RANKING_BY_CATEGORY: Record<string, RankingSectionItem[]> = {
  robotics: MOCK_RANKING_ROBOTICS,
  automotive_engineering: MOCK_RANKING_AUTOMOTIVE,
  aerospace_engineering: MOCK_RANKING_AEROSPACE,
  manufacturing_engineering: MOCK_RANKING_MANUFACTURING,
};

const RankingSection = async ({
  rank
}: RankingSectionProps) => {
  let data: RankingSectionData;
  try {
    data = await $fetch<RankingSectionData>(`/scenes/ranks${rank === "" ? "" : `?category=${rank}`}`);
  } catch {
    data = {
      today: new Date().toISOString(),
      scenes: [],
    };
  }

  const filteredScenes = (data.scenes ?? []).filter((scene) => scene.id !== "2");
  const useMock = filteredScenes.length === 0;
  console.log(filteredScenes);
  const scenesToShow = useMock
    ? rank === "" || rank === "all"
      ? MOCK_RANKING_ALL
      : (MOCK_RANKING_BY_CATEGORY[rank] ?? MOCK_RANKING_ALL)
    : filteredScenes;

  return (
    <RankingSectionClient
      today={data.today ?? new Date().toISOString()}
      scenes={scenesToShow}
    />
  );
};

export default RankingSection;