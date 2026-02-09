'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ConversationMessage, ComponentInfo } from '@/app/(main)/viewer/[objectName]/actions';
import type { SelectablePart } from '@/app/_components/3d/types';
import { AiMentionMenu } from './AiMentionMenu';

/**
 * AI 대화 메시지 데이터 구조
 */
export type AiMessage = ConversationMessage;

/**
 * AI 패널 컴포넌트의 Props 인터페이스
 */
interface AiPanelProps {
  sceneId: string;
  messages: AiMessage[];
  onSendMessage: (content: string, references?: Array<{ componentId: number }>) => Promise<void>;
  isLoading: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  onClose?: () => void;
  isVisible?: boolean;
  maxExpandedHeight?: string;
  hasNext: boolean;
  onLoadMore: () => Promise<void>;
  isLoadingMore: boolean;
  parts?: SelectablePart[];
  modelName?: string;
}

/**
 * AI 어시스턴트 패널 컴포넌트
 */
export function AiPanel({
  sceneId,
  messages,
  onSendMessage,
  isLoading = false,
  isExpanded,
  onToggleExpand,
  onClose,
  isVisible = true,
  maxExpandedHeight = '922px',
  hasNext,
  onLoadMore,
  isLoadingMore,
  parts = [],
  modelName = '모델',
}: AiPanelProps) {
  const [input, setInput] = useState('');
  const [internalExpanded, setInternalExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 멘션 기능 상태
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  
  // 선택된 부품들의 dbId 저장 (references로 전송할 것)
  const [mentionedPartIds, setMentionedPartIds] = useState<number[]>([]);

  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  /**
   * 패널 확대/축소 토글 핸들러
   */
  const handleToggleExpand = () => {
    const next = !expanded;
    if (isExpanded === undefined) {
      setInternalExpanded(next);
    }
    onToggleExpand?.(next);
  };

  /**
   * @ 멘션 감지 및 드롭다운 표시
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const cursorPos = e.target.selectionStart ?? 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    
    console.log('🔍 멘션 감지:', { value, cursorPos, textBeforeCursor, partsCount: parts.length });
    
    // @ 기호의 마지막 위치 찾기
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // @ 이후의 텍스트 추출
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      console.log('✅ @ 발견:', { lastAtIndex, afterAt });
      
      // @ 이후에 공백이 없으면 멘션 활성화
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        setMentionStartIndex(lastAtIndex);
        setIsMentionOpen(true);
        
        // 드롭다운 위치 계산
        const inputElement = e.target;
        const rect = inputElement.getBoundingClientRect();
        const position = {
          top: rect.top - 250, // 입력창 위에 표시
          left: rect.left,
        };
        
        console.log('📍 멘션 드롭다운 표시:', { position, query: afterAt });
        setMentionPosition(position);
        return;
      }
    }
    
    console.log('❌ 멘션 닫기');
    // @ 가 없거나 공백이 있으면 닫기
    setIsMentionOpen(false);
  };

  /**
   * 부품 선택 시 입력창에 삽입
   */
  const handleSelectPart = (part: SelectablePart) => {
    if (mentionStartIndex === -1) return;

    const before = input.slice(0, mentionStartIndex);
    const after = input.slice(mentionStartIndex + 1 + mentionQuery.length);
    const partName = part.originalName || part.nodeName;
    
    setInput(`${before}@${partName}${after}`);
    setIsMentionOpen(false);
    
    // dbId가 있으면 references에 추가
    if (part.dbId !== undefined && part.dbId !== null) {
      setMentionedPartIds(prev => {
        // 중복 방지
        if (prev.includes(part.dbId!)) {
          return prev;
        }
        console.log('✅ 부품 참조 추가:', { dbId: part.dbId, partName });
        return [...prev, part.dbId!];
      });
    } else {
      console.warn('⚠️ 부품에 dbId가 없습니다:', part);
    }
    
    // 입력창 포커스 복원
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  /**
   * 메시지 전송 핸들러
   */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // references 생성 (componentId 배열)
    const references = mentionedPartIds.map(dbId => ({ componentId: dbId }));
    
    console.log('📤 메시지 전송:', { content: trimmed, references });

    setInput('');
    setMentionedPartIds([]); // 전송 후 초기화
    
    try {
      await onSendMessage(trimmed, references);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // TODO: 에러 처리 (토스트 메시지 등)
    }
  };

  /**
   * 스크롤 이벤트 핸들러 (무한 스크롤)
   */
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // 스크롤이 최상단에 도달하면 이전 메시지 로드
    if (container.scrollTop === 0 && hasNext && !isLoadingMore) {
      await onLoadMore();
    }
  };

  /**
   * 새 메시지가 추가되면 스크롤을 맨 아래로 이동
   */
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  /**
   * 컴포넌트 참조 렌더링
   */
  const renderReferences = (references: Record<string, ComponentInfo>) => {
    const entries = Object.entries(references);
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 pt-2 border-t border-border-default space-y-1">
        {entries.map(([id, info]) => (
          <div key={id} className="text-xs text-sub3">
            <span className="font-semibold">@{info.name}</span>
          </div>
        ))}
      </div>
    );
  };

  /**
   * 메시지 내용에서 {{id}} 형식을 @이름 으로 변환
   */
  const renderContent = (content: string, references: Record<string, ComponentInfo>) => {
    return content.replace(/\{\{(\d+)\}\}/g, (match, id) => {
      const ref = references[id];
      return ref ? `@${ref.name}` : match;
    });
  };

  const containerHeightStyle = expanded
    ? { maxHeight: maxExpandedHeight, height: maxExpandedHeight }
    : { maxHeight: '376px', height: '376px' };

  if (!isVisible) return null;

  return (
    <div
      className="w-full bg-bg-default rounded-t-2xl border border-border-default shadow-lg flex flex-col overflow-hidden transition-all duration-300 animate-slide-up"
      style={containerHeightStyle}
    >
      {/* 헤더 */}
      <header className="h-[86px] flex items-center justify-between px-6 border-b border-border-default">
        <div>
          <h2 className="text-b-xl font-weight-semibold text-text-title">AI 어시스턴트</h2>
          <p className="text-b-sm font-weight-regular text-sub">무엇이 궁금하신가요?</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-bg-sub border border-border-default hover:bg-bg-hovered transition-colors"
            aria-label={expanded ? '접기' : '펼치기'}
          >
            <Image src="/Assets/ViewerIcons/Expand.svg" alt={expanded ? '접기' : '펼치기'} width={16} height={16} />
          </button>

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

      {/* 메시지 표시 영역 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-6 py-4 overflow-y-auto space-y-3 border-b border-border-default custom-scrollbar"
      >
        {/* 이전 메시지 로딩 */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-point-500" />
          </div>
        )}

        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-b-sm text-sub3">궁금한 내용을 무엇이든 물어보세요!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`
                w-fit max-w-[80%] px-4 py-3 rounded-2xl text-b-sm
                ${
                  message.sender === 'ASSISTANT'
                    ? 'bg-bg-sub text-text-title'
                    : 'ml-auto bg-point-500 text-base-black'
                }
              `}
            >
              <div>{renderContent(message.content, message.references)}</div>
              {message.sender === 'ASSISTANT' && renderReferences(message.references)}
              <div className="text-xs text-sub3 mt-1">{message.postedAt}</div>
            </div>
          ))
        )}

        {/* AI 응답 생성 중 스피너 */}
        {isLoading && (
          <div className="w-fit max-w-[60%] px-4 py-3 rounded-2xl bg-bg-sub flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-point-500" />
            <span className="text-text-sub3 text-b-sm">답변 생성 중...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="h-[83px] px-6 py-3 relative">
        {/* 멘션 드롭다운 */}
        {isMentionOpen && (
          <>
            {console.log('🎨 멘션 드롭다운 렌더링:', { isMentionOpen, partsCount: parts.length, position: mentionPosition })}
            <AiMentionMenu
              parts={parts}
              query={mentionQuery}
              position={mentionPosition}
              onSelect={handleSelectPart}
              onClose={() => setIsMentionOpen(false)}
              modelName={modelName}
            />
          </>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-[44px] rounded-xl bg-bg-sub border border-border-default flex items-center px-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === 'Escape' && isMentionOpen) {
                  e.preventDefault();
                  setIsMentionOpen(false);
                }
              }}
              placeholder="궁금한 내용을 무엇이든 물어보세요! (@ 입력으로 부품 선택)"
              className="w-full bg-transparent border-none outline-none text-b-sm text-text-title placeholder:text-placeholder"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-[40px] h-[40px] flex items-center justify-center rounded-xl bg-point-500 text-base-black hover:bg-selected disabled:bg-bg-sub disabled:text-sub disabled:cursor-not-allowed transition-colors"
            aria-label="질문 보내기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
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
