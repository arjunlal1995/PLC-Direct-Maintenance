import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Wifi, 
  Battery, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  Wrench, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Zap,
  Radio,
  Sliders,
  RotateCcw,
  Smartphone,
  Tablet,
  Maximize2
} from 'lucide-react';
import { PlcAlert, Machine } from '../types';
import { audioAlerts } from '../utils/audioAlerts';

interface AndroidSimulatorProps {
  alerts: PlcAlert[];
  machines: Machine[];
  onAcknowledge: (id: string) => void;
  onDispatch: (id: string) => void;
  onSnooze: (id: string) => void;
  onTriggerTestAlert: (severity: PlcAlert['severity'], title: string, message: string, tag: string, machineId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenChecklist: (alert: PlcAlert) => void;
  onOpenResetCenter?: (alert?: PlcAlert) => void;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  alerts,
  machines,
  onAcknowledge,
  onDispatch,
  onSnooze,
  onTriggerTestAlert,
  soundEnabled,
  onToggleSound,
  onOpenChecklist,
  onOpenResetCenter,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [activeTab, setActiveTab] = useState<'alerts' | 'telemetry' | 'machines'>('alerts');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [headsUpAlert, setHeadsUpAlert] = useState<PlcAlert | null>(null);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // When a new critical or high alert appears, trigger Heads-Up banner on the simulated phone
  useEffect(() => {
    const activeUnack = alerts.find(
      (a) => a.status === 'ACTIVE' && (a.severity === 'CRITICAL' || a.severity === 'HIGH')
    );
    if (activeUnack) {
      setHeadsUpAlert(activeUnack);
    }
  }, [alerts]);

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  const filteredAlerts = alerts.filter((a) => {
    if (selectedFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (selectedFilter === 'ACTIVE') return a.status === 'ACTIVE';
    if (selectedFilter === 'RESOLVED') return a.status === 'RESOLVED' || a.status === 'ACKNOWLEDGED';
    return true;
  });

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Device Orientation Switcher Bar */}
      <div className="mb-4 flex items-center justify-between w-full max-w-4xl px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 font-semibold">DEVICE PROFILE:</span>
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-bold ${
                orientation === 'portrait'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Portrait Phone (Handheld)</span>
            </button>

            <button
              onClick={() => setOrientation('landscape')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-bold ${
                orientation === 'landscape'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Landscape Tablet (Mounted HMI)</span>
            </button>
          </div>
        </div>

        <span className="hidden sm:inline text-xs font-mono text-emerald-400">
          ● Android 14 • Auto-Adaptive Dual Orientation
        </span>
      </div>

      {/* Device Hardware Bezel */}
      <div className={`relative transition-all duration-500 bg-slate-900 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-600/40 select-none ${
        orientation === 'landscape'
          ? 'w-full max-w-[880px] h-[530px] rounded-[40px] p-3'
          : 'w-[360px] sm:w-[390px] h-[780px] rounded-[48px] p-3'
      }`}>
        
        {/* Hardware side bumper accents */}
        {orientation === 'portrait' ? (
          <>
            <div className="absolute -left-1 top-24 w-1.5 h-12 bg-amber-500 rounded-r"></div>
            <div className="absolute -left-1 top-40 w-1.5 h-16 bg-slate-700 rounded-r"></div>
            <div className="absolute -right-1 top-32 w-1.5 h-20 bg-slate-700 rounded-l"></div>
          </>
        ) : (
          <>
            <div className="absolute -top-1 left-24 h-1.5 w-12 bg-amber-500 rounded-b"></div>
            <div className="absolute -top-1 left-44 h-1.5 w-16 bg-slate-700 rounded-b"></div>
            <div className="absolute -bottom-1 right-36 h-1.5 w-20 bg-slate-700 rounded-t"></div>
          </>
        )}

        {/* Screen container */}
        <div className={`relative w-full h-full bg-slate-950 overflow-hidden flex flex-col border border-slate-800 ${
          orientation === 'landscape' ? 'rounded-[30px]' : 'rounded-[38px]'
        }`}>
          
          {/* Top Status Bar (Android 14) */}
          <div className="h-10 px-6 pt-2 flex items-center justify-between text-xs text-slate-300 font-mono z-40 bg-slate-950/90 backdrop-blur-sm border-b border-slate-900 shrink-0">
            <div className="flex items-center gap-1.5 font-bold">
              <span>{currentTime}</span>
              {activeAlertsCount > 0 && (
                <span className="flex items-center gap-0.5 px-1 py-0.2 bg-red-500/20 text-red-400 rounded text-[10px]">
                  <Bell className="w-2.5 h-2.5" />
                  {activeAlertsCount}
                </span>
              )}
            </div>

            {/* Front Camera cutout */}
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] text-emerald-400 font-sans font-semibold">5G / WiFi6</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">96%</span>
                <Battery className="w-3.5 h-3.5 text-slate-200" />
              </div>
            </div>
          </div>

          {/* Android Heads-Up Notification Banner (Slides down when alert fires) */}
          {headsUpAlert && headsUpAlert.status === 'ACTIVE' && (
            <div 
              className={`absolute top-11 z-50 rounded-2xl p-3.5 shadow-2xl transition-all duration-300 border ${
                orientation === 'landscape' ? 'left-8 right-8 max-w-2xl mx-auto' : 'left-2 right-2'
              } ${
                headsUpAlert.severity === 'CRITICAL'
                  ? 'bg-red-950/95 border-red-500/80 text-white animate-siren'
                  : 'bg-amber-950/95 border-amber-500/80 text-white animate-amber'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${headsUpAlert.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'}`}>
                    {headsUpAlert.severity === 'CRITICAL' ? (
                      <AlertOctagon className="w-4 h-4 text-white animate-bounce" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono tracking-wider uppercase text-slate-300 flex items-center gap-1.5">
                      <span>PLC DIRECT MAINTENANCE</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">PRIORITY: MAX</span>
                    </div>
                    <div className="font-bold text-xs leading-tight text-white mt-0.5">
                      {headsUpAlert.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setHeadsUpAlert(null)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Dismiss Heads-Up"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-200 line-clamp-2 bg-black/30 p-1.5 rounded font-mono">
                {headsUpAlert.message}
              </div>

              {/* Notification Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    onOpenChecklist(headsUpAlert);
                    setHeadsUpAlert(null);
                  }}
                  className="py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20"
                >
                  <span>📋</span>
                  <span>Routine Checklist</span>
                </button>

                <button
                  onClick={() => {
                    onAcknowledge(headsUpAlert.id);
                    setHeadsUpAlert(null);
                  }}
                  className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Acknowledge
                </button>

                {onOpenResetCenter && (
                  <button
                    onClick={() => {
                      onOpenResetCenter(headsUpAlert);
                      setHeadsUpAlert(null);
                    }}
                    className="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Trip
                  </button>
                )}

                <button
                  onClick={() => {
                    onDispatch(headsUpAlert.id);
                    setHeadsUpAlert(null);
                  }}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                >
                  <UserCheck className="w-3 h-3" />
                  Dispatch
                </button>

                <button
                  onClick={() => {
                    onSnooze(headsUpAlert.id);
                    setHeadsUpAlert(null);
                  }}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg flex items-center justify-center gap-0.5 transition"
                >
                  <Clock className="w-3 h-3" />
                  10m
                </button>
              </div>
            </div>
          )}

          {/* App Header Bar (Android Action Bar) */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold font-mono text-white tracking-wide">
                  PLC DIRECT MAINTENANCE {orientation === 'landscape' ? '• TABLET WORKSTATION' : ''}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400" />
                <span>Service: Active (Foreground DataSync)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenResetCenter && (
                <button
                  onClick={() => onOpenResetCenter()}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset / Ack Center</span>
                </button>
              )}

              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  soundEnabled
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={soundEnabled ? 'Alarm Sound: Enabled' : 'Alarm Sound: Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* LANDSCAPE TABLET DUAL-PANE VIEW */}
          {/* ============================================================== */}
          {orientation === 'landscape' ? (
            <div className="flex-1 overflow-hidden flex flex-row">
              {/* Left Pane: Machine Telemetry & Diagnostic Controls (38% width) */}
              <div className="w-[38%] border-r border-slate-800 p-3 overflow-y-auto space-y-3 bg-slate-950/60">
                <div className="text-[11px] font-mono font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span>LIVE GAUGES & DIAGNOSTICS</span>
                  <span className="text-emerald-400 text-[10px]">5 PLCs ONLINE</span>
                </div>

                {/* Quick Diagnostics Gauge Grid */}
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[9px] text-slate-400">SEA WATER PRESS</div>
                    <div className="text-base font-bold text-sky-400">0.85 Bar</div>
                    <div className="text-[9px] text-slate-500">Trip &lt; 0.80</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[9px] text-slate-400">COOLANT TEMP</div>
                    <div className="text-base font-bold text-amber-400">65.0 °C</div>
                    <div className="text-[9px] text-slate-500">Trip &gt; 95°C</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[9px] text-slate-400">ENGINE SPEED</div>
                    <div className="text-base font-bold text-white">705 RPM</div>
                    <div className="text-[9px] text-slate-500">Idle / Running</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[9px] text-slate-400">LUB OIL PRESS</div>
                    <div className="text-base font-bold text-emerald-400">1.44 Bar</div>
                    <div className="text-[9px] text-slate-500">Normal</div>
                  </div>
                </div>

                {/* Machine Node Overview */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Configured PLC Nodes</div>
                  {machines.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[10px] font-mono flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-bold text-slate-200 truncate">{m.name}</div>
                        <div className="text-slate-500">{m.plcType}</div>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Pane: Active Alarms & Work Order Operations (62% width) */}
              <div className="w-[62%] flex flex-col overflow-hidden bg-slate-950">
                {/* Filter bar */}
                <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {(['ALL', 'CRITICAL', 'ACTIVE', 'RESOLVED'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-2.5 py-1 rounded-full font-mono text-[10px] transition shrink-0 ${
                          selectedFilter === filter
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {filter} {filter === 'CRITICAL' && criticalCount > 0 ? `(${criticalCount})` : ''}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    Alarms: <strong className="text-amber-400">{filteredAlerts.length}</strong>
                  </span>
                </div>

                {/* Scrollable Alarms List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                      No alarms matching selected filter. All safety circuits closed.
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-2xl p-3 border transition-all ${
                          alert.status === 'ACTIVE'
                            ? alert.severity === 'CRITICAL'
                              ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/30'
                              : 'bg-amber-950/30 border-amber-500/60'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-slate-900/60 border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : alert.severity === 'HIGH'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">{alert.plcTag}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              alert.status === 'ACTIVE'
                                ? 'bg-red-500/20 text-red-300 font-bold'
                                : alert.status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>

                        <div className="mt-1 font-bold text-xs text-slate-100">{alert.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-300 leading-snug font-sans">{alert.message}</div>

                        {/* Action Buttons Toolbar in Landscape */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => onOpenChecklist(alert)}
                            className="py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1 transition"
                          >
                            <span>📋</span>
                            <span>SOP Checklist</span>
                          </button>

                          {alert.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => onAcknowledge(alert.id)}
                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                ACK
                              </button>
                              {onOpenResetCenter && (
                                <button
                                  onClick={() => onOpenResetCenter(alert)}
                                  className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  RESET TRIP
                                </button>
                              )}
                              <button
                                onClick={() => onDispatch(alert.id)}
                                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                              >
                                <UserCheck className="w-3 h-3" />
                                Dispatch
                              </button>
                            </>
                          )}

                          {alert.status === 'ACKNOWLEDGED' && alert.acknowledgedBy && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              ✓ {alert.acknowledgedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* PORTRAIT PHONE SINGLE-COLUMN VIEW                              */
            /* ============================================================== */
            <>
              {/* Quick Filter Badges */}
              <div className="px-3 py-2 bg-slate-950 border-b border-slate-900 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                {(['ALL', 'CRITICAL', 'ACTIVE', 'RESOLVED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-2.5 py-1 rounded-full font-mono text-[10px] transition shrink-0 ${
                      selectedFilter === filter
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {filter} {filter === 'CRITICAL' && criticalCount > 0 ? `(${criticalCount})` : ''}
                  </button>
                ))}
              </div>

              {/* Main Mobile App Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {activeTab === 'alerts' && (
                  <div className="space-y-2.5">
                    {filteredAlerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                        No alerts match the selected filter.
                      </div>
                    ) : (
                      filteredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-2xl p-3 border transition-all ${
                            alert.status === 'ACTIVE'
                              ? alert.severity === 'CRITICAL'
                                ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/30'
                                : 'bg-amber-950/30 border-amber-500/60'
                              : 'bg-slate-900/60 border-slate-800 opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                              {alert.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{alert.id}</span>
                          </div>

                          <div className="mt-1 font-bold text-xs text-white">{alert.title}</div>
                          <div className="mt-0.5 text-[11px] text-slate-300 font-sans">{alert.message}</div>

                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => onOpenChecklist(alert)}
                              className="w-full py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                            >
                              <span>📋</span>
                              <span>Routine Maintenance Checklist</span>
                            </button>
                            {alert.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => onAcknowledge(alert.id)}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Acknowledge
                                </button>
                                {onOpenResetCenter && (
                                  <button
                                    onClick={() => onOpenResetCenter(alert)}
                                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Android Navigation Bar (Portrait) */}
              <div className="h-14 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-around text-xs shrink-0">
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`flex flex-col items-center gap-0.5 transition ${
                    activeTab === 'alerts' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-[10px]">Alerts</span>
                </button>
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`flex flex-col items-center gap-0.5 transition ${
                    activeTab === 'telemetry' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px]">Telemetry</span>
                </button>
                <button
                  onClick={() => setActiveTab('machines')}
                  className={`flex flex-col items-center gap-0.5 transition ${
                    activeTab === 'machines' ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span className="text-[10px]">PLCs</span>
                </button>
              </div>
            </>
          )}

          {/* Android Home Bar Indicator */}
          <div className="h-4 bg-slate-900 flex items-center justify-center pb-1 shrink-0">
            <div className={`${orientation === 'landscape' ? 'w-40' : 'w-28'} h-1 bg-slate-600 rounded-full`}></div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs font-mono text-slate-400">
          Android 14 Jetpack Compose • {orientation === 'landscape' ? 'Rugged Tablet (Landscape Dual-Pane)' : 'Rugged Handheld (Portrait)'}
        </span>
      </div>
    </div>
  );
};
