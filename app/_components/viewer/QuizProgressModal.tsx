'use client';

interface QuizProgressModalProps {
  /** 현재 진행된 부품 수 */
  current?: number;
  /** 전체 부품 수 */
  total?: number;
  /** 닫기 버튼 클릭 시 호출 */
  onClose?: () => void;
}

export function QuizProgressModal({
  current = 3,
  total = 10,
  onClose,
}: QuizProgressModalProps) {
  const progress = total > 0 ? Math.min(Math.max((current / total) * 100, 0), 100) : 0;

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border 0.8px solid border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <h2 className="text-b-md font-weight-semibold text-text-title">
          더 많은 부품을 탐색하고 <br />퀴즈에 도전해 보세요!
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="w-[22px] h-[22px] flex items-center justify-center border border-border-default rounded-full bg-bg-sub text-text-sub3 text-b-md hover:bg-bg-hovered transition-colors"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      {/* 진행도 섹션 */}
      <section className="space-y-3">
        <div className="flex items-center gap-1">
          <p className="text-b-sm font-weight-regular text-sub2">
            부품 탐색 진척도
          </p>
          <p className="text-b-sm font-weight-regular text-sub">
            {current}/{total}개
          </p>
        </div>

        {/* 진행 바 */}
        <div className="w-full h-[20px] bg-bg-sub rounded-md overflow-hidden">
          <div
            className="h-full bg-point-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>
    </div>
  );
}
