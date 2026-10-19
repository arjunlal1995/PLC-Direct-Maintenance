import React, { createContext, useContext, useState, useEffect } from 'react';

export type NightShiftPalette = 'OFF' | 'AMBER' | 'RED' | 'MONO';

export interface NightShiftState {
  isNightShift: boolean;
  palette: NightShiftPalette;
  brightness: number; // 20 - 100 (%)
  highContrast: boolean;
  blueLightCut: number; // 0 - 100 (%)
  toggleNightShift: () => void;
  setPalette: (p: NightShiftPalette) => void;
  setBrightness: (b: number) => void;
  setHighContrast: (hc: boolean) => void;
  setBlueLightCut: (cut: number) => void;
}

const NightShiftContext = createContext<NightShiftState | undefined>(undefined);

const LOCAL_STORAGE_KEY_PALETTE = 'plc_hmi_night_shift_palette';
const LOCAL_STORAGE_KEY_BRIGHTNESS = 'plc_hmi_night_shift_brightness';
const LOCAL_STORAGE_KEY_CONTRAST = 'plc_hmi_night_shift_contrast';

export const NightShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = useState<NightShiftPalette>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PALETTE);
      if (saved === 'AMBER' || saved === 'RED' || saved === 'MONO' || saved === 'OFF') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'OFF';
  });

  const [brightness, setBrightnessState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BRIGHTNESS);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 20 && val <= 100) return val;
      }
    } catch {
      // ignore
    }
    return 85;
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONTRAST);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  const [blueLightCut, setBlueLightCut] = useState<number>(100);

  const isNightShift = palette !== 'OFF';

  const setPalette = (p: NightShiftPalette) => {
    setPaletteState(p);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PALETTE, p);
    } catch {
      // ignore
    }
  };

  const setBrightness = (b: number) => {
    const clamped = Math.max(20, Math.min(100, b));
    setBrightnessState(clamped);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BRIGHTNESS, clamped.toString());
    } catch {
      // ignore
    }
  };

  const setHighContrast = (hc: boolean) => {
    setHighContrastState(hc);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONTRAST, hc.toString());
    } catch {
      // ignore
    }
  };

  const toggleNightShift = () => {
    if (isNightShift) {
      setPalette('OFF');
    } else {
      setPalette('AMBER');
    }
  };

  // Keyboard shortcut: Shift + N toggles night shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        toggleNightShift();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [palette]);

  // Synchronize document data attributes for global styling
  useEffect(() => {
    const root = document.documentElement;
    if (isNightShift) {
      root.setAttribute('data-night-shift', palette.toLowerCase());
      root.classList.add('night-shift-active');
    } else {
      root.removeAttribute('data-night-shift');
      root.classList.remove('night-shift-active');
    }
  }, [isNightShift, palette]);

  return (
    <NightShiftContext.Provider
      value={{
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
      }}
    >
      <div 
        className={`w-full min-h-screen transition-colors duration-300 ${
          isNightShift 
            ? palette === 'RED'
              ? 'bg-black text-red-200'
              : palette === 'AMBER'
              ? 'bg-black text-amber-200'
              : 'bg-black text-zinc-100'
            : 'bg-slate-950 text-slate-100'
        }`}
      >
        {children}

        {/* Low-Lux Backlight PWM Dimmer Overlay for pitch black Engine Rooms */}
        {isNightShift && brightness < 100 && (
          <div
            className="fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300"
            style={{
              backgroundColor: '#000000',
              opacity: ((100 - brightness) / 100) * 0.72,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </NightShiftContext.Provider>
  );
};

export const useNightShift = (): NightShiftState => {
  const context = useContext(NightShiftContext);
  if (!context) {
    throw new Error('useNightShift must be used within a NightShiftProvider');
  }
  return context;
};
