'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * AI 메시지의 역할 타입
 * @typedef {'user' | 'assistant'} AiMessageRole
 */
type AiMessageRole = 'user' | 'assistant';

/**
 * AI 대화 메시지 데이터 구조
 * @typedef {Object} AiMessage
 * @property {string} id - 메시지의 고유 식별자
 * @property {AiMessageRole} role - 메시지 작성자 역할 (사용자 또는 어시스턴트)
 * @property {string} content - 메시지 내용
 */
export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
};

/**
 * AI 패널 컴포넌트의 Props 인터페이스
 * @interface AiPanelProps
 * @property {AiMessage[]} [messages] - 대화 메시지 리스트 (제어형 컴포넌트 사용 시 필수)
 * @property {(content: string) => void} [onSendMessage] - 메시지 전송 시 호출되는 콜백 함수 (제어형 컴포넌트 사용 시 필수)
 * @property {boolean} [isLoading=false] - AI 응답 생성 중 여부
 * @property {boolean} [isExpanded] - 패널의 펼쳐진 상태 (제어형 컴포넌트 사용 시 필수)
 * @property {(expanded: boolean) => void} [onToggleExpand] - 펼치기/접기 토글 시 호출되는 콜백 함수
 * @property {() => void} [onClose] - 닫기 버튼 클릭 시 호출되는 콜백 함수
 * @property {boolean} [isVisible=true] - 패널 표시 여부
 * @property {string} [maxExpandedHeight='922px'] - 확대 시 최대 높이 (CSS 값)
 */
interface AiPanelProps {
  messages?: AiMessage[];
  onSendMessage?: (content: string) => void;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  onClose?: () => void;
  isVisible?: boolean;
  maxExpandedHeight?: string;
}

/** 기본 메시지 리스트 (비제어형 컴포넌트 사용 시 초기값) */
const DEFAULT_MESSAGES: AiMessage[] = [];

/**
 * AI 어시스턴트 패널 컴포넌트
 * 
 * 3D 뷰어 하단에 표시되는 AI 채팅 인터페이스입니다. 사용자가 AI에게 질문하고 답변을 받을 수 있습니다.
 * 
 * **주요 기능:**
 * - 제어형/비제어형 컴포넌트 모두 지원
 * - 메시지 입력 및 전송
 * - 패널 확대/축소 기능
 * - 로딩 상태 표시
 * - 메시지 스크롤 영역
 * 
 * **사용 예시:**
 * ```tsx
 * // 비제어형 컴포넌트 (내부 상태 관리)
 * <AiPanel
 *   isVisible={true}
 *   onClose={() => setIsVisible(false)}
 * />
 * 
 * // 제어형 컴포넌트 (외부 상태 관리)
 * <AiPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   isExpanded={isExpanded}
 *   onToggleExpand={setIsExpanded}
 *   isLoading={isLoading}
 * />
 * ```
 * 
 * @param {AiPanelProps} props - 컴포넌트 props
 * @returns {JSX.Element | null} AI 패널 컴포넌트 또는 null (isVisible이 false일 때)
 */
