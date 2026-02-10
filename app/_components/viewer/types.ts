/**
 * 뷰어 객체 정보 (제품/부품 공통)
 * @module viewer/types
 */
export interface ObjectData {
  korean: string;
  english: string;
  description: string;
  materials?: string[];
  applications?: string[];
  /** true: 제품 전체 모드, false/undefined: 부품 선택 모드 */
  isSceneInformation?: boolean;
}
