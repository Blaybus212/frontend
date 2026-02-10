import type { ObjectData } from './types';

interface ObjectInfoPanelProps {
  objectData: ObjectData;
}

/**
 * 객체 정보 패널 (제목, 설명, 재질, 활용)
 * @param props.objectData - 제품/부품 정보
 */
export function ObjectInfoPanel({ objectData }: ObjectInfoPanelProps) {
  return (
    <div className="flex-[4] bg-bg-default rounded-2xl border border-border-default overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
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
        <section>
          <h2 className="text-b-md font-weight-semibold text-text-title mb-3">설명</h2>
          <p className="text-b-md text-sub2 leading-relaxed">
            {objectData.description}
          </p>
        </section>
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
