export type GrassLevel = 0 | 1 | 2 | 3 | 4;
export interface GrassSectionData {
  streak: number;
  solvedQuizCount: number;
  cells: { 
    [date: string]: { solved: GrassLevel }; 
  };
}

export interface LearningSectionData {
	length: number;
	scenes: {
		id: string;
		title: string;
    engTitle: string; // TODO: API에 맞게 변경 필요
    isPopular: boolean; // TODO: API에 맞게 변경 필요
		category: string;
    imageUrl: string;
		progress: number;
	}[]
}

export interface RankingSectionItem {
  id: string;
  rank: number;
  title: string;
  engTitle: string;
  rankDiff: number;
}
export type RankingSectionCategory = "all" | "my"
export interface RankingSectionData {
  today: string; 
  scenes: RankingSectionItem[];
}

export interface ListSectionItem {
  id: string;
  isPopular: boolean;
  title: string;
  engTitle: string;
  category: string;
  description: string;
  imageUrl: string;
  participantsCount: number;
}
export interface ListSectionData {
	scenes: ListSectionItem[];
	pages: {
		curPage: number; // 1-based
		size: number; // 페이지 당 항목 개수
		totalCount: number; // 전체 데이터 개수
		totalPages: number; // 전체 페이지 수
		hasNext: boolean; // 이후 페이지 존재 여부
		hasPrevious: boolean; // 이전 페이지 존재 여부 
	}
}