'use client';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export default function TextInput({ 
  label,
  value, 
  onChange, 
  placeholder, 
}: TextInputProps) {
  return (
    <div className="w-full group">
      <label className="text-b-md font-regular text-sub2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-5 py-4 mt-3 rounded-[10px] bg-bg-default border text-b-xl transition-all duration-300 outline-none text-title placeholder:text-placeholder
          /* [Default State] */
          border-border-default
          /* [Hover State] */
          hover:border-border-hovered
          /* [Focused State] */
          focus:border-border-focus
        `}
      />
    </div>
  );
}