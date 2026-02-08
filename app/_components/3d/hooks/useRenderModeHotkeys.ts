import React from 'react';

type RenderMode = 'normal' | 'wireframe';
type ViewMode = 'lit' | 'dim' | 'wireframe';

/**
 * 렌더링 모드 핫키(1/2/3)를 처리합니다.
 *
 * - 1: 조명 있는 일반 렌더
 * - 2: 낮은 조명 일반 렌더
 * - 3: 낮은 조명 + 와이어프레임
 */
export function useRenderModeHotkeys() {
  const [renderMode, setRenderMode] = React.useState<RenderMode>('normal');
  const [viewMode, setViewMode] = React.useState<ViewMode>('lit');

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        const isEditable =
          tagName === 'input' ||
          tagName === 'textarea' ||
          (target as HTMLElement).isContentEditable;
        if (isEditable) return;
      }

      if (event.key === '1') {
        setViewMode('lit');
        setRenderMode('normal');
      } else if (event.key === '2') {
        setViewMode('dim');
        setRenderMode('normal');
      } else if (event.key === '3') {
        setViewMode('wireframe');
        setRenderMode('wireframe');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { renderMode, viewMode, setRenderMode, setViewMode };
}
