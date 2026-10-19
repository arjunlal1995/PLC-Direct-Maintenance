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
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  AlertOctagon, 
  Download, 
  Calendar, 
  Clock, 
  Layers, 
  Filter, 
  FileText, 
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Wrench
} from 'lucide-react';
import { generate24HourHistory, TelemetryDataPoint } from '../data/telemetryHistory';
import { PlcAlert } from '../types';
import { useNightShift } from '../context/NightShiftContext';

interface TelemetryTrendChartProps {
  onOpenChecklistForTrend?: () => void;
  onNavigateToPredictive?: () => void;
}

export const TelemetryTrendChart: React.FC<TelemetryTrendChartProps> = ({
  onOpenChecklistForTrend,
  onNavigateToPredictive,
}) => {
  const { isNightShift, palette, highContrast } = useNightShift();
  const [selectedMachine, setSelectedMachine] = useState<'schneider' | 'spindle' | 'hydraulic'>('schneider');
  const [timeRange, setTimeRange] = useState<'24h' | '12h' | '6h'>('24h');
  const [showTemp, setShowTemp] = useState(true);
  const [showPressure, setShowPressure] = useState(true);
  const [showVibration, setShowVibration] = useState(false);
  const [showThresholds, setShowThresholds] = useState(true);

  // Dynamic night shift colors for zero blue-glare
  const tempColor = isNightShift && palette === 'RED' ? '#ef4444' : '#f59e0b';
  const pressureColor = isNightShift ? (palette === 'RED' ? '#f87171' : '#f97316') : '#38bdf8';
  const gridColor = isNightShift ? (palette === 'RED' ? '#330808' : '#331702') : '#1e293b';
  const tickColor = isNightShift ? (palette === 'RED' ? '#f87171' : '#fbbf24') : '#94a3b8';

  // Generate historical points
  const rawData = useMemo(() => generate24HourHistory(selectedMachine), [selectedMachine]);

  // Slice based on time range
  const filteredData = useMemo(() => {
    if (timeRange === '6h') return rawData.slice(-7);
    if (timeRange === '12h') return rawData.slice(-13);
    return rawData;
  }, [rawData, timeRange]);

  // Calculate statistics for pattern analysis
  const stats = useMemo(() => {
    const temps = filteredData.map((d) => d.temperatureC);
    const pressures = filteredData.map((d) => d.pressureBar);

    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const maxPressure = Math.max(...pressures);
    const minPressure = Math.min(...pressures);
    const latest = filteredData[filteredData.length - 1];
    const initial = filteredData[0];

    const tempDelta = latest.temperatureC - initial.temperatureC;
    const pressureDelta = latest.pressureBar - initial.pressureBar;

    return {
      maxTemp,
      minTemp,
      maxPressure,
      minPressure,
      latest,
      tempDelta,
      pressureDelta,
      isAnomalous: latest.temperatureC > 78 || latest.pressureBar < 0.8,
    };
  }, [filteredData]);

  const handleExportCsv = () => {
    const headers = 'Time,Timestamp,Temperature_C,Pressure_Bar,Vibration_RMS,Status,Annotation\n';
    const rows = filteredData
      .map(
        (d) =>
          `"${d.time}",${d.timestamp},${d.temperatureC},${d.pressureBar},${d.vibrationRms},"${d.status}","${d.annotation || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PLC_Telemetry_24h_${selectedMachine}_export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Custom Dark Industrial Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: TelemetryDataPoint = payload[0].payload;
      return (
        <div className={`border-2 rounded-xl p-3 shadow-2xl font-mono text-xs space-y-1.5 min-w-[220px] ${
          isNightShift
            ? palette === 'RED'
              ? 'bg-black border-red-500 text-red-200'
              : 'bg-black border-amber-500 text-amber-200'
            : 'bg-slate-950/95 border-slate-700 text-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <span className="font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {label}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                dataPoint.status === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-300'
                  : dataPoint.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {dataPoint.status}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className={`flex justify-between ${isNightShift ? (palette === 'RED' ? 'text-red-300' : 'text-amber-300') : 'text-amber-400'}`}>
              <span>Temperature:</span>
              <strong className="text-white">{dataPoint.temperatureC} °C</strong>
            </div>
            <div className={`flex justify-between ${isNightShift ? (palette === 'RED' ? 'text-red-300' : 'text-amber-400') : 'text-sky-400'}`}>
              <span>Process Pressure:</span>
              <strong className="text-white">{dataPoint.pressureBar} Bar</strong>
            </div>
            {showVibration && (
              <div className="flex justify-between text-purple-400">
                <span>Vibration RMS:</span>
                <strong className="text-white">{dataPoint.vibrationRms} mm/s</strong>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Engine Speed:</span>
              <span className="text-slate-300">{dataPoint.rpm} RPM</span>
            </div>
          </div>

          {dataPoint.annotation && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-red-300 font-sans font-semibold">
              ⚠️ {dataPoint.annotation}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <span>PLC HISTORICAL TELEMETRY TREND (24-HOUR ANALYSIS)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Dual-Axis Real-Time
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Correlates thermal creep and pressure decay patterns over 24 hours to detect component wear before catastrophic failure.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Range Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Machine Selector */}
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            >
              <option value="schneider">Schneider Modicon M580 (Raw Sea Water Pump)</option>
              <option value="spindle">CNC 5-Axis Milling Spindle #4</option>
              <option value="hydraulic">Hydraulic Stamping Press #1</option>
            </select>

            {/* Time Window Buttons */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 font-mono text-xs">
              {(['24h', '12h', '6h'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg transition font-bold ${
                    timeRange === r
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="Export 24h Telemetry to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Jump to Predictive Analytics Tab */}
            {onNavigateToPredictive && (
              <button
                onClick={onNavigateToPredictive}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-purple-500/40 transition"
                title="Open Predictive Analytics & Regression RUL Forecast"
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>Forecast Failure Date (RUL)</span>
              </button>
            )}
          </div>
        </div>

        {/* Pattern Detection & Predictive Health Summary Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Card 1: Thermal Drift */}
          <div className={`p-3 rounded-xl border ${
            stats.tempDelta > 15
              ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">24H THERMAL DRIFT</span>
              <TrendingUp className={`w-3.5 h-3.5 ${stats.tempDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-lg font-bold font-mono mt-1 text-white">
              {stats.tempDelta > 0 ? `+${stats.tempDelta.toFixed(1)}°C` : `${stats.tempDelta.toFixed(1)}°C`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Peak: <strong className="text-amber-400">{stats.maxTemp}°C</strong> (Nominal: 65°C)
            </div>
          </div>

          {/* Card 2: Pressure Decay */}
          <div className={`p-3 rounded-xl border ${
            stats.pressureDelta < -0.4
              ? 'bg-red-950/30 border-red-500/50 text-red-200'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">PRESSURE DECAY GRADIENT</span>
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-lg font-bold font-mono mt-1 text-white">
              {stats.pressureDelta.toFixed(2)} Bar
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Low: <strong className="text-red-400">{stats.minPressure} Bar</strong> (Trip &lt;0.80)
            </div>
          </div>

          {/* Card 3: Detected Root Pattern */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-slate-300 col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">PREDICTIVE PATTERN IDENTIFIED</span>
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Strain Cavitation Profile
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-sans leading-relaxed">
              Steady pressure loss accompanied by inverse thermal rise indicates suction strainer basket clogging or impeller cavitation on the raw sea water line.
            </p>
            {onOpenChecklistForTrend && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">SOP Available: SOP-COOL-04</span>
                <button
                  onClick={onOpenChecklistForTrend}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold text-[10px] transition flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  Launch Maintenance Checklist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">DISPLAY SERIES:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-400">
              <input
                type="checkbox"
                checked={showTemp}
                onChange={(e) => setShowTemp(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Temperature (°C)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-sky-400">
              <input
                type="checkbox"
                checked={showPressure}
                onChange={(e) => setShowPressure(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Pressure (Bar)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-purple-400">
              <input
                type="checkbox"
                checked={showVibration}
                onChange={(e) => setShowVibration(e.target.checked)}
                className="accent-purple-500 rounded"
              />
              <span>Vibration (RMS)</span>
            </label>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 text-[11px]">
            <input
              type="checkbox"
              checked={showThresholds}
              onChange={(e) => setShowThresholds(e.target.checked)}
              className="accent-red-500 rounded"
            />
            <span>Show Safe / Warning Limits</span>
          </label>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className={`rounded-2xl p-5 border shadow-2xl transition-colors ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-500/60 shadow-red-950/40'
            : 'bg-black border-amber-500/60 shadow-amber-950/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tempColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={tempColor} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pressureColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pressureColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

              <XAxis
                dataKey="time"
                stroke={tickColor}
                tick={{ fill: tickColor, fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: gridColor }}
              />

              {/* Left Axis: Temperature (°C) */}
              <YAxis
                yAxisId="tempAxis"
                domain={[30, 100]}
                stroke={tempColor}
                tick={{ fill: tempColor, fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: tempColor }}
                unit="°C"
                width={50}
              />

              {/* Right Axis: Pressure (Bar) */}
              <YAxis
                yAxisId="pressureAxis"
                orientation="right"
                domain={[0, 2.5]}
                stroke={pressureColor}
                tick={{ fill: pressureColor, fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: pressureColor }}
                unit=" Bar"
                width={55}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: 15,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              />

              {/* Critical & Warning Threshold Reference Lines */}
              {showThresholds && (
                <>
                  <ReferenceLine
                    yAxisId="tempAxis"
                    y={85}
                    label={{
                      value: 'ALARM TEMP: 85°C',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      position: 'insideTopLeft',
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine
                    yAxisId="tempAxis"
                    y={75}
                    label={{
                      value: 'WARN TEMP: 75°C',
                      fill: '#f59e0b',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      position: 'insideBottomLeft',
                    }}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                  <ReferenceLine
                    yAxisId="pressureAxis"
                    y={0.80}
                    label={{
                      value: 'LOW PRESSURE TRIP: 0.80 Bar',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      position: 'insideTopRight',
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </>
              )}

              {/* Temperature Area & Line */}
              {showTemp && (
                <>
                  <Area
                    yAxisId="tempAxis"
                    type="monotone"
                    dataKey="temperatureC"
                    name="Temperature (°C)"
                    fill="url(#tempGradient)"
                    stroke={tempColor}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: tempColor, stroke: '#020617', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: tempColor }}
                  />
                </>
              )}

              {/* Pressure Area & Line */}
              {showPressure && (
                <>
                  <Line
                    yAxisId="pressureAxis"
                    type="monotone"
                    dataKey="pressureBar"
                    name="Pressure (Bar)"
                    stroke={pressureColor}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: pressureColor, stroke: '#020617', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: pressureColor }}
                  />
                </>
              )}

              {/* Optional Vibration Line */}
              {showVibration && (
                <Line
                  yAxisId="pressureAxis"
                  type="monotone"
                  dataKey="vibrationRms"
                  name="Vibration (mm/s)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 2, fill: '#c084fc' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer Interpretation Note */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Historical telemetry sampled at 1-hour rolling intervals from PLC Holding Registers (%MW100, %MW101).</span>
          </div>
          <span className="text-slate-500">Dual-axis scales synchronized with Schneider Modicon EU range.</span>
        </div>
      </div>
    </div>
  );
};
