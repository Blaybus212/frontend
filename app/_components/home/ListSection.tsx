
import { ListSectionData } from "@/app/_types/home";
import ModelGrid from "./ModelGrid";
import Pagination from "./Pagination";

interface LIstSectionProps {
  query: string;
  order: string;
  category: string;
  curr: string;
}

const ListSection = ({
  query,
  order,
  category,
  curr
}: LIstSectionProps) => {
  // "오브젝트 모두 보기" 정보 (GET /scenes)
  // TODO: API에 맞게 변경
  const data: ListSectionData = {
    scenes: Array(9).fill(null).map((_, i) => ({
      id: String(i),
      isPopular: true,
      title: `정밀 공학 기구 ${i + 1}`,
      engTitle: `Precision Tool ${i + 1}`,
      category: i % 2 === 0 ? "기계공학" : "전자공학",
      description: "이 오브젝트는 실제 산업 현장에서 사용되는 정밀 부품의 내부 구조를 3D로 시뮬레이션하여 학습할 수 있도록 설계되었습니다.",
      imageUrl: "/images/objectcard_example.png",
      participantsCount: 1240 + (i * 15),
    })),
    pages: {
      curPage: 1,
      size: 9,
      totalCount: 45,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false,
    }
  };

  return (
    <div className="flex flex-col items-center">
      <ModelGrid models={data.scenes} />
      <Pagination {...data.pages} />
    </div>
  )
}

export default ListSection;