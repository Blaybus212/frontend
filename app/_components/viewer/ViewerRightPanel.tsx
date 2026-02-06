/**
 * 뷰어 우측 패널 컴포넌트
 * 
 * 객체 정보와 메모를 표시하는 우측 사이드바입니다.
 */

import { Note } from './Note';
import { ObjectInfoPanel } from './ObjectInfoPanel';

/**
 * 객체 정보 데이터 타입
 */
interface ObjectData {
  /** 한글명 */
  korean: string;
  /** 영문명 */
  english: string;
  /** 설명 */
  description: string;
  /** 재질 배열 */
  materials: string[];
  /** 활용 분야 배열 */
  applications: string[];
}

/**
 * ViewerRightPanel 컴포넌트의 Props 인터페이스
 */
interface ViewerRightPanelProps {
  /** 표시할 객체 정보 데이터 */
  objectData: ObjectData;
  /** 메모 입력 필드의 값 */
  noteValue: string;
  /** 메모 값 변경 핸들러 */
  onNoteChange: (value: string) => void;
}

/**
 * 뷰어 우측 패널 컴포넌트
 * 
 * 객체 정보와 메모를 표시하는 우측 사이드바입니다.
 * 
 * **구성 요소:**
 * - 객체 정보 패널 (상단, 전체 높이의 4/9)
 * - 메모 작성 패널 (하단, 전체 높이의 5/9)
 * 
 * @param props - 컴포넌트 props
 * @returns 뷰어 우측 패널 JSX
 * 
 * @example
 * ```tsx
 * <ViewerRightPanel
 *   objectData={objectData}
 *   noteValue={noteValue}
 *   onNoteChange={setNoteValue}
 * />
 * ```
 */
export function ViewerRightPanel({
  objectData,
  noteValue,
  onNoteChange,
}: ViewerRightPanelProps) {
  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[30%] flex flex-col gap-4 z-10 border-l border-border-default pt-4 pb-4 pl-4 pr-12 bg-surface">
      {/* 객체 정보 패널: 제목, 설명, 재질, 활용 분야를 표시 (전체 높이의 4/9 비율) */}
      <ObjectInfoPanel objectData={objectData} />

      {/* 메모 작성 패널: 사용자가 학습 내용을 기록할 수 있는 텍스트 영역 (전체 높이의 5/9 비율) */}
      <div className="flex-[5] bg-bg-default rounded-2xl border border-border-default flex flex-col overflow-hidden">
        <Note
          value={noteValue}
          onChange={onNoteChange}
          placeholder="메모를 입력하세요..."
          className="flex-1 flex flex-col"
        />
      </div>
    </aside>
  );
}
