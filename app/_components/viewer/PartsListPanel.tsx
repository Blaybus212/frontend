import type { SelectablePart } from '@/app/_components/3d/types';

interface PartsListPanelProps {
  parts: SelectablePart[];
  selectedIds: string[];
  onTogglePart: (nodeId: string) => void;
  onToggleAll: () => void;
  onClose: () => void;
}

/**
 * 부품 리스트 패널 (체크박스 선택)
 */
export function PartsListPanel({
  parts,
  selectedIds,
  onTogglePart,
  onToggleAll,
  onClose,
}: PartsListPanelProps) {
  const allSelected = parts.length > 0 && selectedIds.length === parts.length;
  const isChecked = (nodeId: string) => selectedIds.includes(nodeId);
  
  return (
    <div className="w-[320px] max-h-[460px] bg-bg-default rounded-2xl border border-border-default overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="text-b-lg font-weight-semibold text-text-title">부품 리스트</div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-bg-sub text-sub"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-default">
        <div className="text-b-sm font-weight-medium text-sub">전체 선택</div>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="h-4 w-4 accent-point-500"
        />
      </div>

      <div className="max-h-[360px] overflow-y-auto custom-scrollbar py-2 divide-y divide-border-default">
        {parts.map((part) => (
          <button
            key={part.nodeId}
            type="button"
            onClick={() => onTogglePart(part.nodeId)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-bg-sub transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-b-md font-weight-semibold text-text-title">
                {part.originalName || part.nodeId}
              </span>
            </div>
            <input
              type="checkbox"
              readOnly
              checked={isChecked(part.nodeId)}
              className="h-4 w-4 accent-point-500"
            />
          </button>
        ))}
        {parts.length === 0 && (
          <div className="px-4 py-6 text-b-sm text-sub3">부품 정보를 불러오는 중...</div>
        )}
      </div>
    </div>
  );
}
