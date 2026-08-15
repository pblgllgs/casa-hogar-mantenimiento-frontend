import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ColorSelect({ value, onChange, options, colorMap, placeholder = '-- Seleccionar --' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="input-field text-left flex items-center gap-2 cursor-pointer"
        style={{ paddingRight: '2rem' }}>
        {value && colorMap[value] && (
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorMap[value] }} />
        )}
        <span className="flex-1 truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={16} className="shrink-0 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${value === o.value ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
              {colorMap[o.value] && (
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorMap[o.value] }} />
              )}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
