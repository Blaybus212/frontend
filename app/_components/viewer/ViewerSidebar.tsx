import Image from 'next/image';
import { ViewerIcon } from './ViewerIcon';
import { HomeIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, FileIcon, AiIcon, HamburgerIcon } from './icons';

interface ViewerSidebarProps {
  selectedIcon: string | null;
  isPartsOpen: boolean;
  onIconSelect: (iconId: string) => void;
  isAiPanelOpen: boolean;
  onOpenAiPanel: () => void;
  onQuizClick: () => void;
  quizProgressPercent?: number;
  isQuizMode?: boolean;
}

/**
 * 뷰어 좌측 사이드바 (홈, 줌, 리프레시, PDF, 퀴즈, 부품, AI 아이콘)
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
    <aside className="absolute left-12 top-[36px] bottom-4 flex flex-col items-center py-4 z-10">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pr-1 flex flex-col items-center gap-[22px]">
        <ViewerIcon
          icon={
            <Image
              src="/Assets/ViewerIcons/Icon-bulb.svg"
              alt=""
              width={24}
              height={24}
            />
          }
          selected={selectedIcon === 'help'}
          onClick={() => onIconSelect('help')}
          aria-label="도움말"
          tooltip="도움말"
        />
        <ViewerIcon
          icon={<HomeIcon />}
          selected={selectedIcon === 'home'}
          onClick={() => onIconSelect('home')}
          aria-label="홈"
          tooltip="홈"
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
              tooltip="줌인"
            />
            <ViewerIcon
              icon={<ZoomOutIcon />}
              selected={selectedIcon === 'zoomout'}
              onClick={() => onIconSelect('zoomout')}
              aria-label="줌아웃"
              tooltip="줌아웃"
            />
            <ViewerIcon
              icon={<RefreshIcon />}
              selected={selectedIcon === 'refresh'}
              onClick={() => onIconSelect('refresh')}
              aria-label="리프레시"
              tooltip="리프레시"
            />
            <ViewerIcon
              icon={<FileIcon />}
              selected={selectedIcon === 'pdf'}
              onClick={() => onIconSelect('pdf')}
              aria-label="PDF"
              tooltip="PDF"
            />
            <button
              type="button"
              onClick={onQuizClick}
              className={`
                w-[54px] h-[54px] rounded-full flex-shrink-0
                border border-border-default
                flex flex-col items-center justify-center
                transition-colors
                bg-bg-hovered hover:border-border-hovered
              `}
              aria-label="퀴즈"
            >
              <span className={isQuizMode ? 'text-base-black text-b-sm font-weight-semibold' : 'text-sub text-b-sm font-weight-semibold'}>
                Quiz
              </span>
            </button>

            <ViewerIcon
              icon={<HamburgerIcon />}
              selected={isPartsOpen}
              onClick={() => onIconSelect('parts')}
              aria-label="부품 리스트"
              tooltip="부품 리스트"
            />
          </>
        )}
      </div>
      {!isAiPanelOpen && !isQuizMode && (
        <div className="mt-4 mb-[40px] ai-icon-ripple">
          <ViewerIcon
            icon={<AiIcon />}
            selected={true}
            onClick={onOpenAiPanel}
            aria-label="AI"
            backgroundColor="var(--color-point-500)"
            iconColor="var(--color-base-black)"
            tooltip="AI"
          />
        </div>
      )}
    </aside>
  );
}
