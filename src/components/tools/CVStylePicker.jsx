import { fonts, palettes } from '../../tools/cvStyles'

export default function CVStylePicker({ style, onChange }) {
  return (
    <div className="flex flex-col gap-5">

      {/* Font picker */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Font</p>
        <div className="flex flex-wrap gap-2">
          {fonts.map((font) => (
            <button
              key={font.id}
              onClick={() => onChange({ ...style, font })}
              className={`px-4 py-2 rounded-xl border text-sm transition-colors
                ${style.font.id === font.id
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-zinc-200 text-zinc-600 hover:border-violet-300'
                }`}
              style={{ fontFamily: font.family }}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color palette */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Color</p>
        <div className="flex flex-wrap gap-2">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => onChange({ ...style, palette })}
              title={palette.label}
              className={`w-8 h-8 rounded-full border-2 transition-all
                ${style.palette.id === palette.id
                  ? 'border-violet-500 scale-110'
                  : 'border-transparent hover:scale-105'
                }`}
              style={{ backgroundColor: palette.sidebar }}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          {style.palette.label} · {style.font.label}
        </p>
      </div>
    </div>
  )
}