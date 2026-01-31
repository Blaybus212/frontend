'use client';

/**
 * 모델 정보 인터페이스
 * @interface Model
 * @property {string} name - 모델의 표시 이름
 * @property {string} path - 모델 파일의 경로
 */
interface Model {
  name: string;
  path: string;
}

/**
 * ModelList 컴포넌트의 Props 인터페이스
 * @interface ModelListProps
 * @property {Model[]} models - 표시할 모델 목록
 * @property {string | null} selectedModel - 현재 선택된 모델의 경로
 * @property {(modelPath: string) => void} onSelectModel - 모델 선택 시 호출되는 콜백 함수
 */
interface ModelListProps {
  models: Model[];
  selectedModel: string | null;
  onSelectModel: (modelPath: string) => void;
}

/**
 * 모델 목록 컴포넌트
 * 
 * 사용 가능한 3D 모델 목록을 사이드바에 표시하고,
 * 사용자가 모델을 선택할 수 있게 해주는 컴포넌트입니다.
 * 
 * 주요 기능:
 * - 모델 목록을 버튼 형태로 표시
 * - 선택된 모델은 하이라이트 표시
 * - 다크 모드 지원
 * 
 * @component
 * @param {ModelListProps} props - 컴포넌트 props
 * @returns {JSX.Element} 모델 목록 사이드바 컴포넌트
 * 
 * @example
 * ```tsx
 * <ModelList
 *   models={[{ name: "Model 1", path: "/Assets/model.glb" }]}
 *   selectedModel="/Assets/model.glb"
 *   onSelectModel={(path) => console.log(path)}
 * />
 * ```
 */
function ModelList({ models, selectedModel, onSelectModel }: ModelListProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        3D 모델 목록
      </h2>
      <div className="space-y-2">
        {models.map((model) => {
          const isSelected = selectedModel === model.path;
          return (
            <button
              key={model.path}
              onClick={() => onSelectModel(model.path)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{model.name}</div>
              <div className="text-sm opacity-75 mt-1">
                {model.path.replace('/Assets/', '')}
              </div>
            </button>
          );
        })}
      </div>
      
      {models.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
          모델을 찾을 수 없습니다.
        </div>
      )}
    </div>
  );
}

export default ModelList;

