import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Clock,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Download,
  Wrench,
  Sparkles,
  Info,
  RefreshCw,
  Cpu,
  Gauge,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { generate24HourHistory } from '../data/telemetryHistory';
import {
  computePredictiveRegression,
  HistoricalPoint,
  RegressionModelType,
} from '../utils/regressionEngine';

interface ComponentFailureProfile {
  id: string;
  name: string;
  subsystem: string;
  plcTag: string;
  machineId: string;
  metricName: string;
  unit: string;
  isDecay: boolean;
  nominalValue: number;
  warnThreshold: number;
  criticalThreshold: number;
  defaultModel: RegressionModelType;
  description: string;
  preventativeAction: string;
  checklistCode: string;
  extractValue: (d: any) => number;
}

const COMPONENT_PROFILES: ComponentFailureProfile[] = [
  {
    id: 'main-engine-bearing',
    name: 'Main Engine Cyl 1 Thrust Bearing',
    subsystem: 'Propulsion Plant',
    plcTag: '%MW102 (Bearing Temp)',
    machineId: 'schneider',
    metricName: 'Bearing Temperature',
    unit: '°C',
    isDecay: false,
    nominalValue: 62.0,
    warnThreshold: 78.0,
    criticalThreshold: 88.0,
    defaultModel: 'QUADRATIC',
    description: 'Thermal expansion and hydrodynamic oil-wedge deterioration on main thrust pad.',
    preventativeAction: 'Inspect lube oil cooler flow, verify viscosity, flush duplex oil strainer filter element.',
    checklistCode: 'PROC-M580-THRUST-01',
    extractValue: (d) => d.temperatureC,
  },
  {
    id: 'seawater-pump',
    name: 'Sea Water Suction Pump Impeller',
    subsystem: 'Auxiliary Cooling Loop',
    plcTag: '%MW101 (Suction Press)',
    machineId: 'schneider',
    metricName: 'Suction Pressure',
    unit: 'Bar',
    isDecay: true,
    nominalValue: 1.35,
    warnThreshold: 0.85,
    criticalThreshold: 0.40,
    defaultModel: 'LINEAR',
    description: 'Suction strainer bio-fouling and impeller cavitation causing vacuum collapse.',
    preventativeAction: 'Switch to sea-chest secondary suction, execute backwash cycle on strainer basket.',
    checklistCode: 'PROC-SW-STRAINER-02',
    extractValue: (d) => d.pressureBar,
  },
  {
    id: 'gearbox-thrust-vibration',
    name: 'Marine Reduction Gearbox Pinion',
    subsystem: 'Drive Transmission',
    plcTag: '%MW304 (Pinion Vibration)',
    machineId: 'hydraulic',
    metricName: 'Vibration RMS',
    unit: 'mm/s',
    isDecay: false,
    nominalValue: 1.2,
    warnThreshold: 3.0,
    criticalThreshold: 4.5,
    defaultModel: 'QUADRATIC',
    description: 'Accelerated tooth pitting and harmonic vibration exceeding ISO 10816 Zone C limits.',
    preventativeAction: 'Perform tooth contact pattern check, de-rate propulsion throttle to 65% RPM.',
    checklistCode: 'PROC-ZF-GEARBOX-04',
    extractValue: (d) => d.vibrationRms,
  },
  {
    id: 'alternator-stator',
    name: 'Aux GenSet 400V Stator Winding',
    subsystem: 'Electrical Power Plant',
    plcTag: '%MW206 (Stator Temp)',
    machineId: 'spindle',
    metricName: 'Stator Core Temp',
    unit: '°C',
    isDecay: false,
    nominalValue: 55.0,
    warnThreshold: 85.0,
    criticalThreshold: 105.0,
    defaultModel: 'LINEAR',
    description: 'Class F thermal insulation degradation driven by harmonic distortion & high kVA demand.',
    preventativeAction: 'Synchronize Standby Generator #2, shed non-essential galley/deck loads.',
    checklistCode: 'PROC-GEN-LOADSHED-03',
    extractValue: (d) => parseFloat((d.temperatureC * 1.15).toFixed(1)),
  },
];

interface PredictiveAnalyticsTabProps {
  onOpenChecklist?: (checklistCode: string) => void;
  onTriggerAlert?: (sev: 'CRITICAL' | 'HIGH' | 'MEDIUM', title: string, msg: string, tag: string) => void;
}

