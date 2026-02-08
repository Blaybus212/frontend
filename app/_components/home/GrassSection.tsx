import { GrassSectionData } from "@/app/_types/home";
import GrassSectionClient from "./GrassSectionClient";

const GrassSection = () => {
  // "잔디" 정보 (GET /my/activity)
  // TODO: API에 맞게 변경
  const data: GrassSectionData = {
    streak: 3,
    solvedQuizCount: 40,
    cells: {
      "2026-02-06": { solved: 2 },
      "2026-02-05": { solved: 3 },
      "2026-02-04": { solved: 1 },
      "2026-02-01": { solved: 4 }
    }
  }

  return <GrassSectionClient {...data} />
}

export default GrassSection;