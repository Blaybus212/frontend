/**
 * 뷰어 사이드바 컴포넌트
 * 
 * 좌측에 표시되는 뷰어 컨트롤 아이콘들을 포함하는 사이드바입니다.
 */

import { ViewerIcon } from './ViewerIcon';
import { HomeIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, FileIcon, AiIcon, HamburgerIcon } from './icons';

/**
 * ViewerSidebar 컴포넌트의 Props 인터페이스
 */
interface ViewerSidebarProps {
  /** 현재 선택된 아이콘 ID */
  selectedIcon: string | null;
  /** 아이콘 선택 핸들러 */
  onIconSelect: (iconId: string) => void;
  /** AI 패널 열림 여부 */
  isAiPanelOpen: boolean;
  /** AI 패널 열기 핸들러 */
  onOpenAiPanel: () => void;
}

/**
 * 뷰어 사이드바 컴포넌트
 * 
 * 좌측에 세로로 배치된 뷰어 컨트롤 아이콘들을 렌더링합니다.
 * 
 * **포함된 아이콘:**
 * - 홈: 뷰어 초기 상태로 리셋
 * - 줌인: 카메라 확대
 * - 줌아웃: 카메라 축소
 * - 리프레시: 뷰어 새로고침
 * - PDF: PDF 출력 모달 열기
 * - 퀴즈: 퀴즈 진행도 표시
 * - AI: AI 패널 열기 (하단 고정)
 * 
 * @param props - 컴포넌트 props
 * @returns 뷰어 사이드바 JSX
 * 
 * @example
 * ```tsx
 * <ViewerSidebar
 *   selectedIcon={selectedIcon}
 *   onIconSelect={setSelectedIcon}
 *   isAiPanelOpen={isAiPanelOpen}
 *   onOpenAiPanel={() => setIsAiPanelOpen(true)}
 * />
 * ```
 */
export function ViewerSidebar({
  selectedIcon,
  onIconSelect,
  isAiPanelOpen,
  onOpenAiPanel,
}: ViewerSidebarProps) {
  return (
    <aside className="absolute left-12 top-[96px] bottom-4 flex flex-col items-center gap-[22px] py-4 z-10">
      {/* 뷰어 컨트롤 아이콘들 */}
      <ViewerIcon
        icon={<HomeIcon />}
        selected={selectedIcon === 'home'}
        onClick={() => onIconSelect('home')}
        aria-label="홈"
      />
      <ViewerIcon
        icon={<ZoomInIcon />}
        selected={selectedIcon === 'zoomin'}
        onClick={() => onIconSelect('zoomin')}
        aria-label="줌인"
      />
      <ViewerIcon
        icon={<ZoomOutIcon />}
        selected={selectedIcon === 'zoomout'}
        onClick={() => onIconSelect('zoomout')}
        aria-label="줌아웃"
      />
      <ViewerIcon
        icon={<RefreshIcon />}
        selected={selectedIcon === 'refresh'}
        onClick={() => onIconSelect('refresh')}
        aria-label="리프레시"
      />
      <ViewerIcon
        icon={<FileIcon />}
        selected={selectedIcon === 'pdf'}
        onClick={() => onIconSelect('pdf')}
        aria-label="PDF"
      />
      
      {/* 퀴즈 진행도 표시 버튼: 현재 퀴즈 완료율을 표시 */}
      <button className="w-[54px] h-[54px] rounded-full bg-bg-sub border border-border-default flex flex-col items-center justify-center hover:bg-bg-hovered transition-colors">
        <span className="text-b-sm font-weight-semibold text-text-title">퀴즈</span>
        <span className="text-b-xs text-point-500">50%</span>
      </button>

      <ViewerIcon
        icon={<HamburgerIcon />}
        selected={selectedIcon === 'parts'}
        onClick={() => onIconSelect('parts')}
        aria-label="부품 리스트"
      />

      {/* AI 패널 열기 버튼: AI 아이콘이 하단에 고정되어 있으며, 클릭 시 AI 패널을 엽니다 */}
      {!isAiPanelOpen && (
        <div className="mt-auto mb-[40px] ai-icon-ripple">
          <ViewerIcon
            icon={<AiIcon />}
            selected={true}
            onClick={onOpenAiPanel}
            aria-label="AI"
            backgroundColor="var(--color-point-500)"
            iconColor="var(--color-base-black)"
          />
        </div>
      )}
    </aside>
  );
}
