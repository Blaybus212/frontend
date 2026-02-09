export type GrassLevel = 0 | 1 | 2 | 3 | 4;
export interface GrassSectionData {
  streak: number;
  solvedQuizCount: number;
  cells: { 
    [date: string]: { score: number, level: GrassLevel }; 
  };
}

export enum SceneCategory {
  로봇공학 = "robotics",
  자동차공학 = "automotive_engineering",
  항공우주공학 = "aerospace_engineering",
  제조공학 = "manufacturing_engineering"
}
export interface LearningSectionData {
	scenes: {
		id: string;
		title: string;
    engTitle: string;
		category: string;
    imageUrl: string;
		progress: number;
    popular: boolean;
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
		totalPages: number;
	}
}