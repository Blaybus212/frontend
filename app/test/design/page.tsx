import React from 'react';

export default function DesignSystemPage() {
  return (
    <main className="p-10 space-y-16 max-w-5xl mx-auto">
      <h1 className="text-h-1xl font-bold text-text-title mb-10 border-b border-default pb-4">
        디자인 시스템 가이드라인
      </h1>

      {/* 1. Typography Section */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">1. Typography</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <div className="space-y-4">
            <p className="text-text-sub3 text-b-sm border-b border-default pb-1 uppercase">Headings</p>
            <div className="flex flex-col gap-4">
              <div className="text-h-1xl font-bold">Heading 1xl (32px/44px) - Bold</div>
              <div className="text-h-xl font-semibold">Heading xl (28px/36px) - Semibold</div>
              <div className="text-h-lg font-medium">Heading lg (24px/28px) - Medium</div>
              <div className="text-h-md font-regular">Heading md (22px/32px) - Regular</div>
              <div className="text-h-sm font-bold">Heading sm (20px/32px) - Bold</div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-text-sub3 text-b-sm border-b border-default pb-1 uppercase">Body</p>
            <div className="flex flex-col gap-4">
              <div className="text-b-xl">Body xl (18px/28px)</div>
              <div className="text-b-lg text-description">Body lg (16px/24px) - Description Color</div>
              <div className="text-b-md text-sub">Body md (14px/20px) - Sub Color</div>
              <div className="text-b-sm text-sub3">Body sm (12px/16px) - Sub3 Color</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Color System Section */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">2. Color System</h2>
        
        {/* Primary Colors */}
        <div className="space-y-4">
          <p className="text-text-title font-medium">Primary Colors</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorCard label="Surface" colorClass="bg-surface" hex="#161921" />
            <ColorCard label="Point 500" colorClass="bg-point-500 text-base-black" hex="#CFFF5E" />
            <ColorCard label="BG Default" colorClass="bg-default" hex="#252931" />
            <ColorCard label="BG Sub" colorClass="bg-bg-default" hex="#1A1D24" />
          </div>
        </div>

        {/* Grass Intensity Scale (하드코딩 버전) */}
        <div className="space-y-4 pt-4">
          <p className="text-text-title font-medium">Grass Intensity (0 - 4)</p>
          <div className="space-y-8 bg-bg-sub p-6 rounded-lg border border-default">
            
            {/* Green Scale */}
            <div className="flex flex-col gap-2">
              <span className="text-b-sm text-text-sub3 font-medium uppercase">Green</span>
              <div className="flex gap-2 text-[10px] font-bold text-center">
                <div className="flex-1 h-12 rounded bg-grass-green-0 border border-default flex items-center justify-center">0</div>
                <div className="flex-1 h-12 rounded bg-grass-green-1 border border-default flex items-center justify-center">1</div>
                <div className="flex-1 h-12 rounded bg-grass-green-2 border border-default flex items-center justify-center">2</div>
                <div className="flex-1 h-12 rounded bg-grass-green-3 border border-default flex items-center justify-center">3</div>
                <div className="flex-1 h-12 rounded bg-grass-green-4 border border-default flex items-center justify-center text-base-black">4</div>
              </div>
            </div>

            {/* Orange Scale */}
            <div className="flex flex-col gap-2">
              <span className="text-b-sm text-text-sub3 font-medium uppercase">Orange</span>
              <div className="flex gap-2 text-[10px] font-bold text-center">
                <div className="flex-1 h-12 rounded bg-grass-orange-0 border border-default flex items-center justify-center">0</div>
                <div className="flex-1 h-12 rounded bg-grass-orange-1 border border-default flex items-center justify-center text-base-black">1</div>
                <div className="flex-1 h-12 rounded bg-grass-orange-2 border border-default flex items-center justify-center text-base-black">2</div>
                <div className="flex-1 h-12 rounded bg-grass-orange-3 border border-default flex items-center justify-center">3</div>
                <div className="flex-1 h-12 rounded bg-grass-orange-4 border border-default flex items-center justify-center">4</div>
              </div>
            </div>

            {/* Blue Scale */}
            <div className="flex flex-col gap-2">
              <span className="text-b-sm text-text-sub3 font-medium uppercase">Blue</span>
              <div className="flex gap-2 text-[10px] font-bold text-center">
                <div className="flex-1 h-12 rounded bg-grass-blue-0 border border-default flex items-center justify-center">0</div>
                <div className="flex-1 h-12 rounded bg-grass-blue-1 border border-default flex items-center justify-center">1</div>
                <div className="flex-1 h-12 rounded bg-grass-blue-2 border border-default flex items-center justify-center">2</div>
                <div className="flex-1 h-12 rounded bg-grass-blue-3 border border-default flex items-center justify-center">3</div>
                <div className="flex-1 h-12 rounded bg-grass-blue-4 border border-default flex items-center justify-center">4</div>
              </div>
            </div>

            {/* Pink Scale */}
            <div className="flex flex-col gap-2">
              <span className="text-b-sm text-text-sub3 font-medium uppercase">Pink</span>
              <div className="flex gap-2 text-[10px] font-bold text-center">
                <div className="flex-1 h-12 rounded bg-grass-pink-0 border border-default flex items-center justify-center">0</div>
                <div className="flex-1 h-12 rounded bg-grass-pink-1 border border-default flex items-center justify-center">1</div>
                <div className="flex-1 h-12 rounded bg-grass-pink-2 border border-default flex items-center justify-center">2</div>
                <div className="flex-1 h-12 rounded bg-grass-pink-3 border border-default flex items-center justify-center">3</div>
                <div className="flex-1 h-12 rounded bg-grass-pink-4 border border-default flex items-center justify-center">4</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Components Preview */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">3. Components Preview</h2>
        <div className="flex flex-wrap gap-6">
          <div className="w-80 p-6 bg-bg-sub border border-default rounded-xl shadow-lg">
            <span className="text-grass-orange-4 text-b-sm font-bold uppercase tracking-wider">Feature</span>
            <h3 className="text-h-sm font-bold mt-2 text-text-title">Design System Card</h3>
            <p className="text-text-description text-b-md mt-2">
              안녕하세요. 디자인 시스템이 적용된 카드 컴포넌트입니다.
            </p>
            <button className="mt-6 w-full py-3 bg-point-500 text-base-black font-bold rounded-lg hover:bg-selected transition-all active:scale-[0.98]">
              Action Button
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

// 컬러 카드 헬퍼 (단순 반복이라 유지하되 클래스명 체크)
function ColorCard({ label, colorClass, hex }: { label: string; colorClass: string; hex: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-16 w-full rounded-md border border-default flex items-center justify-center font-bold text-[12px] ${colorClass}`}>
        {hex}
      </div>
      <p className="text-b-sm text-text-sub2 text-center">{label}</p>
    </div>
  );
}