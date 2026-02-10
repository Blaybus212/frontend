export const generatePagination = (currentPage: number, totalPages: number) => {
  // 1. 방어 코드: 페이지가 없거나 1개뿐일 때
  if (!totalPages || totalPages <= 0) return [];
  if (totalPages === 1) return [1];

  // 2. 전체 페이지가 적을 때는 생략 없이 모두 나열 (최대 7개까지)
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // 3. 생략 기호(...)가 들어갈 위치 계산
  const showLeftEllipsis = currentPage > 3;
  const showRightEllipsis = currentPage < totalPages - 2;

  // Case 1: 왼쪽만 생략 (현재 페이지가 마지막 근처일 때)
  // [1, '...', 7, 8, 9, 10]
  if (showLeftEllipsis && !showRightEllipsis) {
    const lastItems = [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', ...lastItems];
  }

  // Case 2: 오른쪽만 생략 (현재 페이지가 처음 근처일 때)
  // [1, 2, 3, 4, '...', 10]
  if (!showLeftEllipsis && showRightEllipsis) {
    const firstItems = [1, 2, 3, 4];
    return [...firstItems, '...', totalPages];
  }

  // Case 3: 양쪽 모두 생략 (현재 페이지가 중간일 때)
  // [1, '...', 4, 5, 6, '...', 10]
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};