export const PredictiveAnalyticsTab: React.FC<PredictiveAnalyticsTabProps> = ({
  onOpenChecklist,
  onTriggerAlert,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('main-engine-bearing');
  const [modelType, setModelType] = useState<RegressionModelType>('QUADRATIC');
  const [forecastHorizon, setForecastHorizon] = useState<number>(24);
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState<boolean>(true);
  const [confidenceLevel, setConfidenceLevel] = useState<0.90 | 0.95 | 0.99>(0.95);
  const [simulateIntervention, setSimulateIntervention] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const selectedProfile = useMemo(
    () => COMPONENT_PROFILES.find((p) => p.id === selectedProfileId) || COMPONENT_PROFILES[0],
    [selectedProfileId]
  );

  // Generate historical data points for regression
  const historicalPoints: HistoricalPoint[] = useMemo(() => {
    const rawData = generate24HourHistory(selectedProfile.machineId);
    return rawData.map((d, idx) => ({
      index: idx,
      timestamp: d.timestamp,
      timeLabel: d.time,
      actualValue: selectedProfile.extractValue(d),
    }));
  }, [selectedProfile]);

  // Compute regression and prediction intervals
  const predictionResult = useMemo(() => {
    return computePredictiveRegression(
      historicalPoints,
      selectedProfile.criticalThreshold,
      selectedProfile.isDecay,
      forecastHorizon,
      modelType,
      confidenceLevel,
      simulateIntervention
    );
  }, [
    historicalPoints,
    selectedProfile,
    forecastHorizon,
    modelType,
    confidenceLevel,
    simulateIntervention,
  ]);

  // Handle Export Forecast Dossier (CSV/JSON)
  const handleExportForecast = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      component: selectedProfile.name,
      subsystem: selectedProfile.subsystem,
      plcTag: selectedProfile.plcTag,
      model: modelType,
      confidenceLevel: `${confidenceLevel * 100}%`,
      rSquared: predictionResult.rSquared,
      driftSlopePerHour: `${predictionResult.slopePerHour} ${selectedProfile.unit}/hr`,
      standardError: predictionResult.standardError,
      criticalThreshold: `${selectedProfile.criticalThreshold} ${selectedProfile.unit}`,
      expectedFailureDate: predictionResult.expectedFailureDateStr,
      earliestFailureDate: predictionResult.earliestFailureDateStr,
      latestFailureDate: predictionResult.latestFailureDateStr,
      remainingUsefulLife: predictionResult.rulFormatted,
      riskLevel: predictionResult.riskLevel,
      forecastData: predictionResult.points,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictive_forecast_${selectedProfile.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Custom Chart Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border-2 border-slate-700 rounded-xl p-3 shadow-2xl font-mono text-xs text-slate-200 min-w-[240px] space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              {label}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                data.isHistorical
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {data.isHistorical ? 'HISTORICAL' : 'PREDICTION'}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            {data.actualValue !== undefined && (
              <div className="flex justify-between text-amber-400">
                <span>Observed Telemetry:</span>
                <strong className="text-white">
                  {data.actualValue} {selectedProfile.unit}
                </strong>
              </div>
            )}
            <div className="flex justify-between text-sky-400">
              <span>{data.isHistorical ? 'Trend Fit:' : 'Forecast Projected:'}</span>
              <strong className="text-white">
                {data.regressionValue} {selectedProfile.unit}
              </strong>
            </div>

            {showConfidenceIntervals && data.upperCi !== undefined && (
              <>
                <div className="flex justify-between text-red-400/90 text-[10px] pt-1 border-t border-slate-800/80">
                  <span>Upper CI ({confidenceLevel * 100}%):</span>
                  <span className="font-semibold text-red-300">
                    {data.upperCi} {selectedProfile.unit}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400/90 text-[10px]">
                  <span>Lower CI ({confidenceLevel * 100}%):</span>
                  <span className="font-semibold text-emerald-300">
                    {data.lowerCi} {selectedProfile.unit}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
              <span>Failure Limit:</span>
              <span className="text-red-400 font-bold">
                {selectedProfile.criticalThreshold} {selectedProfile.unit}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
              ALGORITHM: OLS & QUADRATIC POLYNOMIAL REGRESSION
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
              LIVE TELEMETRY DRIFT ANALYSIS
            </span>
          </div>
          <h2 className="text-xl font-black text-white font-mono mt-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-400" />
            PREDICTIVE COMPONENT FAILURE ANALYTICS & RUL FORECAST
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Statistical regression modeling on live PLC registers to forecast time-to-failure (Remaining Useful Life) before physical hardware breakdown occurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportForecast}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition"
            title="Export forecast dataset and statistical confidence interval matrix"
          >
            {downloadSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-sky-400" />
            )}
            <span>{downloadSuccess ? 'Exported JSON' : 'Export Forecast'}</span>
          </button>

          {onOpenChecklist && (
            <button
              onClick={() => onOpenChecklist(selectedProfile.checklistCode)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Wrench className="w-4 h-4" />
              <span>Open Preventative Protocol</span>
            </button>
          )}
        </div>
      </div>

      {/* Component Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COMPONENT_PROFILES.map((profile) => {
          const isSelected = profile.id === selectedProfileId;
          return (
            <button
              key={profile.id}
              onClick={() => {
                setSelectedProfileId(profile.id);
                setModelType(profile.defaultModel);
              }}
              className={`text-left p-3.5 rounded-xl border transition relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {profile.subsystem}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {profile.plcTag}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-200 mt-1 truncate">
                {profile.name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Metric: <span className="text-slate-300 font-mono font-medium">{profile.metricName} ({profile.unit})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-500">Trip Limit:</span>
                <span className="text-red-400 font-bold">
                  {profile.criticalThreshold} {profile.unit}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Executive Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Card 1: Predicted Failure Date */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          predictionResult.riskLevel === 'CRITICAL'
            ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/40'
            : predictionResult.riskLevel === 'HIGH'
            ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/40'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                PREDICTED FAILURE DATE
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                  predictionResult.riskLevel === 'CRITICAL'
                    ? 'bg-red-500/30 text-red-300 border border-red-500/60 animate-pulse'
                    : predictionResult.riskLevel === 'HIGH'
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/30 text-emerald-300'
                }`}
              >
                {predictionResult.riskLevel} RISK
              </span>
            </div>
            <div className="text-xl font-mono font-black text-white mt-2 leading-tight">
              {predictionResult.expectedFailureDateStr}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800">
            {predictionResult.hasFailurePredicted ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                Threshold breach projected before horizon end
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                No breach expected in current window
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Remaining Useful Life (RUL) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                REMAINING USEFUL LIFE (RUL)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ESTIMATED</span>
            </div>
            <div className="text-2xl font-mono font-black text-sky-400 mt-2">
              {predictionResult.rulFormatted}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Health Index:</span>
            <span className={`font-bold ${
              predictionResult.healthScorePct < 40 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {predictionResult.healthScorePct}% Healthy
            </span>
          </div>
        </div>

        {/* Card 3: Confidence Window (Earliest vs Latest Failure) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                CONFIDENCE INTERVAL ({(confidenceLevel * 100).toFixed(0)}%)
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-semibold">
                ±{predictionResult.standardError} {selectedProfile.unit}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs font-mono">
              <div className="flex justify-between items-center text-red-400">
                <span className="text-[11px] text-slate-400">Earliest (Worst-Case):</span>
                <span className="font-bold">{predictionResult.earliestFailureDateStr}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span className="text-[11px] text-slate-400">Latest (Best-Case):</span>
                <span className="font-bold">{predictionResult.latestFailureDateStr}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Derived from t-distribution prediction error envelope
          </div>
        </div>

        {/* Card 4: Model Statistics */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                MODEL STATS & FIT
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                R² = {predictionResult.rSquared}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Degradation Rate (dy/dt):</span>
                <span className="text-slate-200 font-bold">
                  {predictionResult.slopePerHour > 0 ? '+' : ''}
                  {predictionResult.slopePerHour} {selectedProfile.unit}/hr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Model:</span>
                <span className="text-sky-400 font-bold">{modelType}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Standard error of regression: {predictionResult.standardError}
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Confidence Interval Toggle & Controls */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={showConfidenceIntervals}
                onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Display Confidence Interval Envelope
              </span>
            </label>

            {showConfidenceIntervals && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 px-2">Level:</span>
                {([0.90, 0.95, 0.99] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setConfidenceLevel(lvl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      confidenceLevel === lvl
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {(lvl * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Type Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400" />
              Algorithm:
            </span>
            {(['LINEAR', 'QUADRATIC', 'EXPONENTIAL'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModelType(m)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                  modelType === m
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'LINEAR' ? 'Linear OLS' : m === 'QUADRATIC' ? 'Accelerated Quadratic' : 'Exponential'}
              </button>
            ))}
          </div>

          {/* Forecast Horizon */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              Horizon:
            </span>
            {[12, 24, 48, 72].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setForecastHorizon(hrs)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  forecastHorizon === hrs
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                +{hrs}h
              </button>
            ))}
          </div>

          {/* Preventative Simulation Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
            <input
              type="checkbox"
              checked={simulateIntervention}
              onChange={(e) => setSimulateIntervention(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Simulate Preventative Maintenance Impact
            </span>
          </label>
        </div>
      </div>

      {/* Main Predictive Chart Component */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              TELEMETRY REGRESSION & FAILURE INTERSECTION ENVELOPE
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Historical 24h observations plotted against predictive regression trajectory with {confidenceLevel * 100}% confidence bounds.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              Observed Sensor Values
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-4 h-0.5 bg-sky-400 inline-block border-t-2 border-sky-400" />
              Regression Prediction
            </span>
            {showConfidenceIntervals && (
              <span className="flex items-center gap-1.5 text-sky-300">
                <span className="w-3 h-3 rounded bg-sky-400/20 border border-sky-400/60 inline-block" />
                Confidence Band ({confidenceLevel * 100}%)
              </span>
            )}
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-4 h-0.5 bg-red-500 inline-block border-t-2 border-dashed border-red-500" />
              Trip Threshold
            </span>
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="h-[360px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={predictionResult.points}
              margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
            >
              <defs>
                <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                interval={Math.ceil(predictionResult.points.length / 10)}
              />

              <YAxis
                stroke="#64748b"
                domain={['auto', 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit={` ${selectedProfile.unit}`}
              />

              <Tooltip content={<CustomForecastTooltip />} />

              {/* Confidence Interval Shaded Area */}
              {showConfidenceIntervals && (
                <Area
                  type="monotone"
                  dataKey="upperCi"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="url(#ciGradient)"
                  name={`Upper CI (${confidenceLevel * 100}%)`}
                  isAnimationActive={false}
                />
              )}

              {showConfidenceIntervals && (
                <Area
                  type="monotone"
                  dataKey="lowerCi"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="#0f172a"
                  fillOpacity={0.9}
                  name={`Lower CI (${confidenceLevel * 100}%)`}
                  isAnimationActive={false}
                />
              )}

              {/* Critical Failure Threshold Line */}
              <ReferenceLine
                y={selectedProfile.criticalThreshold}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `CRITICAL TRIP LIMIT: ${selectedProfile.criticalThreshold} ${selectedProfile.unit}`,
                  fill: '#ef4444',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                }}
              />

              {/* Warning Threshold Line */}
              <ReferenceLine
                y={selectedProfile.warnThreshold}
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{
                  value: `WARN: ${selectedProfile.warnThreshold} ${selectedProfile.unit}`,
                  fill: '#f59e0b',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'insideBottomRight',
                }}
              />

              {/* Regression Trendline (Continuous fit + forecast) */}
              <Line
                type="monotone"
                dataKey="regressionValue"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                name="Regression Trajectory"
                isAnimationActive={false}
              />

              {/* Observed historical points */}
              <Line
                type="monotone"
                dataKey="actualValue"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b', stroke: '#78350f', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#fbbf24' }}
                name="Actual Sensor Reading"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Subtext / Explanation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Threshold intersection: {predictionResult.expectedFailureDateStr} (
              {predictionResult.rulFormatted} Remaining Useful Life)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Confidence envelope width:</span>
            <span className="text-slate-300 font-bold">
              ±{(predictionResult.standardError * 1.96).toFixed(2)} {selectedProfile.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Deep-Dive Diagnostics & Actionable Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Failure Dynamics & Preventative Actions */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            RECOMMENDED PREVENTATIVE COUNTERMEASURES
          </h4>
          <p className="text-xs text-slate-400 font-sans">
            {selectedProfile.description}
          </p>

          <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/30 text-xs font-mono space-y-1.5">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Action Prior to Predicted Failure Date:
            </div>
            <p className="text-slate-300 font-sans">
              {selectedProfile.preventativeAction}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-slate-400">
              Associated Procedure: <span className="text-sky-400 font-bold">{selectedProfile.checklistCode}</span>
            </div>
            {onOpenChecklist && (
              <button
                onClick={() => onOpenChecklist(selectedProfile.checklistCode)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5"
              >
                <span>Launch Procedure Checklist</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Regression Coefficients & Equation */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            MATHEMATICAL MODEL SPECIFICATIONS
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">FIT EQUATION</span>
              <span className="text-white font-bold">
                {modelType === 'QUADRATIC'
                  ? 'y = ax² + bx + c'
                  : modelType === 'EXPONENTIAL'
                  ? 'y = a · e^(bx)'
                  : 'y = mx + b'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">R² COEF OF DETERMINATION</span>
              <span className="text-emerald-400 font-bold">{predictionResult.rSquared} (High Correlation)</span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">SLOPE DERIVATIVE (dy/dt)</span>
              <span className="text-sky-400 font-bold">
                {predictionResult.slopePerHour} {selectedProfile.unit}/hr
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block">RESIDUAL STD ERROR (SE)</span>
              <span className="text-slate-300 font-bold">
                ±{predictionResult.standardError} {selectedProfile.unit}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Critical Failure Boundary:</span>
            <span className="text-red-400 font-bold">
              {selectedProfile.isDecay ? 'Dropping Below' : 'Exceeding'} {selectedProfile.criticalThreshold} {selectedProfile.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
