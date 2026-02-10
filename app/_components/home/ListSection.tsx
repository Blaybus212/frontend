import { ListSectionData, SceneCategory } from "@/app/_types/home";
import ModelGrid from "./ModelGrid";
import Pagination from "./Pagination";
import { $fetch } from "@/app/_utils/fetch";

interface LIstSectionProps {
  query: string;
  order: string;
  category: string;
  curr: string;
}

const ListSection = async ({
  query,
  order,
  category,
  curr
}: LIstSectionProps) => {
  const queryString = [
    order && `order=${order}`,
    category && `category=${SceneCategory[category as keyof typeof SceneCategory]}`,
    curr && `page=${curr}`
  ]
    .filter(Boolean)
    .join('&');

  // "오브젝트 모두 보기" 정보 (GET /scenes)
  const data: ListSectionData = await $fetch(`/scenes?query=${query}&${queryString ? `${queryString}` : ''}`);
  const filteredScenes = data.scenes.filter(scene => scene.id !== "2");

  return (
    <div className="flex flex-col pb-50">
      <ModelGrid models={filteredScenes} />
      <Pagination {...data.pages} />
    </div>
  )
}

export default ListSection;