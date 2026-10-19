import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  RotateCcw, 
  Cable, 
  Activity, 
  Flame, 
  Gauge, 
  Compass, 
  Zap, 
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Database,
  Cpu,
  Layers,
  CheckSquare
} from 'lucide-react';
import { PlcAlert, SchneiderUsbConnectionConfig, PlcTelemetryScenario } from '../types';
import { PlcLiveDataReader } from './PlcLiveDataReader';
import { useNightShift } from '../context/NightShiftContext';

interface SchneiderHmiScreenProps {
  alerts: PlcAlert[];
  onAcknowledge: (id: string) => void;
  onDispatch: (id: string) => void;
  onTriggerAlert: (severity: PlcAlert['severity'], title: string, message: string, tag: string, machineId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  connectionConfig: SchneiderUsbConnectionConfig;
  onUpdateConfig: (cfg: Partial<SchneiderUsbConnectionConfig>) => void;
  onOpenChecklist: (alert: PlcAlert) => void;
  onViewTrend?: () => void;
  onOpenResetCenter?: (alert?: PlcAlert) => void;
}

export const SchneiderHmiScreen: React.FC<SchneiderHmiScreenProps> = ({
  alerts,
  onAcknowledge,
  onDispatch,
  onTriggerAlert,
  soundEnabled,
  onToggleSound,
  connectionConfig,
  onUpdateConfig,
  onOpenChecklist,
  onViewTrend,
  onOpenResetCenter,
}) => {
  const { isNightShift, palette, highContrast } = useNightShift();

  // Scenario switcher
  const [activeScenario, setActiveScenario] = useState<PlcTelemetryScenario>('MAIN_ENGINE');
  
  // Landscape Mode toggle for wide industrial console displays
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);

  // ================= SCENARIO 1: MAIN ENGINE STATE =================
  const [engineRpm, setEngineRpm] = useState(705);
  const [seaWaterPressure, setSeaWaterPressure] = useState(0.85); // Normal ~0.8-1.5 Bar
  const [coolantTemp, setCoolantTemp] = useState(65); // 65°C
  const [lubOilTemp, setLubOilTemp] = useState(70); // 70°C
  const [lubOilPressure, setLubOilPressure] = useState(1.44); // 1.44 Bar
  const [exhaustTempLb, setExhaustTempLb] = useState(145); // 145°C
  const [exhaustTempRb, setExhaustTempRb] = useState(142); // 142°C
  const [turboBoost, setTurboBoost] = useState(1.35); // 1.35 Bar
  const [fuelRailPressure, setFuelRailPressure] = useState(1100); // 1100 Bar

  // ================= SCENARIO 2: ALTERNATOR / GENSET STATE =================
  const [voltageL1L2, setVoltageL1L2] = useState(400.0);
  const [voltageL2L3, setVoltageL2L3] = useState(400.5);
  const [voltageL3L1, setVoltageL3L1] = useState(399.5);
  const [selectedVoltagePhase, setSelectedVoltagePhase] = useState<'L1-L2' | 'L2-L3' | 'L3-L1'>('L1-L2');
  const [frequencyHz, setFrequencyHz] = useState(50.00);
  const [currentL1, setCurrentL1] = useState(320.0);
  const [currentL2, setCurrentL2] = useState(315.0);
  const [currentL3, setCurrentL3] = useState(325.0);
  const [activePowerKw, setActivePowerKw] = useState(185.0);
  const [powerFactor, setPowerFactor] = useState(0.85);
  const [statorTempU, setStatorTempU] = useState(72);
  const [statorTempV, setStatorTempV] = useState(74);
  const [statorTempW, setStatorTempW] = useState(71);
  const [bearingTempDe, setBearingTempDe] = useState(54);
  const [exciterVoltageDc, setExciterVoltageDc] = useState(42.0);
  const [isAcbClosed, setIsAcbClosed] = useState(true);
  const [isReversePowerTrip, setIsReversePowerTrip] = useState(false);

  // ================= SCENARIO 3: GEARBOX & CLUTCH STATE =================
  const [clutchState, setClutchState] = useState<'AHEAD' | 'NEUTRAL' | 'ASTERN'>('AHEAD');
  const [clutchPressure, setClutchPressure] = useState(24.5); // 24.5 Bar control clamp
  const [lubeSprayPressure, setLubeSprayPressure] = useState(3.2); // 3.2 Bar gear spray
  const [gearboxSumpTemp, setGearboxSumpTemp] = useState(58); // 58°C
  const [gearRatio] = useState(3.25); // 3.25:1 reduction
  const [clutchSlipPercent, setClutchSlipPercent] = useState(0.0);
  const [filterDeltaP, setFilterDeltaP] = useState(0.35); // 0.35 Bar differential
  const [isPtoEngaged, setIsPtoEngaged] = useState(true);
  const [isShaftBrakeReleased, setIsShaftBrakeReleased] = useState(true);

  // ================= SCENARIO 4: THRUSTER & STEERING (FROM IMAGE 1) =================
  const [propellerRpm, setPropellerRpm] = useState(34);
  const [propellerPercent, setPropellerPercent] = useState(28);
  const [steeringAngle, setSteeringAngle] = useState(92);
  const [isEmStopActive, setIsEmStopActive] = useState(false);

