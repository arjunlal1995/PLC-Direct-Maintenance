import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sliders, 
  Cpu, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  Zap, 
  Layers, 
  ShieldAlert, 
  Gauge, 
  ToggleLeft, 
  ToggleRight, 
  Info,
  Radio,
  FileText
} from 'lucide-react';
import { PlcRegisterReading, PlcIoCustomization, PlcIoCategory } from '../types';

interface PlcIoCustomizationModalProps {
  reading: PlcRegisterReading | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomization: (tag: string, customization: PlcIoCustomization, forcedOverrideValue?: number) => void;
  onResetToDefaults: (tag: string) => void;
}

export const PlcIoCustomizationModal: React.FC<PlcIoCustomizationModalProps> = ({
  reading,
  isOpen,
  onClose,
  onSaveCustomization,
  onResetToDefaults,
}) => {
  if (!isOpen || !reading) return null;

  const isAnalog = reading.ioCategory === 'ANALOG_INPUT' || reading.ioCategory === 'ANALOG_OUTPUT' || reading.type === 'HOLDING_MW';
  const isOutput = reading.ioCategory === 'ANALOG_OUTPUT' || reading.ioCategory === 'DIGITAL_OUTPUT' || reading.tag.startsWith('%Q');

  const existing: PlcIoCustomization = reading.customization || { tag: reading.tag };

  // Form State
  const [customTagAlias, setCustomTagAlias] = useState<string>(existing.customTagAlias || reading.tag);
  const [customName, setCustomName] = useState<string>(existing.customName || reading.name);
  const [customDescription, setCustomDescription] = useState<string>(existing.customDescription || reading.description);
  
  // Analog Scaling
  const [unit, setUnit] = useState<string>(existing.unit || reading.unit);
  const [decimals, setDecimals] = useState<number>(existing.decimals !== undefined ? existing.decimals : reading.decimals);
  const [minScale, setMinScale] = useState<number>(existing.minScale !== undefined ? existing.minScale : reading.min);
  const [maxScale, setMaxScale] = useState<number>(existing.maxScale !== undefined ? existing.maxScale : reading.max);
  const [rawAdcMin, setRawAdcMin] = useState<number>(existing.rawAdcMin !== undefined ? existing.rawAdcMin : 0);
  const [rawAdcMax, setRawAdcMax] = useState<number>(existing.rawAdcMax !== undefined ? existing.rawAdcMax : 10000);
  const [signalType, setSignalType] = useState<string>(existing.signalType || reading.signalType || (isAnalog ? '4-20mA' : '24V_DC'));
  
  // Calibration
  const [calOffset, setCalOffset] = useState<number>(existing.calOffset || 0);
  const [calGain, setCalGain] = useState<number>(existing.calGain !== undefined ? existing.calGain : 1.0);
  const [filterSamples, setFilterSamples] = useState<number>(existing.filterSamples || 3);
  const [deadband, setDeadband] = useState<number>(existing.deadband || 0);

  // Alarms
  const [enableThresholds, setEnableThresholds] = useState<boolean>(existing.enableThresholds !== undefined ? existing.enableThresholds : true);
  const [warnMin, setWarnMin] = useState<string>(existing.warnMin !== undefined ? existing.warnMin.toString() : reading.warnMin !== undefined ? reading.warnMin.toString() : '');
  const [warnMax, setWarnMax] = useState<string>(existing.warnMax !== undefined ? existing.warnMax.toString() : reading.warnMax !== undefined ? reading.warnMax.toString() : '');
  const [alarmMin, setAlarmMin] = useState<string>(existing.alarmMin !== undefined ? existing.alarmMin.toString() : reading.alarmMin !== undefined ? reading.alarmMin.toString() : '');
  const [alarmMax, setAlarmMax] = useState<string>(existing.alarmMax !== undefined ? existing.alarmMax.toString() : reading.alarmMax !== undefined ? reading.alarmMax.toString() : '');

  // Digital Specific
  const [invertedLogic, setInvertedLogic] = useState<boolean>(existing.invertedLogic || false);
  const [zeroLabel, setZeroLabel] = useState<string>(existing.zeroLabel || 'DE-ENERGIZED (0)');
  const [oneLabel, setOneLabel] = useState<string>(existing.oneLabel || 'ENERGIZED (1)');
  const [alarmTriggerBit, setAlarmTriggerBit] = useState<0 | 1 | -1>(existing.alarmTriggerBit !== undefined ? existing.alarmTriggerBit : -1);

  // Commissioning & Live Forced Override
  const [isForced, setIsForced] = useState<boolean>(existing.isForced || false);
  const [forcedValue, setForcedValue] = useState<number>(existing.forcedValue !== undefined ? existing.forcedValue : reading.scaledValue);

  // Reset form when opening with new reading
  useEffect(() => {
    if (reading) {
      const c: PlcIoCustomization = reading.customization || { tag: reading.tag };
      setCustomTagAlias(c.customTagAlias || reading.tag);
      setCustomName(c.customName || reading.name);
      setCustomDescription(c.customDescription || reading.description);
      setUnit(c.unit || reading.unit);
      setDecimals(c.decimals !== undefined ? c.decimals : reading.decimals);
      setMinScale(c.minScale !== undefined ? c.minScale : reading.min);
      setMaxScale(c.maxScale !== undefined ? c.maxScale : reading.max);
      setRawAdcMin(c.rawAdcMin !== undefined ? c.rawAdcMin : 0);
      setRawAdcMax(c.rawAdcMax !== undefined ? c.rawAdcMax : 10000);
      setSignalType(c.signalType || reading.signalType || (isAnalog ? '4-20mA' : '24V_DC'));
      setCalOffset(c.calOffset || 0);
      setCalGain(c.calGain !== undefined ? c.calGain : 1.0);
      setFilterSamples(c.filterSamples || 3);
      setDeadband(c.deadband || 0);
      setEnableThresholds(c.enableThresholds !== undefined ? c.enableThresholds : true);
      setWarnMin(c.warnMin !== undefined ? c.warnMin.toString() : reading.warnMin !== undefined ? reading.warnMin.toString() : '');
      setWarnMax(c.warnMax !== undefined ? c.warnMax.toString() : reading.warnMax !== undefined ? reading.warnMax.toString() : '');
      setAlarmMin(c.alarmMin !== undefined ? c.alarmMin.toString() : reading.alarmMin !== undefined ? reading.alarmMin.toString() : '');
      setAlarmMax(c.alarmMax !== undefined ? c.alarmMax.toString() : reading.alarmMax !== undefined ? reading.alarmMax.toString() : '');
      setInvertedLogic(c.invertedLogic || false);
      setZeroLabel(c.zeroLabel || 'DE-ENERGIZED (0)');
      setOneLabel(c.oneLabel || 'ENERGIZED (1)');
      setAlarmTriggerBit(c.alarmTriggerBit !== undefined ? c.alarmTriggerBit : -1);
      setIsForced(c.isForced || false);
      setForcedValue(c.forcedValue !== undefined ? c.forcedValue : reading.scaledValue);
    }
  }, [reading]);

  const handleSave = () => {
    const updatedCustomization: PlcIoCustomization = {
      tag: reading.tag,
      customTagAlias,
      customName,
      customDescription,
      unit,
      decimals: Number(decimals),
      minScale: Number(minScale),
      maxScale: Number(maxScale),
      rawAdcMin: Number(rawAdcMin),
      rawAdcMax: Number(rawAdcMax),
      signalType: signalType as any,
      calOffset: Number(calOffset),
      calGain: Number(calGain),
      enableThresholds,
      warnMin: warnMin !== '' ? Number(warnMin) : undefined,
      warnMax: warnMax !== '' ? Number(warnMax) : undefined,
      alarmMin: alarmMin !== '' ? Number(alarmMin) : undefined,
      alarmMax: alarmMax !== '' ? Number(alarmMax) : undefined,
      invertedLogic,
      zeroLabel,
      oneLabel,
      alarmTriggerBit,
      filterSamples: Number(filterSamples),
      deadband: Number(deadband),
      isForced,
      forcedValue: isForced ? Number(forcedValue) : undefined,
    };

    onSaveCustomization(reading.tag, updatedCustomization, isForced ? Number(forcedValue) : undefined);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm(`Reset customization options for ${reading.tag} to default factory engineering calibration?`)) {
      onResetToDefaults(reading.tag);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isAnalog 
                ? isOutput ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isOutput ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  CUSTOMISE I/O CHANNEL: {reading.tag}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-wider ${
                  reading.ioCategory === 'ANALOG_INPUT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : reading.ioCategory === 'ANALOG_OUTPUT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : reading.ioCategory === 'DIGITAL_INPUT'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {reading.ioCategory ? reading.ioCategory.replace('_', ' ') : isAnalog ? 'ANALOG' : 'DIGITAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Value: <strong className="text-white">{reading.scaledValue} {reading.unit}</strong> • Raw: {reading.rawHex} ({reading.rawInt})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Section 1: Identification & Tag Labeling */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Channel Identification & Tag Alias
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tag Alias (HMI / SCADA identifier):</label>
                <input
                  type="text"
                  value={customTagAlias}
                  onChange={(e) => setCustomTagAlias(e.target.value)}
                  placeholder={reading.tag}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Signal Name:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Functional Description & Marine Subsystem:</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Analog Scaling & Engineering Range (If Analog) */}
          {isAnalog && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Analog Scaling, Engineering Range & Electrical Signal
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Electrical Signal:</label>
                  <select
                    value={signalType}
                    onChange={(e) => setSignalType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="4-20mA">4-20 mA (Current Loop)</option>
                    <option value="0-10V">0-10 V (Voltage)</option>
                    <option value="PT100">PT100 RTD</option>
                    <option value="THERMOCOUPLE">Thermocouple Type K</option>
                    <option value="PULSE">Pulse / Frequency (RPM)</option>
                    <option value="MODBUS_REG">Direct Modbus Holding</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Engineering Unit:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Bar, °C, RPM, %..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Eng. Scale:</label>
                  <input
                    type="number"
                    step="any"
                    value={minScale}
                    onChange={(e) => setMinScale(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Max Eng. Scale:</label>
                  <input
                    type="number"
                    step="any"
                    value={maxScale}
                    onChange={(e) => setMaxScale(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Decimal Places:</label>
                  <select
                    value={decimals}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value={0}>0 (e.g. 705 RPM)</option>
                    <option value={1}>1 (e.g. 65.0 °C)</option>
                    <option value={2}>2 (e.g. 0.85 Bar)</option>
                    <option value={3}>3 (e.g. 0.855)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Raw ADC/DAC Min:</label>
                  <input
                    type="number"
                    value={rawAdcMin}
                    onChange={(e) => setRawAdcMin(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Raw ADC/DAC Max:</label>
                  <input
                    type="number"
                    value={rawAdcMax}
                    onChange={(e) => setRawAdcMax(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Deadband Filter:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deadband}
                    onChange={(e) => setDeadband(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Calibration & Signal Conditioning (Analog) */}
          {isAnalog && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Zero Calibration Trim & Moving Average Damping
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Zero Offset Calibration (±):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calOffset}
                    onChange={(e) => setCalOffset(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Adjusts sensor zero tare drift</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Span Gain Multiplier:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={calGain}
                    onChange={(e) => setCalGain(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default 1.000 (Slope multiplier)</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Filter Smoothing Damping:</label>
                  <select
                    value={filterSamples}
                    onChange={(e) => setFilterSamples(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value={1}>1 sample (Instant / Raw Jitter)</option>
                    <option value={3}>3 samples (Light Smoothing)</option>
                    <option value={5}>5 samples (Standard Industrial)</option>
                    <option value={10}>10 samples (Heavy Marine Engine Damping)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Removes mechanical vibration noise</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Alarm & Warning Thresholds (Analog) */}
          {isAnalog && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Alarm & Warning Threshold Setpoints
                </h4>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[11px] text-slate-400">Monitoring Active:</span>
                  <input
                    type="checkbox"
                    checked={enableThresholds}
                    onChange={(e) => setEnableThresholds(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-red-400 block mb-1 font-bold">Low Alarm (Trip Min):</label>
                  <input
                    type="number"
                    step="any"
                    value={alarmMin}
                    onChange={(e) => setAlarmMin(e.target.value)}
                    placeholder="None"
                    disabled={!enableThresholds}
                    className="w-full bg-slate-900 border border-red-900/60 rounded-lg px-2.5 py-1.5 text-xs text-red-300 focus:outline-none focus:border-red-500 font-mono disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-amber-400 block mb-1 font-bold">Low Warning (Warn Min):</label>
                  <input
                    type="number"
                    step="any"
                    value={warnMin}
                    onChange={(e) => setWarnMin(e.target.value)}
                    placeholder="None"
                    disabled={!enableThresholds}
                    className="w-full bg-slate-900 border border-amber-900/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-amber-400 block mb-1 font-bold">High Warning (Warn Max):</label>
                  <input
                    type="number"
                    step="any"
                    value={warnMax}
                    onChange={(e) => setWarnMax(e.target.value)}
                    placeholder="None"
                    disabled={!enableThresholds}
                    className="w-full bg-slate-900 border border-amber-900/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-red-400 block mb-1 font-bold">High Alarm (Trip Max):</label>
                  <input
                    type="number"
                    step="any"
                    value={alarmMax}
                    onChange={(e) => setAlarmMax(e.target.value)}
                    placeholder="None"
                    disabled={!enableThresholds}
                    className="w-full bg-slate-900 border border-red-900/60 rounded-lg px-2.5 py-1.5 text-xs text-red-300 focus:outline-none focus:border-red-500 font-mono disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Discrete State Customization (Digital Inputs & Outputs) */}
          {!isAnalog && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Discrete Bit Logic & Custom State Text
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">State 0 (Bit = 0) Display Text:</label>
                  <input
                    type="text"
                    value={zeroLabel}
                    onChange={(e) => setZeroLabel(e.target.value)}
                    placeholder="DE-ENERGIZED, OFF, NORMAL..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">State 1 (Bit = 1) Display Text:</label>
                  <input
                    type="text"
                    value={oneLabel}
                    onChange={(e) => setOneLabel(e.target.value)}
                    placeholder="ENERGIZED, ON, TRIPPED..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Alarm Trigger State:</label>
                  <select
                    value={alarmTriggerBit}
                    onChange={(e) => setAlarmTriggerBit(Number(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value={-1}>No Alarm on this discrete state</option>
                    <option value={1}>Alarm when Bit = 1 (Active High Alarm)</option>
                    <option value={0}>Alarm when Bit = 0 (Active Low / Fail-Safe Break)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="invertLogic"
                    checked={invertedLogic}
                    onChange={(e) => setInvertedLogic(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <label htmlFor="invertLogic" className="text-xs text-slate-300 cursor-pointer">
                    Invert Electrical Contact Logic (Normally Closed N.C.)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Commissioning & Live Force Override Mode */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Commissioning & Live Force Override Injection
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-[11px] text-amber-300 font-bold">FORCE OVERRIDE:</span>
                <input
                  type="checkbox"
                  checked={isForced}
                  onChange={(e) => setIsForced(e.target.checked)}
                  className="rounded bg-slate-900 border-amber-600 text-amber-500 focus:ring-0"
                />
              </label>
            </div>

            <p className="text-[11px] text-amber-200/80">
              When Force Override is enabled, the live poller bypasses simulated sensor drift or PLC readouts and pins the signal to the specified value. Essential for loop testing emergency shutdowns, alarms, and HMI displays.
            </p>

            {isForced && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-3 rounded-lg border border-amber-500/40">
                <div className="w-full sm:w-1/2">
                  <label className="text-[11px] text-amber-400 block mb-1 font-bold">
                    Forced Scaled Value ({isAnalog ? unit : 'BOOL'}):
                  </label>
                  {isAnalog ? (
                    <input
                      type="number"
                      step="any"
                      value={forcedValue}
                      onChange={(e) => setForcedValue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-amber-500 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none font-mono"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setForcedValue(0)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition border ${
                          forcedValue === 0
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Force 0 ({zeroLabel})
                      </button>
                      <button
                        onClick={() => setForcedValue(1)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition border ${
                          forcedValue === 1
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Force 1 ({oneLabel})
                      </button>
                    </div>
                  )}
                </div>

                {isAnalog && (
                  <div className="w-full sm:w-1/2">
                    <label className="text-[10px] text-slate-500 block mb-1">
                      Quick Slider ({minScale} to {maxScale} {unit}):
                    </label>
                    <input
                      type="range"
                      min={minScale}
                      max={maxScale}
                      step={(maxScale - minScale) / 100}
                      value={forcedValue}
                      onChange={(e) => setForcedValue(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Calibration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