export function AiPanel({
  messages,
  onSendMessage,
  isLoading = false,
  isExpanded,
  onToggleExpand,
  onClose,
  isVisible = true,
  maxExpandedHeight = '922px',
}: AiPanelProps) {
  /** 비제어형 컴포넌트용 내부 메시지 상태 */
  const [internalMessages, setInternalMessages] = useState<AiMessage[]>(
    messages ?? DEFAULT_MESSAGES,
  );
  /** 입력 필드의 현재 값 */
  const [input, setInput] = useState('');
  /** 비제어형 컴포넌트용 내부 확대 상태 */
  const [internalExpanded, setInternalExpanded] = useState(false);

  /** 메시지가 제어형인지 여부 */
  const controlledMessages = messages !== undefined;
  /** 현재 사용할 메시지 리스트 (제어형이면 props, 아니면 내부 상태) */
  const currentMessages = controlledMessages ? messages! : internalMessages;

  /** 현재 확대 상태 (제어형이면 props, 아니면 내부 상태) */
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  /**
   * 패널 확대/축소 토글 핸들러
   * 제어형 컴포넌트가 아닌 경우 내부 상태를 업데이트하고, 콜백 함수를 호출합니다.
   */
  const handleToggleExpand = () => {
    const next = !expanded;
    if (isExpanded === undefined) {
      setInternalExpanded(next);
    }
    onToggleExpand?.(next);
  };

  /**
   * 메시지 전송 핸들러
   * 입력값을 검증하고, 비제어형 컴포넌트인 경우 내부 메시지 상태를 업데이트한 후,
   * onSendMessage 콜백을 호출합니다.
   */
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 비제어형 컴포넌트인 경우 내부 상태에 메시지 추가
    if (!controlledMessages) {
      const newMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      };
      setInternalMessages((prev) => [...prev, newMessage]);
    }

    onSendMessage?.(trimmed);
    setInput('');
  };

  /** 확대 상태에 따른 컨테이너 높이 스타일 */
  const containerHeightStyle = expanded
    ? { maxHeight: maxExpandedHeight, height: maxExpandedHeight }
    : { maxHeight: '376px', height: '376px' };

  if (!isVisible) return null;

  return (
    <div
        className={`
          w-full
          bg-bg-default
          rounded-t-2xl
          border border-border-default
          shadow-lg
          flex flex-col
          overflow-hidden
          transition-all duration-300
          animate-slide-up
        `}
        style={containerHeightStyle}
      >
      {/* 헤더 영역: 제목, 설명, 확대/축소 버튼, 닫기 버튼 */}
      <header className="h-[86px] flex items-center justify-between px-6 border-b border-border-default">
        <div>
          <h2 className="text-b-xl font-weight-semibold text-text-title">
            AI 어시스턴트
          </h2>
          <p className="text-b-sm font-weight-regular text-sub">
            무엇이 궁금하신가요?
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 패널 확대/축소 토글 버튼 */}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-bg-sub border border-border-default hover:bg-bg-hovered transition-colors"
            aria-label={expanded ? '접기' : '펼치기'}
          >
            <Image
              src="/Assets/ViewerIcons/Expand.svg"
              alt={expanded ? '접기' : '펼치기'}
              width={16}
              height={16}
            />
          </button>

          {/* 패널 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-bg-sub border border-border-default text-text-sub3 text-[16px] hover:bg-bg-hovered transition-colors"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      </header>

      {/* 메시지 표시 영역: 사용자와 AI의 대화 내용을 표시하며 스크롤 가능 */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3 border-b border-border-default custom-scrollbar">
        {currentMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-b-sm text-sub3">
              궁금한 내용을 무엇이든 물어보세요!
            </p>
          </div>
        ) : (
          currentMessages.map((message) => (
            <div
              key={message.id}
              className={`
                w-fit max-w-[80%] px-4 py-3 rounded-2xl text-b-sm
                ${
                  message.role === 'assistant'
                    ? 'bg-bg-sub text-text-title'
                    : 'ml-auto bg-point-500 text-base-black'
                }
              `}
            >
              {message.content}
            </div>
          ))
        )}

        {/* AI 응답 생성 중일 때 표시되는 로딩 인디케이터 */}
        {isLoading && (
          <div className="w-fit max-w-[60%] px-4 py-2 rounded-2xl bg-bg-sub text-text-sub3 text-b-sm">
            답변 생성 중...
          </div>
        )}
      </div>

      {/* 하단 입력 영역: 사용자가 메시지를 입력하고 전송하는 영역 */}
      <div className="h-[83px] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[44px] rounded-xl bg-bg-sub border border-border-default flex items-center px-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="궁금한 내용을 무엇이든 물어보세요!"
              className="w-full bg-transparent border-none outline-none text-b-sm text-text-title placeholder:text-placeholder"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`
              w-[40px] h-[40px] flex items-center justify-center rounded-xl
              bg-point-500 text-base-black
              hover:bg-selected
              disabled:bg-bg-sub disabled:text-sub disabled:cursor-not-allowed
              transition-colors
            `}
            aria-label="질문 보내기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
            >
              <g clipPath="url(#clip0_144_1976)">
                <path
                  d="M12.1135 18.0726C12.1452 18.1515 12.2002 18.2188 12.2712 18.2656C12.3423 18.3123 12.4259 18.3362 12.5109 18.334C12.5959 18.3318 12.6781 18.3037 12.7467 18.2534C12.8152 18.2031 12.8668 18.133 12.8943 18.0526L18.311 2.21928C18.3377 2.14544 18.3428 2.06553 18.3257 1.9889C18.3086 1.91228 18.27 1.8421 18.2145 1.78659C18.159 1.73108 18.0888 1.69252 18.0122 1.67544C17.9356 1.65835 17.8557 1.66344 17.7818 1.69011L1.9485 7.10678C1.86808 7.13435 1.79802 7.18587 1.74772 7.25442C1.69743 7.32296 1.66931 7.40525 1.66713 7.49024C1.66495 7.57523 1.68883 7.65885 1.73555 7.72988C1.78226 7.80091 1.84959 7.85595 1.9285 7.88761L8.53683 10.5376C8.74574 10.6212 8.93554 10.7463 9.0948 10.9053C9.25406 11.0643 9.37948 11.2539 9.4635 11.4626L12.1135 18.0726Z"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.2114 1.79004L9.09473 10.9059"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_144_1976">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

