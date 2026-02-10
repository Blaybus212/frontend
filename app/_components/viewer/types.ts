export interface ObjectData {
  /** 한글명 */
  korean: string;
  /** 영문명 */
  english: string;
  /** 설명 */
  description: string;
  /** 재질 배열 (부품 선택 시에만 표시) */
  materials?: string[];
  /** 활용 분야 배열 (부품 선택 시에만 표시) */
  applications?: string[];
  /** 씬 정보인지 여부 */
  isSceneInformation?: boolean;
}
