import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, 
  RefreshCw, 
  Search, 
  Sliders, 
  ArrowRightLeft, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Database, 
  Filter, 
  Radio, 
  Zap, 
  Clock, 
  Send,
  Gauge,
  Cpu,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { PlcRegisterReading, PlcIoCategory, PlcIoCustomization } from '../types';
import { INITIAL_PLC_REGISTERS, ModbusPacketLog, generateSimulatedModbusTraffic } from '../data/plcScenariosData';
import { PlcIoCustomizationModal } from './PlcIoCustomizationModal';
import { useNightShift } from '../context/NightShiftContext';

interface PlcLiveDataReaderProps {
  onRegisterModified?: (tag: string, newValue: number) => void;
  onTriggerAlert?: (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO', title: string, message: string, tag: string) => void;
  registers?: PlcRegisterReading[];
  onUpdateRegisters?: (regs: PlcRegisterReading[]) => void;
}

const STORAGE_KEY_CUSTOMIZATIONS = 'plc_io_customizations_cache_v2';

// Helper to deduce ioCategory if not explicitly set
function getCategory(r: PlcRegisterReading): PlcIoCategory {
  if (r.ioCategory) return r.ioCategory;
  if (r.tag.startsWith('%QW') || ['%MW120', '%MW121', '%MW122', '%MW220', '%MW320', '%MW420', '%MW421'].includes(r.tag)) {
    return 'ANALOG_OUTPUT';
  }
  if (r.tag.startsWith('%Q') || ['%M30', '%M31', '%M32', '%M33', '%M34', '%M35', '%M36', '%M37'].includes(r.tag)) {
    return 'DIGITAL_OUTPUT';
  }
  if (r.tag.startsWith('%I') || r.type === 'COIL_M') {
    return 'DIGITAL_INPUT';
  }
  return 'ANALOG_INPUT';
}

export const PlcLiveDataReader: React.FC<PlcLiveDataReaderProps> = ({
  onRegisterModified,
  onTriggerAlert,
  registers: externalRegisters,
  onUpdateRegisters,
}) => {
  const { isNightShift, palette, highContrast } = useNightShift();

  // Load saved customizations from localStorage
  const [customizations, setCustomizations] = useState<Record<string, PlcIoCustomization>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMIZATIONS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Master registers state with customizations applied
  const [registers, setRegisters] = useState<PlcRegisterReading[]>(() => {
    const base = externalRegisters || INITIAL_PLC_REGISTERS;
    return base.map((r) => {
      const cat = getCategory(r);
      return {
        ...r,
        ioCategory: cat,
      };
    });
  });

  // Active Tab for I/O Channels
  const [activeIoTab, setActiveIoTab] = useState<'ALL' | 'ANALOG_INPUT' | 'ANALOG_OUTPUT' | 'DIGITAL_INPUT' | 'DIGITAL_OUTPUT'>('ALL');
  
  // Secondary Scenario Filter
  const [selectedScenario, setSelectedScenario] = useState<'ALL' | 'MAIN_ENGINE' | 'ALTERNATOR' | 'GEARBOX' | 'SAFETY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Poller controls
  const [pollingRateMs, setPollingRateMs] = useState<number>(500);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [pollCounter, setPollCounter] = useState<number>(1420);
  const [lastCycleMs, setLastCycleMs] = useState<number>(12);
  const [crcHealth, setCrcHealth] = useState<'100% OK' | 'CHECKSUM WARNING'>('100% OK');
  const [packets, setPackets] = useState<ModbusPacketLog[]>([]);

  // Selected channel for full customization modal
  const [customizingReading, setCustomizingReading] = useState<PlcRegisterReading | null>(null);

  // Sync external registers if provided
  useEffect(() => {
    if (externalRegisters) {
      setRegisters((prev) => {
        return externalRegisters.map((ext) => {
          const cat = getCategory(ext);
          const c = customizations[ext.tag];
          return {
            ...ext,
            ioCategory: cat,
            customization: c || ext.customization,
          };
        });
      });
    }
  }, [externalRegisters, customizations]);

  // Save customizations to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATIONS, JSON.stringify(customizations));
    } catch (e) {
      // Ignore quota errors
    }
  }, [customizations]);

  // Live polling effect: simulates Modbus scanning with calibration and forced override handling
  useEffect(() => {
    if (!isPollingActive) return;

    const interval = setInterval(() => {
      setPollCounter((c) => c + 1);
      const scanTime = Math.floor(10 + Math.random() * 6);
      setLastCycleMs(scanTime);

      setRegisters((prev) => {
        const updated = prev.map((r) => {
          const cat = r.ioCategory || getCategory(r);
          const c = customizations[r.tag];

          // If forced override is active on this channel, hold the forced value
          if (c && c.isForced && c.forcedValue !== undefined) {
            const forcedVal = c.forcedValue;
            const decimals = c.decimals !== undefined ? c.decimals : r.decimals;
            const rawInt = Math.round(forcedVal * Math.pow(10, decimals));
            const rawHex = '0x' + (rawInt < 0 ? 0 : rawInt).toString(16).toUpperCase().padStart(4, '0');
            return {
              ...r,
              scaledValue: forcedVal,
              rawInt,
              rawHex,
              lastPolled: Date.now(),
              customization: c,
            };
          }

          // Digital Input / Output polling: infrequent random toggles on non-critical inputs
          if (cat === 'DIGITAL_INPUT' || cat === 'DIGITAL_OUTPUT' || r.type === 'COIL_M') {
            return { 
              ...r, 
              lastPolled: Date.now(),
              customization: c,
            };
          }

          // Analog scaling and jitter
          const calOffset = c && c.calOffset !== undefined ? c.calOffset : 0;
          const calGain = c && c.calGain !== undefined ? c.calGain : 1.0;
          const decimals = c && c.decimals !== undefined ? c.decimals : r.decimals;
          const min = c && c.minScale !== undefined ? c.minScale : r.min;
          const max = c && c.maxScale !== undefined ? c.maxScale : r.max;

          // For outputs without forced override, do not fluctuate wildly, slight steady hold
          if (cat === 'ANALOG_OUTPUT') {
            return {
              ...r,
              lastPolled: Date.now(),
              customization: c,
            };
          }

          // Sensor micro drift ±0.4%
          const jitter = (Math.random() - 0.5) * (max - min) * 0.004;
          let newScaled = Number(((r.scaledValue + jitter) * calGain + calOffset * 0.01).toFixed(decimals));
          newScaled = Math.max(min, Math.min(max, newScaled));

          // Threshold evaluation with customizations
          const enableThresholds = c && c.enableThresholds !== undefined ? c.enableThresholds : true;
          const warnMin = enableThresholds ? (c && c.warnMin !== undefined ? c.warnMin : r.warnMin) : undefined;
          const warnMax = enableThresholds ? (c && c.warnMax !== undefined ? c.warnMax : r.warnMax) : undefined;
          const alarmMin = enableThresholds ? (c && c.alarmMin !== undefined ? c.alarmMin : r.alarmMin) : undefined;
          const alarmMax = enableThresholds ? (c && c.alarmMax !== undefined ? c.alarmMax : r.alarmMax) : undefined;

          let status: PlcRegisterReading['status'] = 'NORMAL';
          if (alarmMin !== undefined && newScaled < alarmMin) status = 'ALARM';
          else if (alarmMax !== undefined && newScaled > alarmMax) status = 'ALARM';
          else if (warnMin !== undefined && newScaled < warnMin) status = 'WARNING';
          else if (warnMax !== undefined && newScaled > warnMax) status = 'WARNING';

          const rawInt = Math.round(newScaled * Math.pow(10, decimals));
          const rawHex = '0x' + (rawInt < 0 ? 0 : rawInt).toString(16).toUpperCase().padStart(4, '0');

          return {
            ...r,
            scaledValue: newScaled,
            rawInt,
            rawHex,
            status,
            lastPolled: Date.now(),
            customization: c,
          };
        });

        if (onUpdateRegisters) {
          onUpdateRegisters(updated);
        }
        return updated;
      });

      // Simulated background Modbus traffic packets
      setPackets((prev) => [
        generateSimulatedModbusTraffic(pollCounter % 1000),
        ...prev.slice(0, 5)
      ]);
    }, pollingRateMs);

    return () => clearInterval(interval);
  }, [isPollingActive, pollingRateMs, pollCounter, onUpdateRegisters, customizations]);

  // Tab counts
  const counts = useMemo(() => {
    let ai = 0;
    let ao = 0;
    let di = 0;
    let doCount = 0;
    let forced = 0;
    let alarms = 0;

    registers.forEach((r) => {
      const cat = r.ioCategory || getCategory(r);
      if (cat === 'ANALOG_INPUT') ai++;
      else if (cat === 'ANALOG_OUTPUT') ao++;
      else if (cat === 'DIGITAL_INPUT') di++;
      else if (cat === 'DIGITAL_OUTPUT') doCount++;

      const c = customizations[r.tag];
      if (c && c.isForced) forced++;
      if (r.status === 'ALARM') alarms++;
    });

    return { total: registers.length, ai, ao, di, doCount, forced, alarms };
  }, [registers, customizations]);

  // Filtered readings list
  const filteredRegisters = useMemo(() => {
    return registers.filter((r) => {
      const cat = r.ioCategory || getCategory(r);

      // Tab filter
      if (activeIoTab !== 'ALL' && cat !== activeIoTab) return false;

      // Scenario filter
      if (selectedScenario !== 'ALL' && r.scenario !== selectedScenario) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const c = customizations[r.tag] || {};
        const matchesTag = r.tag.toLowerCase().includes(q);
        const matchesAlias = (c.customTagAlias || '').toLowerCase().includes(q);
        const matchesName = (c.customName || r.name).toLowerCase().includes(q);
        const matchesDesc = (c.customDescription || r.description).toLowerCase().includes(q);
        const matchesUnit = (c.unit || r.unit).toLowerCase().includes(q);
        if (!matchesTag && !matchesAlias && !matchesName && !matchesDesc && !matchesUnit) {
          return false;
        }
      }

      return true;
    });
  }, [registers, activeIoTab, selectedScenario, searchQuery, customizations]);

  // Quick Inline Toggle for Digital Output or Digital Input Force
  const handleQuickDigitalToggle = (r: PlcRegisterReading) => {
    const isOut = r.ioCategory === 'DIGITAL_OUTPUT' || r.tag.startsWith('%Q');
    const currentVal = r.scaledValue === 1 ? 0 : 1;

    setRegisters((prev) =>
      prev.map((item) => {
        if (item.tag === r.tag) {
          const rawInt = currentVal;
          const rawHex = '0x000' + currentVal;
          return {
            ...item,
            scaledValue: currentVal,
            rawInt,
            rawHex,
            lastPolled: Date.now(),
          };
        }
        return item;
      })
    );

    if (onRegisterModified) {
      onRegisterModified(r.tag, currentVal);
    }

    if (onTriggerAlert && r.tag === '%I0.1' && currentVal === 1) {
      onTriggerAlert('CRITICAL', 'Emergency Stop Activated', 'E-Stop circuit opened via I/O control.', '%I0.1');
    }
  };

  // Quick Inline Slider/Value Change for Analog Output
  const handleQuickAnalogOutputChange = (tag: string, newVal: number) => {
    setRegisters((prev) =>
      prev.map((item) => {
        if (item.tag === tag) {
          const rawInt = Math.round(newVal * Math.pow(10, item.decimals));
          const rawHex = '0x' + (rawInt < 0 ? 0 : rawInt).toString(16).toUpperCase().padStart(4, '0');
          return {
            ...item,
            scaledValue: newVal,
            rawInt,
            rawHex,
            lastPolled: Date.now(),
          };
        }
        return item;
      })
    );

    if (onRegisterModified) {
      onRegisterModified(tag, newVal);
    }
  };

  // Save customization handler from modal
  const handleSaveCustomization = (tag: string, newCust: PlcIoCustomization, forcedVal?: number) => {
    setCustomizations((prev) => ({
      ...prev,
      [tag]: newCust,
    }));

    setRegisters((prev) =>
      prev.map((r) => {
        if (r.tag === tag) {
          let scaled = forcedVal !== undefined ? forcedVal : r.scaledValue;
          const decimals = newCust.decimals !== undefined ? newCust.decimals : r.decimals;
          const rawInt = Math.round(scaled * Math.pow(10, decimals));
          const rawHex = '0x' + (rawInt < 0 ? 0 : rawInt).toString(16).toUpperCase().padStart(4, '0');
          return {
            ...r,
            name: newCust.customName || r.name,
            unit: newCust.unit || r.unit,
            decimals,
            min: newCust.minScale !== undefined ? newCust.minScale : r.min,
            max: newCust.maxScale !== undefined ? newCust.maxScale : r.max,
            warnMin: newCust.warnMin,
            warnMax: newCust.warnMax,
            alarmMin: newCust.alarmMin,
            alarmMax: newCust.alarmMax,
            scaledValue: scaled,
            rawInt,
            rawHex,
            customization: newCust,
            lastPolled: Date.now(),
          };
        }
        return r;
      })
    );

    if (forcedVal !== undefined && onRegisterModified) {
      onRegisterModified(tag, forcedVal);
    }
  };

  // Reset channel to factory default calibration
  const handleResetToDefaults = (tag: string) => {
    setCustomizations((prev) => {
      const copy = { ...prev };
      delete copy[tag];
      return copy;
    });

    const initial = INITIAL_PLC_REGISTERS.find((x) => x.tag === tag);
    if (initial) {
      setRegisters((prev) =>
        prev.map((r) => (r.tag === tag ? { ...initial, ioCategory: getCategory(initial) } : r))
      );
    }
  };

  // Export CSV of current configured I/O
  const handleExportCsv = () => {
    const headers = [
      'Tag_Address',
      'IO_Category',
      'Tag_Alias',
      'Signal_Type',
      'Signal_Name',
      'Current_Scaled_Value',
      'Engineering_Unit',
      'Raw_Hex',
      'Raw_Int',
      'Min_Scale',
      'Max_Scale',
      'Status',
      'Is_Forced_Override',
      'Subsystem_Scenario',
      'Description'
    ];

    const rows = registers.map((r) => {
      const cat = r.ioCategory || getCategory(r);
      const c = customizations[r.tag] || {};
      return [
        `"${r.tag}"`,
        `"${cat}"`,
        `"${c.customTagAlias || r.tag}"`,
        `"${c.signalType || r.signalType || ''}"`,
        `"${c.customName || r.name}"`,
        r.scaledValue,
        `"${c.unit || r.unit}"`,
        `"${r.rawHex}"`,
        r.rawInt,
        c.minScale !== undefined ? c.minScale : r.min,
        c.maxScale !== undefined ? c.maxScale : r.max,
        `"${r.status}"`,
        c.isForced ? 'YES' : 'NO',
        `"${r.scenario}"`,
        `"${(c.customDescription || r.description).replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PLC_IO_Channel_Configurations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-2xl border shadow-2xl flex flex-col font-mono text-xs overflow-hidden transition-colors ${
      isNightShift
        ? palette === 'RED'
          ? 'bg-black border-red-900/60'
          : palette === 'AMBER'
          ? 'bg-black border-amber-900/60'
          : 'bg-zinc-950 border-zinc-800'
        : 'bg-slate-950 border-slate-800'
    }`}>
      
      {/* Top Banner: Poller status & bus metrics */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full flex items-center justify-center ${
              isPollingActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'
            }`}></span>
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>PLC I/O READ & CHANNEL CALIBRATION HUB</span>
            </h3>
          </div>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
            Modicon M580/M340 • Unity Pro / EcoStruxure
          </span>
        </div>

        {/* Poller Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Scan:</span>
            <button
              onClick={() => setPollingRateMs(250)}
              className={`px-1.5 py-0.5 rounded ${pollingRateMs === 250 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              250ms
            </button>
            <button
              onClick={() => setPollingRateMs(500)}
              className={`px-1.5 py-0.5 rounded ${pollingRateMs === 500 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              500ms
            </button>
            <button
              onClick={() => setPollingRateMs(1000)}
              className={`px-1.5 py-0.5 rounded ${pollingRateMs === 1000 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1s
            </button>
          </div>

          <button
            onClick={() => setIsPollingActive(!isPollingActive)}
            className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition ${
              isPollingActive 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-slate-950 border-emerald-500 hover:bg-emerald-500 font-black'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPollingActive ? 'animate-spin' : ''}`} />
            <span>{isPollingActive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1 transition"
            title="Export CSV of I/O channels & calibration"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export I/O CSV</span>
          </button>
        </div>
      </div>

      {/* Real-Time Bus Health Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-3 bg-slate-950/80 border-b border-slate-800/80 text-[11px]">
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Total I/O Points:</span>
          <span className="font-bold text-white text-xs">{counts.total} Channels</span>
        </div>
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-emerald-400">Analog Inputs (AI):</span>
          <span className="font-bold text-emerald-400 text-xs">{counts.ai}</span>
        </div>
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-amber-400">Analog Outputs (AO):</span>
          <span className="font-bold text-amber-400 text-xs">{counts.ao}</span>
        </div>
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-sky-400">Digital Inputs (DI):</span>
          <span className="font-bold text-sky-400 text-xs">{counts.di}</span>
        </div>
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-purple-400">Digital Outputs (DO):</span>
          <span className="font-bold text-purple-400 text-xs">{counts.doCount}</span>
        </div>
        <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Active Overrides:</span>
          <span className={`font-bold text-xs ${counts.forced > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
            {counts.forced} Forced
          </span>
        </div>
      </div>

      {/* PRIMARY I/O TABS (The User's Request: Analog Inputs, Analog Outputs, Digital Inputs, Digital Outputs) */}
      <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {/* Tab 1: All Channels */}
          <button
            onClick={() => setActiveIoTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              activeIoTab === 'ALL'
                ? 'bg-slate-200 text-slate-950 border-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Channels ({counts.total})</span>
          </button>

          {/* Tab 2: Analog Inputs (AI) */}
          <button
            onClick={() => setActiveIoTab('ANALOG_INPUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              activeIoTab === 'ANALOG_INPUT'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                : 'bg-slate-950 text-emerald-400/90 hover:text-emerald-300 border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Analog Inputs (AI)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeIoTab === 'ANALOG_INPUT' ? 'bg-slate-950 text-emerald-300 font-bold' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
              {counts.ai}
            </span>
          </button>

          {/* Tab 3: Analog Outputs (AO) */}
          <button
            onClick={() => setActiveIoTab('ANALOG_OUTPUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              activeIoTab === 'ANALOG_OUTPUT'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Analog Outputs (AO)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeIoTab === 'ANALOG_OUTPUT' ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
              {counts.ao}
            </span>
          </button>

          {/* Tab 4: Digital Inputs (DI) */}
          <button
            onClick={() => setActiveIoTab('DIGITAL_INPUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              activeIoTab === 'DIGITAL_INPUT'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                : 'bg-slate-950 text-sky-400/90 hover:text-sky-300 border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>Digital Inputs (DI)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeIoTab === 'DIGITAL_INPUT' ? 'bg-slate-950 text-sky-300 font-bold' : 'bg-sky-950 text-sky-300 border border-sky-800'}`}>
              {counts.di}
            </span>
          </button>

          {/* Tab 5: Digital Outputs (DO) */}
          <button
            onClick={() => setActiveIoTab('DIGITAL_OUTPUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${
              activeIoTab === 'DIGITAL_OUTPUT'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md font-black'
                : 'bg-slate-950 text-purple-400/90 hover:text-purple-300 border-slate-800 hover:border-purple-500/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Outputs (DO)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeIoTab === 'DIGITAL_OUTPUT' ? 'bg-slate-950 text-purple-300 font-bold' : 'bg-purple-950 text-purple-300 border border-purple-800'}`}>
              {counts.doCount}
            </span>
          </button>
        </div>

        {/* Subsystem Scenario Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> System:
          </span>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value as any)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Subsystems</option>
            <option value="MAIN_ENGINE">Main Engine</option>
            <option value="ALTERNATOR">Alternator / GenSet</option>
            <option value="GEARBOX">Marine Gearbox</option>
            <option value="SAFETY">Safety & Shutdown</option>
          </select>
        </div>
      </div>

      {/* Search & Channel Guidance Strip */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search address (%IW1.0, %QW2.0, %I0.1, %Q0.0), tag alias, name, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Showing <strong className="text-white">{filteredRegisters.length}</strong> configured channels</span>
          <span className="hidden md:inline">• Click the <Sliders className="w-3 h-3 inline text-amber-400 mx-0.5" /> button to customize scaling, range & alarms</span>
        </div>
      </div>

      {/* Main Channel Table */}
      <div className="overflow-x-auto flex-1 max-h-[460px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 sticky top-0 backdrop-blur z-10">
              <th className="py-2.5 px-3">Address & Tag</th>
              <th className="py-2.5 px-2">Type</th>
              <th className="py-2.5 px-3">Channel Name & Description</th>
              <th className="py-2.5 px-3">Signal</th>
              <th className="py-2.5 px-3 text-right">Raw ADC / Int</th>
              <th className="py-2.5 px-3 text-right">Live Scaled Value</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3">Direct Channel Control</th>
              <th className="py-2.5 px-3 text-right">Customise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredRegisters.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold">No I/O channels match current tab or search criteria</p>
                  <p className="text-[11px] text-slate-600 mt-1">Select "All Channels" or adjust your filter query</p>
                </td>
              </tr>
            ) : (
              filteredRegisters.map((reg) => {
                const cat = reg.ioCategory || getCategory(reg);
                const isAnalog = cat === 'ANALOG_INPUT' || cat === 'ANALOG_OUTPUT';
                const isOutput = cat === 'ANALOG_OUTPUT' || cat === 'DIGITAL_OUTPUT';
                const c = customizations[reg.tag] || {};
                const isForced = c.isForced;
                const isAlarm = reg.status === 'ALARM';
                const isWarn = reg.status === 'WARNING';

                const displayTag = c.customTagAlias || reg.tag;
                const displayName = c.customName || reg.name;
                const displayUnit = c.unit || reg.unit;
                const signal = c.signalType || reg.signalType || (isAnalog ? '4-20mA' : '24V_DC');

                return (
                  <tr
                    key={reg.tag}
                    className={`hover:bg-slate-900/70 transition-colors ${
                      isAlarm 
                        ? 'bg-red-950/20' 
                        : isWarn 
                        ? 'bg-amber-950/20' 
                        : isForced 
                        ? 'bg-amber-950/10' 
                        : ''
                    }`}
                  >
                    {/* Address & Tag */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{reg.tag}</span>
                        {isForced && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950">
                            FORCED
                          </span>
                        )}
                      </div>
                      {c.customTagAlias && c.customTagAlias !== reg.tag && (
                        <div className="text-[10px] text-amber-400 font-semibold">{c.customTagAlias}</div>
                      )}
                    </td>

                    {/* Category Type Badge */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        cat === 'ANALOG_INPUT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : cat === 'ANALOG_OUTPUT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : cat === 'DIGITAL_INPUT'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {cat === 'ANALOG_INPUT' ? 'AI' : cat === 'ANALOG_OUTPUT' ? 'AO' : cat === 'DIGITAL_INPUT' ? 'DI' : 'DO'}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-200">{displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs" title={c.customDescription || reg.description}>
                        {c.customDescription || reg.description}
                      </div>
                    </td>

                    {/* Signal Type */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {signal}
                      </span>
                    </td>

                    {/* Raw Value */}
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
                      <span className="text-slate-400">{reg.rawHex}</span>
                      <span className="text-slate-500 ml-1 text-[10px]">({reg.rawInt})</span>
                    </td>

                    {/* Live Scaled Value */}
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
                      {isAnalog ? (
                        <div>
                          <span className={`text-sm font-bold ${
                            isAlarm ? 'text-red-400 animate-pulse' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {reg.scaledValue.toFixed(c.decimals !== undefined ? c.decimals : reg.decimals)}
                          </span>
                          <span className="text-slate-400 ml-1 text-[10px]">{displayUnit}</span>
                        </div>
                      ) : (
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            reg.scaledValue === 1
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {reg.scaledValue === 1 
                              ? (c.oneLabel || 'ENERGIZED (1)') 
                              : (c.zeroLabel || 'DE-ENERGIZED (0)')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {isAlarm ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-black bg-red-500 text-white animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ALARM</span>
                        </span>
                      ) : isWarn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <AlertOctagon className="w-3 h-3 text-amber-400" />
                          <span>WARN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>NORMAL</span>
                        </span>
                      )}
                    </td>

                    {/* Direct Channel Control */}
                    <td className="py-2 px-3 min-w-[170px]">
                      {cat === 'ANALOG_OUTPUT' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={c.minScale !== undefined ? c.minScale : reg.min}
                            max={c.maxScale !== undefined ? c.maxScale : reg.max}
                            step={( (c.maxScale !== undefined ? c.maxScale : reg.max) - (c.minScale !== undefined ? c.minScale : reg.min) ) / 50}
                            value={reg.scaledValue}
                            onChange={(e) => handleQuickAnalogOutputChange(reg.tag, Number(e.target.value))}
                            className="w-24 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-amber-300">
                            {reg.scaledValue} {displayUnit}
                          </span>
                        </div>
                      ) : cat === 'DIGITAL_OUTPUT' ? (
                        <button
                          onClick={() => handleQuickDigitalToggle(reg)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1.5 border ${
                            reg.scaledValue === 1
                              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Command: {reg.scaledValue === 1 ? 'Trip / De-energize' : 'Energize Relay'}</span>
                        </button>
                      ) : cat === 'DIGITAL_INPUT' ? (
                        <button
                          onClick={() => handleQuickDigitalToggle(reg)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                          title="Simulate / toggle contact state"
                        >
                          Toggle Contact ({reg.scaledValue === 1 ? '1' : '0'})
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Live Sensor Input
                        </span>
                      )}
                    </td>

                    {/* Action / Customise Button */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setCustomizingReading(reg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto border ${
                          isForced
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                        }`}
                        title="Configure scaling, calibrations, alarms & overrides"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Customise</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Customizations (scaling, alarms, damping, and zero offsets) automatically persist in browser memory.</span>
        </div>
        <div className="text-slate-400 font-bold">
          Modbus Function Codes: FC03 (Holding) • FC04 (Inputs) • FC01 (Coils) • FC05/FC06 (Writes)
        </div>
      </div>

      {/* Customisation & Calibration Modal */}
      {customizingReading && (
        <PlcIoCustomizationModal
          reading={customizingReading}
          isOpen={!!customizingReading}
          onClose={() => setCustomizingReading(null)}
          onSaveCustomization={handleSaveCustomization}
          onResetToDefaults={handleResetToDefaults}
        />
      )}
    </div>
  );
};
