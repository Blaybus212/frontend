/**
 * 조립/분해 슬라이더 컴포넌트
 * 
 * 3D 모델의 조립/분해 상태를 조절하는 슬라이더 컨트롤입니다.
 */

/**
 * AssemblySlider 컴포넌트의 Props 인터페이스
 */
interface AssemblySliderProps {
  /** 현재 슬라이더 값 (0-100) */
  value: number;
  /** 값 변경 핸들러 */
  onChange: (value: number) => void;
}

/**
 * 조립/분해 슬라이더 컴포넌트
 * 
 * 3D 모델의 조립/분해 상태를 조절하는 슬라이더입니다.
 * 좌측은 "조립", 우측은 "분해"를 나타냅니다.
 * 
 * @param props - 컴포넌트 props
 * @returns 조립/분해 슬라이더 JSX
 * 
 * @example
 * ```tsx
 * <AssemblySlider
 *   value={assemblyValue}
 *   onChange={setAssemblyValue}
 * />
 * ```
 */
export function AssemblySlider({ value, onChange }: AssemblySliderProps) {
  return (
    <div className="absolute flex flex-row items-center gap-4 top-10 left-[35%] transform -translate-x-1/2 w-[550px] h-[54px] px-[37.5px] bg-bg-default rounded-full border border-border-default z-10">
      <span className="text-b-md font-weight-medium text-sub whitespace-nowrap">조립</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-bg-sub rounded-full appearance-none cursor-pointer slider-custom"
        style={{
          background: `linear-gradient(to right, var(--color-point-500) 0%, var(--color-point-500) ${value}%, var(--color-bg-sub) ${value}%, var(--color-bg-sub) 100%)`,
        }}
      />
      <span className="text-b-md font-weight-medium text-sub whitespace-nowrap">분해</span>
    </div>
  );
}
