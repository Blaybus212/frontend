'use client';

export interface StudiedItem {
  id: number;
  rank: number;
  title: string;
  subTitle: string;
  diff?: number;
}

export interface StudiedList {
  items: StudiedItem[];
  onItemClick: (item: StudiedItem) => void;
}

const StudiedList = ({ items, onItemClick }: StudiedList ) => {
  return (
    <div className="w-109.25 px-6 py-[12.5px] rounded-[14px] bg-bg-default">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item) }
            className="group flex items-center justify-between px-3 py-3.5 rounded-[10px] transition-all duration-200 hover:bg-bg-hovered cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-sub text-sub text-b-md font-medium">
                {item.rank}
              </div>

              <div className="flex flex-col">
                <span className="text-b-md font-medium text-title">{item.title}</span>
                <span className="text-b-sm font-medium text-sub">{item.subTitle}</span>
              </div>
            </div>

            {item.diff !== undefined && (
              <div className={`flex gap-1 items-center text-b-sm font-regular ${item.diff > 0 ? "text-sub-red" : "text-sub"}`}>
                {/* TODO: 상승표시 svg로 교체 */}
                <p>{item.diff > 0 ? "▲" : "" }</p>
                <p>{item.diff > 0 ? `+${item.diff}` : `${item.diff}`}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudiedList;