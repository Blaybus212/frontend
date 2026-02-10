/**
 * 특정 월의 데이터를 가져오며, 없는 날짜는 0으로 채웁니다.
 * @param year 예: 2026, month 예: 2 (1~12)
 * @returns [10, 0, 0, 10, ...] - 1일부터 말일까지의 solved 값 배열
 */

import { GrassLevel } from "@/app/_types/home";

// TODO: API에 맞게 변경
export const getFullMonthlySolvedList = (
  cells: Record<string, { score: number, level: GrassLevel }>,
  year: number,
  month: number
): number[] => {
  // 해당 월의 마지막 날짜 계산
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');

  // 1일부터 말일까지 배열 생성 및 데이터 매핑
  return Array.from({ length: lastDay }, (_, i) => {
    const dateKey = `${year}-${monthStr}-${String(i + 1).padStart(2, '0')}`;
    return cells[dateKey]?.level ?? 0;
  });
};