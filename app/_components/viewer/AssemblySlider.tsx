interface AssemblySliderProps {
  value: number;
  onChange: (value: number) => void;
}

/** 조립(0)~분해(100) 슬라이더 */
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
