import React, { useState, useRef, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Eye, 
  Sliders, 
  ShieldCheck, 
  Check, 
  Flame, 
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { useNightShift, NightShiftPalette } from '../context/NightShiftContext';

export const NightShiftControl: React.FC = () => {
  const {
    isNightShift,
    palette,
    brightness,
    highContrast,
    blueLightCut,
    toggleNightShift,
    setPalette,
    setBrightness,
    setHighContrast,
    setBlueLightCut,
  } = useNightShift();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const paletteOptions: { id: NightShiftPalette; label: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'OFF',
      label: 'Standard Industrial Dark',
      desc: 'Default Schneider Electric theme with emerald, cyan & slate contrast',
      badge: 'Day/ECR Light',
      color: 'border-slate-700 bg-slate-900 text-slate-300',
    },
    {
      id: 'AMBER',
      label: 'Engine Room Amber Phosphor',
      desc: 'ISO 8468 standard for low-glare engine control room. 100% blue-light cut with true-black contrast.',
      badge: 'Amber Low-Glare',
      color: 'border-amber-500 bg-amber-950/40 text-amber-300',
    },
    {
      id: 'RED',
      label: 'Bridge SOLAS Red Vision',
      desc: 'Deep crimson monochromes preserve rhodopsin rod adaptation during total blackout night watches.',
      badge: 'SOLAS Night Watch',
      color: 'border-red-500 bg-red-950/40 text-red-300',
    },
    {
      id: 'MONO',
      label: 'High-Contrast Monochrome',
      desc: 'Pitch black #000000 with razor-sharp high-lux white & amber indicators (WCAG AAA 12:1 ratio).',
      badge: 'Ultra High-Lux',
      color: 'border-zinc-400 bg-zinc-900 text-zinc-200',
    },
  ];

  return (
    <div className="relative" ref={panelRef}>
      {/* Quick Toggle / Open Settings Button in Header */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleNightShift}
          className={`px-2.5 py-1.5 rounded-xl border font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
            isNightShift
              ? palette === 'RED'
                ? 'bg-red-950/80 text-red-300 border-red-500 shadow-red-900/40'
                : palette === 'AMBER'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-amber-900/40'
                : 'bg-zinc-900 text-zinc-100 border-zinc-500 shadow-zinc-800'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title={`Toggle Night Shift Mode (Shift+N) - Currently: ${isNightShift ? palette : 'OFF'}`}
        >
          {isNightShift ? (
            <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">Night Shift</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
            isNightShift
              ? palette === 'RED'
                ? 'bg-red-500/20 text-red-300'
                : palette === 'AMBER'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-zinc-700 text-zinc-200'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isNightShift ? palette : 'OFF'}
          </span>
        </button>

        {/* Small Gear / Sliders for Palettes & Brightness */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-xl border text-xs transition ${
            isOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : isNightShift
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 hover:bg-amber-900/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Night Shift Palette & Dimmer Controls"
          aria-label="Night Shift Configuration"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown Configuration Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border-2 border-amber-500/60 shadow-2xl p-4 z-50 font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Moon className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold font-mono text-amber-300 text-sm">
                  ENGINE ROOM NIGHT SHIFT
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Low-light eye strain reduction · ISO 8468 / SOLAS
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick status bar */}
          <div className="my-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isNightShift ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="font-mono text-zinc-300">
                Status: <strong className={isNightShift ? 'text-amber-400' : 'text-zinc-400'}>
                  {isNightShift ? `Active (${palette})` : 'Disabled'}
                </strong>
              </span>
            </div>
            <button
              onClick={toggleNightShift}
              className={`px-3 py-1 rounded-lg font-mono font-bold text-xs transition ${
                isNightShift
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
              }`}
            >
              {isNightShift ? 'Turn Off' : 'Engage Night Mode'}
            </button>
          </div>

          {/* Palette Selector */}
          <div className="space-y-2 mb-4">
            <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Color Palette Preset
            </label>
            <div className="space-y-1.5">
              {paletteOptions.map((opt) => {
                const isSelected = palette === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPalette(opt.id)}
                    className={`w-full p-2 rounded-xl text-left border transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? opt.color + ' ring-1 ring-amber-400'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-zinc-100">
                          {opt.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-300">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-amber-500 text-zinc-950 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls: Brightness / Dimmer & High Contrast */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            {/* Display Backlight Dimmer */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Display Backlight Dimmer:</span>
                </span>
                <span className="text-amber-400 font-bold">{brightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>20% (Pitch Black ECR)</span>
                <span>50%</span>
                <span>100% (Normal)</span>
              </div>
            </div>

            {/* Blue Light Cut Filter */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Blue-Light Attenuation (&lt;500nm):</span>
                </span>
                <span className="text-emerald-400 font-bold">{blueLightCut}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={blueLightCut}
                onChange={(e) => setBlueLightCut(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* High Contrast Mode Boost */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-200 block">
                  High-Contrast Border & Text Boost
                </span>
                <span className="text-[10px] text-zinc-500">
                  Enhances gauge dials, borders, and critical alarm outlines
                </span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  highContrast ? 'bg-amber-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform absolute top-1 ${
                    highContrast ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Tip / Shortcut Notice */}
          <div className="mt-4 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Shift + N</kbd></span>
            <span className="text-amber-400/80">Photoreceptor Safe</span>
          </div>
        </div>
      )}
    </div>
  );
};
