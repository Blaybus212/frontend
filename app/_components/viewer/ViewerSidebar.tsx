/**
 * 뷰어 사이드바 컴포넌트
 * 
 * 좌측에 표시되는 뷰어 컨트롤 아이콘들을 포함하는 사이드바입니다.
 */

import Image from 'next/image';
import { ViewerIcon } from './ViewerIcon';
import { HomeIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, FileIcon, AiIcon, HamburgerIcon } from './icons';

/**
 * ViewerSidebar 컴포넌트의 Props 인터페이스
 */
interface ViewerSidebarProps {
  /** 현재 선택된 아이콘 ID */
  selectedIcon: string | null;
  /** 부품 리스트 패널 열림 여부 */
  isPartsOpen: boolean;
  /** 아이콘 선택 핸들러 */
  onIconSelect: (iconId: string) => void;
  /** AI 패널 열림 여부 */
  isAiPanelOpen: boolean;
  /** AI 패널 열기 핸들러 */
  onOpenAiPanel: () => void;
  /** 퀴즈 버튼 클릭 핸들러 */
  onQuizClick: () => void;
  /** 퀴즈 진행률(%) */
  quizProgressPercent?: number;
  /** 퀴즈 모드 여부 */
  isQuizMode?: boolean;
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
  isPartsOpen,
  onIconSelect,
  isAiPanelOpen,
  onOpenAiPanel,
  onQuizClick,
  quizProgressPercent = 0,
  isQuizMode = false,
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
      {isQuizMode ? (
        <>
          <ViewerIcon
            icon={
              <Image
                src="/Assets/ViewerIcons/Icon-bulb.svg"
                alt=""
                width={24}
                height={24}
              />
            }
            selected={false}
            onClick={() => {}}
            aria-label="퀴즈 아이콘"
          />
          <ViewerIcon
            icon={
              <Image
                src="/Assets/ViewerIcons/Icon-save.svg"
                alt=""
                width={24}
                height={24}
              />
            }
            selected={false}
            onClick={() => {}}
            aria-label="퀴즈 저장"
          />
        </>
      ) : (
        <>
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
      <button
        type="button"
        onClick={onQuizClick}
        className={`
          w-[54px] h-[54px] rounded-full
          border border-border-default
          flex flex-col items-center justify-center
          transition-colors
          bg-bg-hovered hover: hover:border-border-hovered
        `}
        aria-label="퀴즈"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke={isQuizMode ? 'var(--color-base-black)' : 'var(--color-sub)'}
            strokeWidth="1.8"
          />
          <path
            d="M9.5 9.5a2.5 2.5 0 1 1 4.1 1.9c-.8.6-1.1 1-1.1 2"
            stroke={isQuizMode ? 'var(--color-base-black)' : 'var(--color-sub)'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="16.7"
            r="1"
            fill={isQuizMode ? 'var(--color-base-black)' : 'var(--color-sub)'}
          />
        </svg>
      </button>

      <ViewerIcon
        icon={<HamburgerIcon />}
        selected={isPartsOpen}
        onClick={() => onIconSelect('parts')}
        aria-label="부품 리스트"
      />

      {/* AI 패널 열기 버튼: AI 아이콘이 하단에 고정되어 있으며, 클릭 시 AI 패널을 엽니다 */}
      {!isAiPanelOpen && !isQuizMode && (
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
        </>
      )}
    </aside>
  );
}
