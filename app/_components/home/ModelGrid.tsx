'use client';

import { ListSectionItem } from "@/app/_types/home";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ModelGridProps {
  models: ListSectionItem[];
}

const ModelGrid: React.FC<ModelGridProps> = ({ models }) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-10">
      {models.map((scene) => (
        <div key={scene.id} onClick={()=>router.push(`/viewer/${scene.title}`)} className="group w-full max-w-108 rounded-[14px] overflow-hidden bg-bg-default hover:bg-bg-hovered cursor-pointer">
          
          <div className="relative w-full h-52.5 overflow-hidden bg-bg-sub">
            <Image
              src={`/thumb/${scene.title}.png`}
              alt={scene.title}
              fill
              className="object-cover transition-transform duration-250 ease-out group-hover:scale-105"
            />
          </div>

          <div className="px-4 py-[16.56px] space-y-3.5">

            <div className="flex items-baseline gap-1.5">
              <h3 className="text-b-lg font-medium text-title">{scene.title}</h3>
              <span className="text-b-md font-regular text-sub">{scene.engTitle}</span>
            </div>

            <p className="text-b-md font-regular text-description leading-relaxed line-clamp-2">
              {scene.description}
            </p>

            <div className="flex items-center justify-between pt-px">
              <span className="px-3 py-1 rounded-full bg-bg-sub text-sub2 text-b-sm font-regular">
                {scene.category}
              </span>
              <div className="flex items-center gap-0.5 text-sub2">
                <Image
                  src="/images/people-icon.svg"
                  alt="사람들 모양 아이콘"
                  width={24}
                  height={24}
                />
                <p>{scene.participantsCount}</p>
              </div>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
}

export default ModelGrid;