  // Discrete Annunciator indicator lamp states
  const [starterSelected, setStarterSelected] = useState(true);
  const [gbPressureSwitch, setGbPressureSwitch] = useState(false);
  const [gbOilTempAlarm, setGbOilTempAlarm] = useState(false);

  // Real-time micro-fluctuations in values when running
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRpm > 0 && !isEmStopActive) {
        setEngineRpm((prev) => Math.max(695, Math.min(715, prev + Math.floor((Math.random() - 0.5) * 6))));
        setSeaWaterPressure((prev) => Number((prev + (Math.random() - 0.5) * 0.02).toFixed(2)));
        setCoolantTemp((prev) => Math.max(63, Math.min(68, prev + (Math.random() > 0.6 ? 1 : Math.random() < 0.4 ? -1 : 0))));
        setFrequencyHz((prev) => Number((50.0 + (Math.random() - 0.5) * 0.08).toFixed(2)));
        setActivePowerKw((prev) => Number((prev + (Math.random() - 0.5) * 1.5).toFixed(1)));
        setClutchPressure((prev) => Number((prev + (Math.random() - 0.5) * 0.08).toFixed(1)));
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [engineRpm, isEmStopActive]);

  // Derived output propeller shaft speed from engine RPM and gear ratio
  const outputPropellerRpm = clutchState === 'NEUTRAL' ? 0 : Math.round(engineRpm / gearRatio);

  // Active alarms
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const latestAlert = activeAlerts[0] || alerts[0];

  // ================= FAULT SIMULATION HANDLERS =================
  const triggerSeaWaterFault = () => {
    setSeaWaterPressure(0.42);
    onTriggerAlert(
      'HIGH',
      'Sea Water Pressure Low, Set Pt. 0.8 Bar',
      'Cooling circuit raw sea water pump pressure dropped to 0.42 Bar. Impeller or suction sea chest strainer clogged.',
      '%MW100_SEA_WATER_PRESS',
      'SCHNEIDER-M580'
    );
  };

  const triggerAlternatorReversePower = () => {
    setIsAcbClosed(false);
    setIsReversePowerTrip(true);
    setActivePowerKw(-14.2);
    onTriggerAlert(
      'CRITICAL',
      'ALTERNATOR REVERSE POWER TRIP (%MW210)',
      'Generator absorbing active power (-14.2 kW) from switchboard bus. ACB tripped by Modicon ANSI 32 protection relay.',
      '%MW210_REVERSE_POWER',
      'SCHNEIDER-M340'
    );
  };

  const triggerGearboxLowPressure = () => {
    setClutchPressure(14.8);
    setClutchSlipPercent(12.5);
    setGbPressureSwitch(true);
    onTriggerAlert(
      'CRITICAL',
      'GEARBOX CLUTCH PRESSURE COLLAPSE (%MW300)',
      'Clutch operating pressure fallen to 14.8 Bar (Setpoint: 24.5 Bar). Multi-disc slip detected (12.5%). Rapid clutch wear hazard.',
      '%MW300_CLUTCH_PRESS',
      'SCHNEIDER-M580'
    );
  };

  const triggerEmStop = () => {
    setIsEmStopActive(true);
    setEngineRpm(0);
    setPropellerRpm(0);
    setIsAcbClosed(false);
    onTriggerAlert(
      'CRITICAL',
      'EM-STOP ACTIVE (BRIDGE) • %M1 TRIP',
      'Bridge Emergency Stop push-button depressed. Modicon safety relay loop open (%M1 active). All drives & generator tripped.',
      '%M1_EM_STOP_BRIDGE',
      'SCHNEIDER-M340'
    );
  };

  const resetFaults = () => {
    setIsEmStopActive(false);
    setSeaWaterPressure(1.15);
    setEngineRpm(705);
    setPropellerRpm(34);
    setIsAcbClosed(true);
    setIsReversePowerTrip(false);
    setActivePowerKw(185.0);
    setClutchPressure(24.5);
    setClutchSlipPercent(0.0);
    setGbPressureSwitch(false);
    setGbOilTempAlarm(false);
  };

  // Helper for circular gauge SVG
  const renderGauge = (
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string,
    decimals: number = 0,
    warnMin?: number,
    warnMax?: number,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const radius = size === 'lg' ? 44 : 32;
    const strokeWidth = size === 'lg' ? 6 : 4;
    const center = size === 'lg' ? 52 : 38;
    const svgSize = size === 'lg' ? 104 : 76;
    
    // Calculate arc angle from -135° to +135° (270° sweep)
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = -135 + normalized * 270;
    
    const isWarning = (warnMin !== undefined && value < warnMin) || (warnMax !== undefined && value > warnMax);

    // Night Shift palette color overrides
    const normalStroke = isNightShift
      ? palette === 'RED'
        ? '#ef4444'
        : '#f59e0b'
      : '#38bdf8';
    const bgArcStroke = isNightShift
      ? palette === 'RED'
        ? '#450a0a'
        : '#451a03'
      : '#334155';
    const cardBg = isNightShift
      ? palette === 'RED'
        ? 'bg-black border-red-500/50 text-red-200 shadow-sm shadow-red-950'
        : 'bg-black border-amber-500/50 text-amber-200 shadow-sm shadow-amber-950'
      : 'bg-slate-900/60 border-slate-800 text-slate-100';

    return (
      <div className={`flex flex-col items-center select-none p-2.5 rounded-xl border transition ${cardBg} ${highContrast ? 'border-2' : 'border'}`}>
        <div className={`text-[10px] font-mono font-semibold tracking-wider uppercase text-center mb-0.5 truncate w-full ${
          isNightShift
            ? palette === 'RED'
              ? 'text-red-300'
              : 'text-amber-300'
            : 'text-slate-300'
        }`}>
          {label}
        </div>
        
        <div className="relative" style={{ width: svgSize, height: svgSize }}>
          <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
            {/* Background Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={bgArcStroke}
              strokeWidth={strokeWidth}
              strokeDasharray={`${radius * 1.5 * Math.PI}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isWarning ? '#ef4444' : normalStroke}
              strokeWidth={strokeWidth + (highContrast ? 2 : 1)}
              strokeDasharray={`${radius * 1.5 * Math.PI}`}
              strokeDashoffset={`${(1 - normalized) * (radius * 1.5 * Math.PI)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Needle Indicator */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 pointer-events-none"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className={`w-0.5 h-7 origin-bottom -translate-y-3.5 rounded-full ${
              isWarning 
                ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' 
                : isNightShift
                ? palette === 'RED' ? 'bg-red-400' : 'bg-amber-400'
                : 'bg-amber-400'
            }`}></div>
            <div className={`w-2.5 h-2.5 rounded-full absolute ${
              isNightShift ? 'bg-amber-400 border-2 border-black' : 'bg-slate-200 border-2 border-slate-950'
            }`}></div>
          </div>
        </div>

        <div className="mt-1 text-center font-mono">
          <div className={`font-bold text-sm leading-none ${
            isWarning 
              ? 'text-red-400 animate-pulse' 
              : isNightShift
              ? palette === 'RED' ? 'text-red-300' : 'text-amber-300'
              : 'text-slate-100'
          }`}>
            {value.toFixed(decimals)}
          </div>
          <div className={`text-[9px] font-sans mt-0.5 ${isNightShift ? 'text-zinc-400' : 'text-slate-400'}`}>{unit}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-300 ${
      isNightShift
        ? palette === 'RED'
          ? 'bg-black border-red-500/80 shadow-red-950/40 ring-1 ring-red-500/30'
          : 'bg-black border-amber-500/80 shadow-amber-950/40 ring-1 ring-amber-500/30'
        : 'bg-slate-950 border-slate-700/80'
    } ${
      isLandscapeMode ? 'w-full max-w-full ring-2 ring-emerald-500/20' : 'w-full'
    }`}>
      
      {/* Top Schneider Electric Bezel Header */}
      <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 select-none transition-colors ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-900'
            : 'bg-black border-amber-900'
          : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[11px] font-black ${
              isNightShift
                ? palette === 'RED' ? 'bg-red-500 text-black' : 'bg-amber-500 text-black'
                : 'bg-emerald-500 text-slate-950'
            }`}>
              ⚡
            </span>
            <div className="leading-tight">
              <span className={`font-extrabold text-sm tracking-tight ${isNightShift ? 'text-zinc-100' : 'text-white'}`}>
                Schneider
              </span>
              <span className={`font-semibold text-xs ml-1 ${
                isNightShift
                  ? palette === 'RED' ? 'text-red-400' : 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                Electric
              </span>
            </div>
          </div>
          <span className={`hidden sm:inline text-xs font-mono px-2 py-0.5 rounded border ${
            isNightShift
              ? 'bg-black text-amber-300 border-zinc-800'
              : 'bg-slate-950 text-emerald-400 border-slate-700'
          }`}>
            Magelis / Harmony Touch HMI
          </span>
          {isNightShift && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
              palette === 'RED'
                ? 'bg-red-950/80 text-red-300 border-red-500'
                : 'bg-amber-950/80 text-amber-300 border-amber-500'
            }`}>
              <span>🌙</span>
              <span>NIGHT SHIFT: {palette}</span>
            </span>
          )}
        </div>

        {/* Status badges matching reference photo */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={`px-2 py-0.5 rounded border ${
            isNightShift ? 'bg-zinc-950 text-zinc-300 border-zinc-800' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            Station FWD
          </span>
          <span className={`px-2 py-0.5 rounded border hidden md:inline ${
            isNightShift ? 'bg-zinc-950 text-amber-300 border-zinc-800' : 'bg-slate-800 text-amber-300 border-slate-700'
          }`}>
            Modbus Remote
          </span>
          <span className={`px-2.5 py-0.5 rounded font-bold border ${
            isEmStopActive 
              ? 'bg-red-600 text-white border-red-400 animate-pulse'
              : isNightShift
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-emerald-600/30 text-emerald-400 border-emerald-500/50'
          }`}>
            {isEmStopActive ? 'EM-STOP TRIP' : 'PLANT RUNNING'}
          </span>
          <span className="text-slate-400 hidden lg:inline">Run: 83:28h</span>
          <span className={`font-bold px-2 py-0.5 rounded border ${
            isNightShift ? 'bg-black text-amber-400 border-amber-900' : 'bg-slate-900 text-amber-400 border-slate-800'
          }`}>
            23.40 VDC
          </span>

          {/* Landscape Mode Toggle */}
          <button
            onClick={() => setIsLandscapeMode(!isLandscapeMode)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
              isLandscapeMode 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : isNightShift
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Landscape Widescreen Mode for Console Displays"
          >
            {isLandscapeMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLandscapeMode ? 'Standard View' : 'Landscape Mode'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Selection Tabs Bar (Main Engine, Alternator, Gearbox, Overview, etc.) */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveScenario('MAIN_ENGINE')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'MAIN_ENGINE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>🛥️</span>
            <span>Main Engine</span>
          </button>

          <button
            onClick={() => setActiveScenario('ALTERNATOR')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'ALTERNATOR'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>⚡</span>
            <span>Alternator / GenSet</span>
          </button>

          <button
            onClick={() => setActiveScenario('GEARBOX')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'GEARBOX'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>⚙️</span>
            <span>Marine Gearbox</span>
          </button>

          <button
            onClick={() => setActiveScenario('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'OVERVIEW'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>🎛️</span>
            <span>Plant Overview</span>
          </button>

          <button
            onClick={() => setActiveScenario('THRUSTER')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'THRUSTER'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>🧭</span>
            <span>ZF Thruster / Steering</span>
          </button>

          <button
            onClick={() => setActiveScenario('DATA_READER')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeScenario === 'DATA_READER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Read PLC Data (%MW)</span>
          </button>
        </div>

        {/* 24h Trend quick link */}
        {onViewTrend && (
          <button
            onClick={onViewTrend}
            className="px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition flex items-center gap-1 shrink-0"
          >
            <span>📈</span>
            <span className="hidden sm:inline">24h Telemetry</span> Trend
          </button>
        )}
      </div>

      {/* Hardware Connection Cable & Scenario Test Injections Strip */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Cable className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-slate-300 font-semibold">Active Port:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 ${
              connectionConfig.connectionMode === 'USB_B_TO_TYPE_C'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              USB-B (CDC-ACM 19200 8-E-1)
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 ${
              connectionConfig.connectionMode === 'RJ45_TO_TYPE_C'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                : 'bg-slate-800 text-slate-400'
            }`}>
              RJ-45 Modbus TCP ({connectionConfig.plcIpAddress})
            </span>
          </div>
        </div>

        {/* Dynamic Scenario Test Injections */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline">Scenario Test:</span>
          
          {activeScenario === 'MAIN_ENGINE' && (
            <button
              onClick={triggerSeaWaterFault}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition"
            >
              <AlertTriangle className="w-3 h-3" />
              Drop Sea Water Press
            </button>
          )}

          {activeScenario === 'ALTERNATOR' && (
            <button
              onClick={triggerAlternatorReversePower}
              className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition"
            >
              <Zap className="w-3 h-3" />
              Reverse Power Trip
            </button>
          )}

          {activeScenario === 'GEARBOX' && (
            <button
              onClick={triggerGearboxLowPressure}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition"
            >
              <AlertTriangle className="w-3 h-3" />
              Clutch Pressure Drop
            </button>
          )}

          <button
            onClick={triggerEmStop}
            className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition"
          >
            <AlertOctagon className="w-3 h-3" />
            Trip %M1 E-Stop
          </button>

          <button
            onClick={resetFaults}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className={`p-4 bg-slate-950 flex-1 ${isLandscapeMode ? 'min-h-[520px]' : 'min-h-[460px]'}`}>
        
        {/* ================= SCENARIO 1: MAIN ENGINE ================= */}
        {activeScenario === 'MAIN_ENGINE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span>🛥️</span>
                <span>MAIN PROPULSION DIESEL ENGINE TELEMETRY (%MW100-%MW115)</span>
              </span>
              <span className="text-slate-400">
                Firing: 1-5-3-6-2-4 • Load: {Math.round((engineRpm / 1200) * 100)}%
              </span>
            </div>

            {/* Top row of gauges */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
              {renderGauge(
                'Sea Water Pressure',
                seaWaterPressure,
                0,
                2.5,
                'Bar',
                2,
                0.8, // Alarm if below 0.8 Bar
                undefined
              )}
              {renderGauge(
                'Coolant Temp.',
                coolantTemp,
                0,
                150,
                'DegC',
                0,
                undefined,
                95 // Alarm if above 95°C
              )}
              {/* Central Engine Speed Gauge (Large) */}
              <div className={isLandscapeMode ? '' : 'col-span-2 sm:col-span-1 lg:col-span-1'}>
                {renderGauge(
                  'Engine Speed',
                  engineRpm,
                  0,
                  2500,
                  'RPM',
                  0,
                  undefined,
                  2100,
                  'lg'
                )}
              </div>
              {renderGauge(
                'Lub Oil Temp.',
                lubOilTemp,
                0,
                150,
                'DegC',
                0,
                undefined,
                90
              )}
              {renderGauge(
                'Lub Oil Pressure',
                lubOilPressure,
                0,
                8.0,
                'Bar',
                2,
                1.0,
                undefined
              )}
            </div>

            {/* Bottom Row: Exhaust Temperatures & Status Annunciators */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Exhaust Temp LB */}
              {renderGauge(
                'Exhaust Temp. LB',
                exhaustTempLb,
                0,
                800,
                'DegC',
                0,
                undefined,
                650
              )}

              {/* Central Annunciator Status Lamps */}
              <div className={`bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono ${isLandscapeMode ? 'col-span-2' : ''}`}>
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>DISCRETE SAFETY INTERLOCKS (%M)</span>
                  <span className="text-emerald-400">STATUS: HEALTHY</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Turning Gear:</span>
                    <span className="text-emerald-400 font-bold">DISENGAGED</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Prelube Pump:</span>
                    <span className="text-emerald-400 font-bold">PRESSURE OK</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Slow-Turn Check:</span>
                    <span className="text-emerald-400 font-bold">COMPLETED</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Turbo Boost:</span>
                    <span className="text-white font-bold">{turboBoost.toFixed(2)} Bar</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Common Rail Fuel:</span>
                    <span className="text-amber-400 font-bold">{fuelRailPressure} Bar</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">E-Stop Loop (%M1):</span>
                    <span className={isEmStopActive ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                      {isEmStopActive ? 'TRIPPED' : 'ARMED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exhaust Temp RB */}
              {renderGauge(
                'Exhaust Temp. RB',
                exhaustTempRb,
                0,
                800,
                'DegC',
                0,
                undefined,
                650
              )}
            </div>
          </div>
        )}

        {/* ================= SCENARIO 2: ALTERNATOR / GENSET ================= */}
        {activeScenario === 'ALTERNATOR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
              <span className="text-sky-400 font-bold flex items-center gap-1.5">
                <span>⚡</span>
                <span>AUXILIARY DIESEL GENERATOR / ALTERNATOR TELEMETRY (%MW200-%MW220)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Breaker (ACB):</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  isAcbClosed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                }`}>
                  {isAcbClosed ? 'CLOSED (ON BUS)' : 'TRIPPED / OPEN'}
                </span>
              </div>
            </div>

            {/* Alternator Instruments Grid */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
              {/* Voltage Dial */}
              {renderGauge(
                `Voltage (${selectedVoltagePhase})`,
                selectedVoltagePhase === 'L1-L2' ? voltageL1L2 : selectedVoltagePhase === 'L2-L3' ? voltageL2L3 : voltageL3L1,
                300,
                500,
                'V AC',
                1,
                380,
                420
              )}

              {/* Grid Frequency Dial (Crucial 50Hz) */}
              {renderGauge(
                'Grid Frequency',
                frequencyHz,
                45,
                55,
                'Hz',
                2,
                49.5,
                50.5,
                'lg'
              )}

              {/* Active Real Power (kW) */}
              {renderGauge(
                'Active Real Power',
                activePowerKw,
                0,
                350,
                'kW',
                1,
                0, // Reverse power warning if < 0
                300
              )}

              {/* Power Factor cos phi */}
              {renderGauge(
                'Power Factor (cos φ)',
                powerFactor,
                0.5,
                1.0,
                'cos φ',
                2,
                0.75,
                undefined
              )}

              {/* Stator Winding Temp */}
              {renderGauge(
                'Stator Temp. (Max)',
                Math.max(statorTempU, statorTempV, statorTempW),
                0,
                150,
                'DegC',
                0,
                undefined,
                110
              )}
            </div>

            {/* 3-Phase Loading Bars & Electrical Status */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* 3-Phase Current Bars */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="text-slate-300 font-bold flex justify-between border-b border-slate-800 pb-1">
                  <span>3-PHASE CURRENT LOADING (%MW204-%MW206)</span>
                  <span className="text-sky-400">FLC: 450A</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Phase L1 Current:</span>
                      <span className="text-white font-bold">{currentL1.toFixed(1)} A</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${(currentL1 / 450) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Phase L2 Current:</span>
                      <span className="text-white font-bold">{currentL2.toFixed(1)} A</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${(currentL2 / 450) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Phase L3 Current:</span>
                      <span className="text-white font-bold">{currentL3.toFixed(1)} A</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${(currentL3 / 450) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>Phase Imbalance: &lt;2.1% (Acceptable)</span>
                  <span>Rated Power: 250 kVA / 200 kW</span>
                </div>
              </div>

              {/* Alternator Excitation & Stator Health */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>AVR EXCITATION & STATOR SLOTS</span>
                  <span className="text-emerald-400">AVR: STABLE</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Stator Slot U:</span>
                    <span className="text-white font-bold">{statorTempU} °C</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Stator Slot V:</span>
                    <span className="text-white font-bold">{statorTempV} °C</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Stator Slot W:</span>
                    <span className="text-white font-bold">{statorTempW} °C</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">DE Roller Bearing:</span>
                    <span className="text-white font-bold">{bearingTempDe} °C</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800 col-span-2 flex justify-between items-center">
                    <span className="text-slate-400">Brushless Exciter Field:</span>
                    <span className="text-amber-400 font-bold">{exciterVoltageDc.toFixed(1)} V DC (2.8 A)</span>
                  </div>
                </div>

                {isReversePowerTrip && (
                  <div className="p-2 bg-red-950/80 border border-red-500/80 rounded text-red-200 text-[10px] flex items-center justify-between animate-pulse">
                    <span className="font-bold">REVERSE POWER RELAY TRIPPED</span>
                    <button
                      onClick={() => {
                        setIsReversePowerTrip(false);
                        setIsAcbClosed(true);
                        setActivePowerKw(185);
                      }}
                      className="px-2 py-0.5 bg-red-600 text-white rounded font-bold"
                    >
                      Reset Relays
                    </button>
                  </div>
                )}
              </div>

              {/* Landscape Extra Column: Synchronizer status */}
              {isLandscapeMode && (
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">
                    SYNCHROSCOPE & GRID BUS
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-700 relative flex items-center justify-center">
                      <div className="w-1 h-6 bg-emerald-400 origin-bottom absolute -translate-y-3"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold mt-2">IN PHASE • ZERO VOLTAGE DIFF</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SCENARIO 3: GEARBOX & TRANSMISSION ================= */}
        {activeScenario === 'GEARBOX' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span>⚙️</span>
                <span>MARINE REDUCTION GEARBOX & CLUTCH TELEMETRY (%MW300-%MW315)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Clutch Position:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  clutchState === 'AHEAD' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  clutchState === 'NEUTRAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}>
                  {clutchState}
                </span>
              </div>
            </div>

            {/* Gearbox Gauges Cluster */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
              {/* Clutch Operating Pressure (Crucial!) */}
              {renderGauge(
                'Clutch Control Pressure',
                clutchPressure,
                0,
                35.0,
                'Bar',
                1,
                18.0, // Alarm if below 18 Bar
                undefined,
                'lg'
              )}

              {/* Lube Oil Spray Pressure */}
              {renderGauge(
                'GB Lube Spray Pressure',
                lubeSprayPressure,
                0,
                8.0,
                'Bar',
                1,
                1.8,
                undefined
              )}

              {/* Sump Oil Temp */}
              {renderGauge(
                'Gearbox Sump Temp',
                gearboxSumpTemp,
                0,
                120,
                'DegC',
                0,
                undefined,
                75
              )}

              {/* Filter Delta P */}
              {renderGauge(
                'Filter Differential ΔP',
                filterDeltaP,
                0,
                2.0,
                'Bar',
                2,
                undefined,
                0.80 // Dirty filter warning at 0.8 Bar
              )}

              {/* Clutch Slip Percent */}
              {renderGauge(
                'Clutch Slip %',
                clutchSlipPercent,
                0,
                20,
                '%',
                1,
                undefined,
                3.0 // High slip warning
              )}
            </div>

            {/* Drivetrain Reduction & Shaft Speed Dynamics */}
            <div className={`grid gap-3 ${isLandscapeMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>SHAFT SPEED & REDUCTION RATIO</span>
                  <span className="text-amber-400 font-bold">RATIO {gearRatio}:1</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-center">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">ENGINE INPUT SHAFT</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{engineRpm}</span>
                    <span className="text-[10px] text-slate-500 block">RPM (%MW303)</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">PROPELLER TAILSHAFT</span>
                    <span className="text-2xl font-bold font-mono text-amber-400">{outputPropellerRpm}</span>
                    <span className="text-[10px] text-slate-500 block">RPM (%MW304)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Torque Converter & Slip:</span>
                  <span className={clutchSlipPercent > 2.0 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                    {clutchSlipPercent.toFixed(1)}% (LOCKED DRIVE)
                  </span>
                </div>
              </div>

              {/* Hydraulic Solenoid & Interlock Status */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex justify-between">
                  <span>CLUTCH SOLENOIDS & HYDRAULIC VALVES</span>
                  <span className="text-emerald-400">VALVES: ENERGIZED</span>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1">
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Proportional Ahead Solenoid:</span>
                    <span className={clutchState === 'AHEAD' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {clutchState === 'AHEAD' ? '24V DC (ACTIVE)' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Proportional Astern Solenoid:</span>
                    <span className={clutchState === 'ASTERN' ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                      {clutchState === 'ASTERN' ? '24V DC (ACTIVE)' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">PTO Hydraulic Pump Clutch:</span>
                    <span className="text-emerald-400 font-bold">ENGAGED</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-slate-950 rounded">
                    <span className="text-slate-400">Disc Shaft Brake:</span>
                    <span className="text-emerald-400 font-bold">RELEASED (FREE)</span>
                  </div>
                </div>
              </div>

              {/* Landscape Extra Column */}
              {isLandscapeMode && (
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">
                    CLUTCH POSITION COMMAND
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    <button
                      onClick={() => setClutchState('AHEAD')}
                      className={`flex-1 py-2 rounded text-[11px] font-bold ${
                        clutchState === 'AHEAD' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      AHEAD
                    </button>
                    <button
                      onClick={() => setClutchState('NEUTRAL')}
                      className={`flex-1 py-2 rounded text-[11px] font-bold ${
                        clutchState === 'NEUTRAL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      NEUTRAL
                    </button>
                    <button
                      onClick={() => setClutchState('ASTERN')}
                      className={`flex-1 py-2 rounded text-[11px] font-bold ${
                        clutchState === 'ASTERN' ? 'bg-blue-500 text-white' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      ASTERN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SCENARIO 4: INTEGRATED PLANT OVERVIEW ================= */}
        {activeScenario === 'OVERVIEW' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-purple-400 font-bold flex items-center gap-1.5">
                <span>🎛️</span>
                <span>INTEGRATED MARINE POWERTRAIN & ELECTRICAL PLANT OVERVIEW</span>
              </span>
              <span className="text-emerald-400 font-bold">
                ALL PLC SUBNETS COMMUNICATING VIA MODBUS TCP & CDC-ACM
              </span>
            </div>

            {/* Powertrain Flow Diagram */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>SYNCHRONIZED PROPULSION DRIVETRAIN (ENGINE ➔ GEARBOX ➔ SHAFT)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* Stage 1: Main Engine */}
                <div 
                  onClick={() => setActiveScenario('MAIN_ENGINE')}
                  className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-emerald-400">1. MAIN DIESEL ENGINE</span>
                    <span className="text-[10px] text-slate-400">%MW100</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{engineRpm} <span className="text-xs text-slate-400">RPM</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Cooling: <span className="text-emerald-400">{seaWaterPressure.toFixed(2)} Bar</span> • {coolantTemp}°C
                  </div>
                </div>

                {/* Stage 2: Gearbox */}
                <div 
                  onClick={() => setActiveScenario('GEARBOX')}
                  className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 hover:border-amber-400 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-amber-400">2. ZF REDUCTION GEARBOX</span>
                    <span className="text-[10px] text-slate-400">%MW300</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{clutchPressure.toFixed(1)} <span className="text-xs text-slate-400">Bar</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ratio {gearRatio}:1 • Clutch: <span className="text-amber-400 font-bold">{clutchState}</span>
                  </div>
                </div>

                {/* Stage 3: Propeller Output */}
                <div 
                  onClick={() => setActiveScenario('THRUSTER')}
                  className="p-3 bg-slate-950 rounded-xl border border-indigo-500/40 hover:border-indigo-400 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-indigo-400">3. PROPELLER SHAFT</span>
                    <span className="text-[10px] text-slate-400">%MW304</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{outputPropellerRpm} <span className="text-xs text-slate-400">RPM</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Azimuth: <span className="text-indigo-400 font-bold">{steeringAngle}°</span> • Slip: 0.0%
                  </div>
                </div>
              </div>
            </div>

            {/* Electrical Power Generation Overview */}
            <div 
              onClick={() => setActiveScenario('ALTERNATOR')}
              className="p-4 bg-slate-900/90 rounded-2xl border border-sky-500/30 hover:border-sky-400 transition cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>AUXILIARY GENERATOR & MAIN 400V SWITCHBOARD BUS</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">GRID SYNC: LOCKED</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">LINE VOLTAGE</span>
                  <span className="text-lg font-bold text-white">{voltageL1L2.toFixed(1)} V</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">FREQUENCY</span>
                  <span className="text-lg font-bold text-emerald-400">{frequencyHz.toFixed(2)} Hz</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">TOTAL REAL LOAD</span>
                  <span className="text-lg font-bold text-sky-400">{activePowerKw.toFixed(1)} kW</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">ACB BREAKER</span>
                  <span className={`text-lg font-bold ${isAcbClosed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isAcbClosed ? 'ON BUS' : 'TRIPPED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCENARIO 5: ZF THRUSTER & STEERING (IMAGE 1) ================= */}
        {activeScenario === 'THRUSTER' && (
          <div className="space-y-4">
            {isEmStopActive && (
              <div className="p-3 bg-red-600 text-white rounded-xl font-mono font-bold flex items-center justify-between animate-siren">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 animate-bounce" />
                  <span>EM-STOP ACTIVE (BRIDGE) • 22501 A</span>
                </div>
                <span className="text-xs bg-black/40 px-2 py-1 rounded">THRUSTER 2 Main FWD Panel</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dial 1: Propeller % / RPM */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="flex items-center justify-between w-full text-xs font-mono text-slate-400 mb-2">
                  <span>PROPULSION CONTROL</span>
                  <span className="text-emerald-400 font-bold">FOLLOW-UP</span>
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="7"
                      strokeDasharray="251.2"
                      strokeDashoffset={`${(1 - propellerPercent / 100) * 251.2}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-3xl font-extrabold font-mono text-amber-400">{propellerRpm}</div>
                    <div className="text-xs font-mono text-slate-400">rpm ({propellerPercent}%)</div>
                    <div className="text-[10px] font-mono text-emerald-400 mt-1 font-bold">PROPULSION STARTED</div>
                  </div>
                </div>

                <div className="w-full mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-center">
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500">CLUTCH: </span>
                    <span className="text-emerald-400 font-bold">ENGAGED</span>
                  </div>
                  <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500">SETP: </span>
                    <span className="text-white font-bold">35 rpm</span>
                  </div>
                </div>
              </div>

              {/* Dial 2: Azimuth Steering Angle 360° */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="flex items-center justify-between w-full text-xs font-mono text-slate-400 mb-2">
                  <span>STEERING CONTROL (AZIMUTH)</span>
                  <span className="text-emerald-400 font-bold">STEERING STARTED</span>
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="3" />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <line
                        key={deg}
                        x1="50"
                        y1="10"
                        x2="50"
                        y2="14"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        transform={`rotate(${deg} 50 50)`}
                      />
                    ))}
                  </svg>

                  {/* Rotatable Vessel Pod */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                    style={{ transform: `rotate(${steeringAngle}deg)` }}
                  >
                    <div className="w-7 h-14 border-2 border-amber-400 rounded-full flex flex-col items-center justify-between p-1 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <div className="w-1.5 h-6 bg-slate-200 rounded"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 text-center font-mono">
                    <span className="text-xl font-bold text-white">{steeringAngle}°</span>
                    <span className="text-[10px] text-slate-400 block">deg (SETP: 92°)</span>
                  </div>
                </div>

                <div className="w-full mt-3 flex items-center justify-between text-[11px] font-mono p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">LEVER ALIGNED:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    YES (FWD PANEL)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SCENARIO 6: READ PLC DATA & MODBUS BUS MONITOR ================= */}
        {activeScenario === 'DATA_READER' && (
          <PlcLiveDataReader
            onTriggerAlert={(sev, title, msg, tag) => onTriggerAlert(sev, title, msg, tag, 'SCHNEIDER-M580')}
            onRegisterModified={(tag, val) => {
              if (tag === '%MW100') setSeaWaterPressure(val);
              else if (tag === '%MW101') setCoolantTemp(val);
              else if (tag === '%MW102') setEngineRpm(val);
              else if (tag === '%MW200') setVoltageL1L2(val);
              else if (tag === '%MW203') setFrequencyHz(val);
              else if (tag === '%MW300') setClutchPressure(val);
            }}
          />
        )}
      </div>

      {/* Real-Time Alarm Ticker Bar (matches red/orange bottom banner from reference photo #2) */}
      <div className={`px-4 py-2 flex items-center justify-between border-t text-xs font-mono transition ${
        latestAlert && latestAlert.status === 'ACTIVE'
          ? latestAlert.severity === 'CRITICAL'
            ? 'bg-red-950 border-red-500 text-red-200'
            : 'bg-amber-950/90 border-amber-500/80 text-amber-200'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-bold flex items-center gap-1 shrink-0">
            {latestAlert && latestAlert.status === 'ACTIVE' ? (
              <AlertOctagon className="w-4 h-4 text-red-400 animate-ping" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            ALARM:
          </span>
          <span className="truncate font-semibold">
            {latestAlert && latestAlert.status === 'ACTIVE'
              ? `${latestAlert.title} — ${latestAlert.message}`
              : 'All systems operating within nominal limits. Direct Modicon telemetry normal.'}
          </span>
        </div>

        {latestAlert && latestAlert.status === 'ACTIVE' && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => onOpenChecklist(latestAlert)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold text-[10px] transition flex items-center gap-1 shadow-md shadow-amber-500/20"
            >
              <CheckSquare className="w-3 h-3" />
              <span>ROUTINE CHECKLIST</span>
            </button>
            <button
              onClick={() => onAcknowledge(latestAlert.id)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition"
            >
              ACK
            </button>
            <button
              onClick={() => {
                if (onOpenResetCenter) onOpenResetCenter(latestAlert);
                else onAcknowledge(latestAlert.id);
              }}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] transition"
            >
              RESET TRIP
            </button>
            <button
              onClick={() => onDispatch(latestAlert.id)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[10px] transition"
            >
              DISPATCH
            </button>
          </div>
        )}
      </div>

      {/* Function Keys F1-F8 Membrane Bar (matches physical function keys from reference photo #2) */}
      <div className="bg-slate-900 px-3 py-2 border-t border-slate-800 grid grid-cols-4 sm:grid-cols-8 gap-1.5 select-none font-mono">
        <button
          onClick={onToggleSound}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-300 rounded border border-slate-700 flex flex-col items-center justify-center transition"
          title="Stop Buzzer / Silence Siren"
        >
          <span className="text-[10px] text-amber-400 font-bold">F1</span>
          <span className="text-[9px] truncate w-full text-center">STOP BUZZER</span>
        </button>

        <button
          onClick={() => {
            if (onOpenResetCenter) onOpenResetCenter(latestAlert);
            else if (latestAlert) onAcknowledge(latestAlert.id);
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-300 rounded border border-slate-700 flex flex-col items-center justify-center transition"
        >
          <span className="text-[10px] text-amber-400 font-bold">F2</span>
          <span className="text-[9px] truncate w-full text-center">ALARM ACK / RESET</span>
        </button>

        <button
          onClick={() => {
            if (latestAlert) onDispatch(latestAlert.id);
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-300 rounded border border-slate-700 flex flex-col items-center justify-center transition"
        >
          <span className="text-[10px] text-amber-400 font-bold">F3</span>
          <span className="text-[9px] truncate w-full text-center">DISPATCH</span>
        </button>

        <button
          onClick={() => setActiveScenario('MAIN_ENGINE')}
          className={`p-1.5 rounded border flex flex-col items-center justify-center transition ${
            activeScenario === 'MAIN_ENGINE' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold">F4</span>
          <span className="text-[9px] truncate w-full text-center">MAIN ENGINE</span>
        </button>

        <button
          onClick={() => setActiveScenario('ALTERNATOR')}
          className={`p-1.5 rounded border flex flex-col items-center justify-center transition ${
            activeScenario === 'ALTERNATOR' ? 'bg-sky-600/30 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold">F5</span>
          <span className="text-[9px] truncate w-full text-center">ALTERNATOR</span>
        </button>

        <button
          onClick={() => setActiveScenario('GEARBOX')}
          className={`p-1.5 rounded border flex flex-col items-center justify-center transition ${
            activeScenario === 'GEARBOX' ? 'bg-amber-600/30 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold">F6</span>
          <span className="text-[9px] truncate w-full text-center">GEARBOX</span>
        </button>

        <button
          onClick={() => setActiveScenario('OVERVIEW')}
          className={`p-1.5 rounded border flex flex-col items-center justify-center transition ${
            activeScenario === 'OVERVIEW' ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold">F7</span>
          <span className="text-[9px] truncate w-full text-center">OVERVIEW</span>
        </button>

        <button
          onClick={() => setActiveScenario('DATA_READER')}
          className={`p-1.5 rounded border flex flex-col items-center justify-center transition ${
            activeScenario === 'DATA_READER' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold">F8</span>
          <span className="text-[9px] truncate w-full text-center">READ PLC DATA</span>
        </button>
      </div>

    </div>
  );
};
