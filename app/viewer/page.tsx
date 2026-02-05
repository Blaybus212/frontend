'use client';

import React, { useState } from 'react';
import { ViewerIcon, HomeIcon } from '@/app/_components/viewer';
import { Note } from '@/app/_components/note';

export default function ViewerTestPage() {
  const [isIconSelected, setIsIconSelected] = useState(false);
  const [isNoteSelected, setIsNoteSelected] = useState(false);
  const [noteValue, setNoteValue] = useState<string>('');

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
    </main>
  );
}
