/**
 * 객체 정보 패널 컴포넌트
 * 
 * 3D 객체의 상세 정보(제목, 설명, 재질, 활용 분야)를 표시하는 패널입니다.
 */

import type { ObjectData } from './types';

/**
 * ObjectInfoPanel 컴포넌트의 Props 인터페이스
 */
interface ObjectInfoPanelProps {
  /** 표시할 객체 정보 데이터 */
  objectData: ObjectData;
}

/**
 * 객체 정보 패널 컴포넌트
 * 
 * 3D 객체의 상세 정보를 표시하는 패널입니다.
 * 
 * **표시되는 정보:**
 * - 제목 (한글명, 영문명)
 * - 설명
 * - 재질 (태그 형태)
 * - 활용 분야 (태그 형태)
 * 
 * @param props - 컴포넌트 props
 * @returns 객체 정보 패널 JSX
 * 
 * @example
 * ```tsx
 * <ObjectInfoPanel
 *   objectData={{
 *     korean: '로봇팔',
 *     english: 'Robot arm',
 *     description: '...',
 *     materials: ['알루미늄 합금', '탄소 섬유'],
 *     applications: ['제조', '조립'],
 *   }}
 * />
 * ```
 */
export function ObjectInfoPanel({ objectData }: ObjectInfoPanelProps) {
  return (
    <div className="flex-[4] bg-bg-default rounded-2xl border border-border-default overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
        {/* 객체 제목 영역: 제품 전체 모드(한글명+영문명) / 부품 선택 모드(영어이름만) */}
        <div>
          {objectData.isSceneInformation ? (
            <>
              <h1 className="text-h-xl font-weight-semibold text-text-title mb-1">
                {objectData.korean}
              </h1>
              <p className="text-b-md text-sub">
                {objectData.english}
              </p>
            </>
          ) : (
            <h1 className="text-h-xl font-weight-semibold text-text-title">
              {objectData.korean}
            </h1>
          )}
        </div>

        {/* 객체 설명 섹션 */}
        <section>
          <h2 className="text-b-md font-weight-semibold text-text-title mb-3">설명</h2>
          <p className="text-b-md text-sub2 leading-relaxed">
            {objectData.description}
          </p>
        </section>

        {/* 재질 정보 섹션: 부품 선택 시에만 표시 */}
        {objectData.materials && objectData.materials.length > 0 && (
          <section>
            <h2 className="text-b-md font-weight-semibold text-text-title mb-3">재질</h2>
            <div className="flex flex-wrap gap-2">
              {objectData.materials.map((material, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-bg-sub text-b-sm text-sub2 rounded-lg"
                >
                  {material}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 활용 분야 섹션: 부품 선택 시에만 표시 */}
        {objectData.applications && objectData.applications.length > 0 && (
          <section>
            <h2 className="text-b-md font-weight-semibold text-text-title mb-3">활용</h2>
            <div className="flex flex-wrap gap-2">
              {objectData.applications.map((app, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-bg-sub text-b-sm text-sub2 rounded-lg"
                >
                  {app}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
