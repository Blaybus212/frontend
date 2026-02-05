import React from 'react';

// 잔디 데이터 타입 (0~4 단계의 강도)
export type GrassLevel = 0 | 1 | 2 | 3 | 4;

interface SummaryCardProps {
  month: string;
  colorType: 'green' | 'orange' | 'blue' | 'pink' | 'none';
  grassData: GrassLevel[][]; // 3행 x 10열 구조의 데이터
  maxStreak: number;
  solvedQuizzes: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  month,
  colorType,
  grassData,
  maxStreak,
  solvedQuizzes,
}) => {
  // 테마에 정의된 색상 매핑
  const getColorClass = (level: GrassLevel) => {
    if (colorType === 'none' || level === 0) return 'bg-grass-green-0';
    return `bg-grass-${colorType}-${level}`;
  };

  return (
    <div className="flex items-center max-w-min gap-7.5 px-7.5 py-4.5 rounded-[14px] bg-bg-default">
      {/* 왼쪽: 월별 잔디 영역 */}
      <div className="space-y-3">
        <h3 className="text-h-sm font-semibold text-title">{month}</h3>
        <div className="grid grid-rows-3 grid-flow-col gap-[7.23px]">
          {grassData.map((row, rowIndex) =>
            row.map((level, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-5.25 h-5.25 rounded-md transition-colors duration-300 ${getColorClass(level)}`}
              />
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 통계 데이터 영역 */}
      <div className="flex flex-col gap-1.5 min-w-35 max-h-min">
        {/* 최대 연속 학습일 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sub">
            <CalendarIcon />
            <span className="text-b-sm font-regular">최대 연속 학습일</span>
          </div>
          <p className="text-h-sm font-semibold text-title">
            {maxStreak}일
          </p>
        </div>

        {/* 맞춘 퀴즈 문항 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sub">
            <TrophyIcon />
            <span className="text-b-sm font-regular">맞춘 퀴즈 문항</span>
          </div>
          <p className="text-h-sm font-semibold text-title">
            {solvedQuizzes}개
          </p>
        </div>
      </div>
    </div>
  );
};

// TODO: 병합 후 아이콘 분리
// --- 아이콘 컴포넌트 ---
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55.47.98.97 1.21C11.47 18.44 12 19 12 19s.53-.56 1.03-.79c.5-.23.97-.66.97-1.21v-2.34"></path><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"></path></svg>
);

export default SummaryCard;