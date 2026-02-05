'use client';

import React, { useState } from 'react';
import { ViewerIcon, HomeIcon, FileIcon, FolderIcon, SettingsIcon, UserIcon } from '@/app/_components/viewer';

export default function ViewerTestPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(2);

  return (
    <main className="p-10 space-y-16 max-w-5xl mx-auto">
      <h1 className="text-h-1xl font-bold text-text-title mb-10 border-b border-default pb-4">
        Viewer Icon 컴포넌트 테스트
      </h1>

      {/* 1. 상태별 예시 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">1. 상태별 예시</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <div className="flex flex-col items-center gap-6">
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">기본 상태</p>
              <ViewerIcon />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">호버 상태 (마우스를 올려보세요)</p>
              <ViewerIcon />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">선택된 상태</p>
              <ViewerIcon selected />
            </div>
          </div>
        </div>
      </section>

      {/* 2. 인터랙티브 예시 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">2. 인터랙티브 예시</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <p className="text-b-md text-text-description text-center">
            아이콘을 클릭하여 선택 상태를 변경할 수 있습니다.
          </p>
          <div className="flex flex-col items-center gap-6">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2 text-center">
                <p className="text-b-sm text-text-sub3 mb-2">
                  아이콘 {index + 1}
                  {selectedIndex === index && (
                    <span className="ml-2 text-point-500">(선택됨)</span>
                  )}
                </p>
                <ViewerIcon
                  selected={selectedIndex === index}
                  onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 크기 변형 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">3. 크기 변형</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <div className="flex flex-col items-center gap-8">
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">작은 크기 (32px)</p>
              <ViewerIcon size={32} />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">기본 크기 (54px)</p>
              <ViewerIcon size={54} />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-4">큰 크기 (64px)</p>
              <ViewerIcon size={64} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. 여러 아이콘 예시 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">4. 여러 아이콘 예시</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <p className="text-b-md text-text-description text-center mb-6">
            다양한 아이콘을 사용할 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-2">집 아이콘</p>
              <ViewerIcon icon={<HomeIcon />} aria-label="홈" />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-2">파일 아이콘</p>
              <ViewerIcon icon={<FileIcon />} aria-label="파일" />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-2">폴더 아이콘</p>
              <ViewerIcon icon={<FolderIcon />} aria-label="폴더" />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-2">설정 아이콘</p>
              <ViewerIcon icon={<SettingsIcon />} aria-label="설정" />
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-text-sub3 text-b-sm mb-2">사용자 아이콘</p>
              <ViewerIcon icon={<UserIcon />} aria-label="사용자" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. 여러 아이콘 인터랙티브 예시 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">5. 여러 아이콘 인터랙티브 예시</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <p className="text-b-md text-text-description text-center mb-6">
            여러 아이콘 중 하나를 선택할 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {[
              { icon: <HomeIcon />, label: '홈' },
              { icon: <FileIcon />, label: '파일' },
              { icon: <FolderIcon />, label: '폴더' },
              { icon: <SettingsIcon />, label: '설정' },
              { icon: <UserIcon />, label: '사용자' },
            ].map((item, index) => (
              <div key={index} className="space-y-2 text-center">
                <p className="text-text-sub3 text-b-sm mb-2">
                  {item.label}
                  {selectedIndex === index && (
                    <span className="ml-2 text-point-500">(선택됨)</span>
                  )}
                </p>
                <ViewerIcon
                  icon={item.icon}
                  selected={selectedIndex === index}
                  onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 사용된 색상 */}
      <section className="space-y-6">
        <h2 className="text-h-lg font-semibold text-point-500">6. 사용된 색상 (globals.css 변수)</h2>
        <div className="bg-bg-sub rounded-lg p-6 space-y-8 border border-default">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-grass-green-0)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">배경색</p>
                <p className="text-b-sm text-text-sub2">--color-grass-green-0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-border-default)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">기본 테두리</p>
                <p className="text-b-sm text-text-sub2">--color-border-default</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-sub3)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">기본 아이콘</p>
                <p className="text-b-sm text-text-sub2">--color-sub3</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-border-hovered)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">호버 테두리</p>
                <p className="text-b-sm text-text-sub2">--color-border-hovered</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-description)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">호버 아이콘</p>
                <p className="text-b-sm text-text-sub2">--color-description</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border border-default"
                style={{ backgroundColor: 'var(--color-border-focus)' }}
              />
              <div>
                <p className="text-b-md font-medium text-text-title">선택 테두리/아이콘</p>
                <p className="text-b-sm text-text-sub2">--color-border-focus</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
