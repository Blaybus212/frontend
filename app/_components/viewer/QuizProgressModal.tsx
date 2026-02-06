'use client';

/**
 * QuizProgressModal 컴포넌트의 Props 인터페이스
 * @interface QuizProgressModalProps
 * @property {number} [current=3] - 현재까지 탐색한 부품 수
 * @property {number} [total=10] - 전체 부품 수
 * @property {() => void} [onClose] - 닫기 버튼 클릭 시 호출되는 콜백 함수
 */
interface QuizProgressModalProps {
  current?: number;
  total?: number;
  onClose?: () => void;
}

/**
 * 퀴즈 진행도 모달 컴포넌트
 * 
 * 사용자의 부품 탐색 진척도를 표시하는 모달입니다.
 * 현재 탐색한 부품 수와 전체 부품 수를 비교하여 진행률을 시각적으로 표시합니다.
 * 
 * **주요 기능:**
 * - 부품 탐색 진척도 표시 (현재/전체)
 * - 진행률 프로그레스 바
 * - 모달 닫기 기능
 * 
 * **사용 예시:**
 * ```tsx
 * <QuizProgressModal
 *   current={5}
 *   total={10}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 * 
 * @param {QuizProgressModalProps} props - 컴포넌트 props
 * @returns {JSX.Element} QuizProgressModal 컴포넌트
 */
export function QuizProgressModal({
  current = 3,
  total = 10,
  onClose,
}: QuizProgressModalProps) {
  /** 진행률 계산 (0-100%, 범위를 벗어나지 않도록 제한) */
  const progress = total > 0 ? Math.min(Math.max((current / total) * 100, 0), 100) : 0;

  return (
    <div className="w-[256px] bg-bg-default rounded-2xl border border-border-default px-5 py-5 shadow-lg space-y-4">
      {/* 모달 헤더: 제목과 닫기 버튼 */}
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

      {/* 진행도 표시 섹션: 현재 진행 상태와 프로그레스 바 */}
      <section className="space-y-3">
        {/* 진행도 텍스트: 현재 탐색한 부품 수와 전체 부품 수 표시 */}
        <div className="flex items-center gap-1">
          <p className="text-b-sm font-weight-regular text-sub2">
            부품 탐색 진척도
          </p>
          <p className="text-b-sm font-weight-regular text-sub">
            {current}/{total}개
          </p>
        </div>

        {/* 진행률 프로그레스 바: 노란색(point-500)으로 진행률을 시각적으로 표시 */}
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
