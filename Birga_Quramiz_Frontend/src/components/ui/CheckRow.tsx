export default function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer select-none group border-b border-[#f0f0f0] last:border-0">
      <span className={`text-[14px] leading-5 transition-colors ${checked ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c] font-normal"}`}>
        {label}
      </span>
      <span className={`shrink-0 size-[22px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-all ml-4 ${
        checked ? "bg-[#275fdb] border-[#275fdb]" : "bg-white border-[#c8c8c8] group-hover:border-[#275fdb]"
      }`}>
        {checked && (
          <svg viewBox="0 0 10 8" fill="none" className="w-[11px] h-[9px]">
            <path d="M1 3.5l2.8 2.8L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} onClick={e => e.stopPropagation()} className="sr-only" />
    </label>
  );
}
