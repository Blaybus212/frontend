'use client';

import React, { useState } from 'react';
import { ViewerIcon, HomeIcon, Note, PdfModal, QuizModal, QuizProgressModal, QuizButton, QuizSubmitButton, QuizInput, QuizAnswer, MentionDropdown, AiPanel } from '@/app/_components/viewer';

export default function ViewerTestPage() {
  const [isIconSelected, setIsIconSelected] = useState(false);
  const [isNoteSelected, setIsNoteSelected] = useState(false);
  const [noteValue, setNoteValue] = useState<string>('');
  const [quizButtonSelected, setQuizButtonSelected] = useState(false);
  const [quizInputValue, setQuizInputValue] = useState<string>('');
  const [quizAnswerVisible, setQuizAnswerVisible] = useState(false);

  const handleNoteChange = (value: string) => {
    setNoteValue(value);
  };

  return (
    <main className="p-10 space-y-16 max-w-5xl mx-auto">
      <h1 className="text-h-1xl font-bold text-text-title mb-10 border-b border-default pb-4">
        컴포넌트 테스트
      </h1>

      {/* ViewerIcon 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">ViewerIcon</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default">
          <ViewerIcon
            icon={<HomeIcon />}
            selected={isIconSelected}
            onClick={() => setIsIconSelected(!isIconSelected)}
            aria-label="홈"
          />
        </div>
      </section>

      {/* Note 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">Note</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default">
          <Note
            selected={isNoteSelected}
            value={noteValue}
            onChange={handleNoteChange}
            onFocus={() => setIsNoteSelected(true)}
            onBlur={() => setIsNoteSelected(false)}
            onClick={() => setIsNoteSelected(true)}
          />
        </div>
      </section>

      {/* PdfModal 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">PdfModal</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <PdfModal />
        </div>
      </section>

      {/* QuizModal 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizModal</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <QuizModal />
        </div>
      </section>

      {/* QuizProgressModal 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizProgressModal</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <QuizProgressModal />
        </div>
      </section>

      {/* MentionDropdown 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">MentionDropdown</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <div className="w-[256px]">
            <MentionDropdown />
          </div>
        </div>
      </section>

      {/* QuizButton 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizButton</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <div className="w-[256px] space-y-2">
            <QuizButton
              label="엔드 이펙터"
              selected={quizButtonSelected}
              onClick={() => setQuizButtonSelected(!quizButtonSelected)}
            />
            <QuizButton
              label="로봇 팔"
              selected={false}
            />
          </div>
        </div>
      </section>

      {/* QuizSubmitButton 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizSubmitButton</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <div className="w-[256px] space-y-2">
            <QuizSubmitButton enabled={false} />
            <QuizSubmitButton enabled={true} />
            <QuizSubmitButton enabled={true} isSubmitting={true} />
          </div>
        </div>
      </section>

      {/* QuizInput 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizInput</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <div className="w-[256px]">
            <QuizInput
              value={quizInputValue}
              onChange={setQuizInputValue}
              placeholder="단어를 입력하세요!"
            />
          </div>
        </div>
      </section>

      {/* QuizAnswer 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">QuizAnswer</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <div className="w-[256px] space-y-2">
            <p className="text-b-sm text-sub mb-2">기본 상태</p>
            <QuizAnswer answer="엔드 이펙터" />
            <p className="text-b-sm text-sub mb-2 mt-4">정답 (초록 보더)</p>
            <QuizAnswer answer="엔드 이펙터" isCorrect={true} />
            <p className="text-b-sm text-sub mb-2 mt-4">선택한 오답 (빨간 보더)</p>
            <QuizAnswer answer="로봇 팔" isSelected={true} isCorrect={false} />
            <p className="text-b-sm text-sub mb-2 mt-4">정답 + 선택함 (초록 보더)</p>
            <QuizAnswer answer="엔드 이펙터" isCorrect={true} isSelected={true} />
          </div>
        </div>
      </section>

      {/* AiPanel 컴포넌트 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">AiPanel</h2>
        <div className="bg-bg-sub rounded-lg p-6 border border-default flex justify-center">
          <AiPanel />
        </div>
      </section>
    </main>
  );
}
