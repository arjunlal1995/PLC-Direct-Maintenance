/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Download, 
  FolderArchive, 
  Cpu, 
  Cable, 
  Smartphone, 
  Code, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Gauge
} from 'lucide-react';
import { PlcAlert, Machine, NotificationSettings, SchneiderUsbConnectionConfig } from './types';
import { INITIAL_MACHINES, INITIAL_ALERTS } from './data/initialMachines';
import { audioAlerts } from './utils/audioAlerts';
import { downloadApkPackage, downloadFullProjectZip, downloadCompleteInstallerBundle } from './utils/apkGenerator';
import { AndroidSimulator } from './components/AndroidSimulator';
import { SchneiderHmiScreen } from './components/SchneiderHmiScreen';
import { SchneiderDriverHub } from './components/SchneiderDriverHub';
import { NotificationCenter } from './components/NotificationCenter';
import { CodebaseViewer } from './components/CodebaseViewer';
import { ApkBuildTerminal } from './components/ApkBuildTerminal';
import { MaintenanceChecklistModal } from './components/MaintenanceChecklistModal';
import { ConnectivityStatusBadge, ConnectivityState } from './components/ConnectivityStatusBadge';
import { TelemetryTrendChart } from './components/TelemetryTrendChart';
import { EmergencyHmiConsole } from './components/EmergencyHmiConsole';
import { AlarmResetCenter } from './components/AlarmResetCenter';
import { PlcLiveDataReader } from './components/PlcLiveDataReader';
import { DiagnosticLogTab } from './components/DiagnosticLogTab';
import { WiringSchematicTab } from './components/WiringSchematicTab';
import { PredictiveAnalyticsTab } from './components/PredictiveAnalyticsTab';
import { PackageInstallerModal } from './components/PackageInstallerModal';
import { NightShiftControl } from './components/NightShiftControl';
import { NightShiftProvider, useNightShift } from './context/NightShiftContext';
import { RotateCcw as RotateIcon, ShieldAlert as ShieldIcon, Database, TrendingUp, Wifi, Terminal } from 'lucide-react';

function MainAppContent() {
  const { isNightShift, palette, highContrast } = useNightShift();
  const [activeTab, setActiveTab] = useState<'hmi' | 'phone' | 'emergencyHmi' | 'readPlc' | 'diagnosticLog' | 'wiringSchematic' | 'predictive' | 'drivers' | 'notifications' | 'trend' | 'apk' | 'code'>('hmi');
  const [alerts, setAlerts] = useState<PlcAlert[]>(INITIAL_ALERTS);
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedChecklistAlert, setSelectedChecklistAlert] = useState<PlcAlert | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectivityState>('ONLINE');
  const [isAlarmResetOpen, setIsAlarmResetOpen] = useState(false);
  const [selectedAlarmForReset, setSelectedAlarmForReset] = useState<PlcAlert | null>(null);
  const [isPackageInstallerOpen, setIsPackageInstallerOpen] = useState(false);

  // Schneider USB & RJ-45 Connection State
  const [connectionConfig, setConnectionConfig] = useState<SchneiderUsbConnectionConfig>({
    connectionMode: 'USB_B_TO_TYPE_C',
    usbVendorId: 0x2122, // Schneider Electric
    usbProductId: 0x0241, // Modicon M241
    baudRate: 19200,
    parity: 'EVEN',
    dataBits: 8,
    stopBits: 1,
    plcIpAddress: '192.168.1.10',
    modbusPort: 502,
    slaveUnitId: 255,
    timeoutMs: 2000,
    connected: true,
    driverType: 'CDC-ACM (Native Modicon USB-B)'
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    volume: 0.8,
    vibrationEnabled: true,
    browserNotificationsEnabled: false,
    headsUpPopups: true,
    autoEscalateMinutes: 5,
    criticalChannelImportance: 'MAX',
    warningChannelImportance: 'HIGH',
    fcmPushMock: true,
  });

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioAlerts.setMuted(!next);
  };

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'ACKNOWLEDGED' as const,
              acknowledgedBy: 'Operator (Direct HMI / Notification)',
              acknowledgedAt: Date.now(),
            }
          : a
      )
    );
    audioAlerts.playAckBlip();
  };

  const handleDispatch = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'DISPATCHED' as const,
              dispatchedTo: 'Shift Electrician Alex',
              dispatchedAt: Date.now(),
            }
          : a
      )
    );
    audioAlerts.playAckBlip();
  };

  const handleSnooze = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'ACKNOWLEDGED' as const,
            }
          : a
      )
    );
  };

  const handleResolveFromChecklist = (alertId: string, notes: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'RESOLVED' as const,
              acknowledgedBy: `Alex Mercer (${notes || 'Routine SOP Procedure Completed'})`,
              acknowledgedAt: Date.now(),
              soundAlarm: false,
            }
          : a
      )
    );
  };

  const handleResetAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'RESOLVED' as const,
              acknowledgedBy: 'Safety Reset Executed (Latch Cleared)',
              acknowledgedAt: Date.now(),
              soundAlarm: false,
            }
          : a
      )
    );
    audioAlerts.playAckBlip();
  };

  const handleResetAllAlarms = () => {
    setAlerts((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'RESOLVED' as const,
        acknowledgedBy: 'Master Safety Reset All (Trip Cleared)',
        acknowledgedAt: Date.now(),
        soundAlarm: false,
      }))
    );
    audioAlerts.playAckBlip();
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.status === 'ACTIVE'
          ? {
              ...a,
              status: 'ACKNOWLEDGED' as const,
              acknowledgedBy: 'Bulk Acknowledge All Alarms',
              acknowledgedAt: Date.now(),
            }
          : a
      )
    );
    audioAlerts.playAckBlip();
  };

  const handleSilenceBuzzer = () => {
    setSoundEnabled(false);
    audioAlerts.setMuted(true);
  };

  const handleConnectionLost = () => {
    handleTriggerAlert(
      'CRITICAL',
      'HARDWARE LINK SEVERED (OFFLINE)',
      'PLC WebSocket & Modbus TCP connection dropped on USB-B / RJ-45 interface. Telemetry polling suspended.',
      '%SYS_COMM_OFFLINE'
    );
  };

  const handleTriggerAlert = (
    severity: PlcAlert['severity'],
    title: string,
    message: string,
    tag: string,
    machineId: string = 'SCHNEIDER-M580'
  ) => {
    const newAlert: PlcAlert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      machineId,
      machineName: 'Schneider Modicon M580 (USB-B / RJ-45)',
      location: 'Marine Engine Room - FWD Station',
      plcTag: tag,
      plcType: 'Schneider Modicon M580',
      severity,
      title,
      message,
      timestamp: Date.now(),
      status: 'ACTIVE',
      telemetry: {
        temperatureC: 65,
        pressureBar: 0.85,
        errorCode: severity === 'CRITICAL' ? '0x4010' : '0x2104'
      },
      soundAlarm: true
    };

    setAlerts((prev) => [newAlert, ...prev]);

    if (soundEnabled) {
      if (severity === 'CRITICAL') {
        audioAlerts.playCriticalSiren();
      } else if (severity === 'HIGH') {
        audioAlerts.playWarningBeep();
      } else {
        audioAlerts.playInfoChime();
      }
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Application Bar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black/95 border-red-900/60'
            : palette === 'AMBER'
            ? 'bg-black/95 border-amber-900/60'
            : 'bg-black/95 border-zinc-800'
          : 'bg-slate-950/90 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl p-0.5 flex items-center justify-center shadow-lg ${
              isNightShift
                ? palette === 'RED'
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 shadow-red-900/30'
                  : 'bg-gradient-to-tr from-amber-600 to-yellow-400 shadow-amber-900/30'
                : 'bg-gradient-to-tr from-amber-500 to-emerald-400 shadow-amber-500/20'
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black font-mono text-amber-400 text-sm">
                PLC
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-extrabold text-sm sm:text-base font-mono tracking-tight ${isNightShift ? 'text-zinc-100' : 'text-white'}`}>
                  PLC DIRECT MAINTENANCE
                </h1>
                <span className={`hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isNightShift
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  Android APK & Drivers
                </span>
              </div>
              <p className={`text-[11px] hidden md:block ${isNightShift ? 'text-zinc-400' : 'text-slate-400'}`}>
                Schneider Electric Harmony HMI • USB-B & RJ-45 to Type-C Drivers • Real-Time Alert Engine
              </p>
            </div>
          </div>

          {/* Quick Actions & Header Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Visual Hardware Link Connectivity Status Badge */}
            <ConnectivityStatusBadge
              status={connectionStatus}
              onToggleStatus={(newStatus) => {
                setConnectionStatus(newStatus);
                setConnectionConfig((prev) => ({
                  ...prev,
                  connected: newStatus === 'ONLINE',
                }));
              }}
              connectionMode={connectionConfig.connectionMode}
              plcIpAddress={connectionConfig.plcIpAddress}
              onConnectionLost={handleConnectionLost}
            />

            {/* High-Contrast Engine Room Night Shift Mode Toggle & Settings */}
            <NightShiftControl />

            {/* Alarm Acknowledge & Reset Options Button */}
            <button
              onClick={() => {
                setSelectedAlarmForReset(alerts.find((a) => a.status === 'ACTIVE') || alerts[0] || null);
                setIsAlarmResetOpen(true);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md ${
                activeAlertsCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Open Alarm Acknowledge & Trip Reset Options"
            >
              <RotateIcon className="w-3.5 h-3.5" />
              <span>Reset / Ack ({activeAlertsCount})</span>
              {activeAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              )}
            </button>

            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Alarm Siren: Active' : 'Alarm Siren: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => downloadApkPackage('android-14')}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              title="Download standalone compiled signed Android APK"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span> APK
            </button>

            <button
              onClick={() => downloadCompleteInstallerBundle()}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 hidden sm:flex"
              title="Download Complete Package Installer Bundle (.ZIP with APK + auto-run scripts + certs)"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Package Bundle (.ZIP)</span>
            </button>

            <button
              onClick={() => setIsPackageInstallerOpen(true)}
              className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-mono text-xs font-bold transition flex items-center gap-1.5"
              title="Open Android Package Installer, Sideloading & ADB Hub"
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Package</span> Installer
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto flex items-center gap-1">
          <button
            onClick={() => setActiveTab('hmi')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'hmi'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Schneider Harmony HMI UI</span>
          </button>

          <button
            onClick={() => setActiveTab('phone')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'phone'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android App Emulator</span>
            {activeAlertsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                criticalCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
              }`}>
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('emergencyHmi')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'emergencyHmi'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldIcon className="w-4 h-4 text-amber-400" />
            <span>Emergency Alt HMI & Modify PLC</span>
          </button>

          <button
            onClick={() => setActiveTab('readPlc')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'readPlc'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Read PLC (AI/AO/DI/DO)</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              I/O Hub
            </span>
          </button>

          <button
            onClick={() => setActiveTab('diagnosticLog')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'diagnosticLog'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Diagnostic Log</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
              Modbus TCP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wiringSchematic')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'wiringSchematic'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cable className="w-4 h-4 text-emerald-400" />
            <span>Wiring Schematic</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              M580 Guide
            </span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'drivers'
                ? isNightShift
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Network Scanner & Drivers</span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Auto-Scan
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'notifications'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Custom Notification Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'trend'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>24h Telemetry Trend</span>
          </button>

          <button
            onClick={() => setActiveTab('predictive')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'predictive'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="flex items-center gap-1.5">
              <span>Predictive Analytics</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/20 text-purple-300 font-black border border-purple-500/30">
                RUL
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>APK Build & CI/CD</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-2.5 text-xs font-mono font-semibold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'code'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Kotlin Source Code</span>
          </button>
        </div>
      </header>

      {/* Night Shift Low-Lux Safety Indicator Banner */}
      {isNightShift && (
        <div className={`px-4 py-1.5 text-center text-[11px] font-mono font-bold border-b flex items-center justify-center gap-2 select-none ${
          palette === 'RED'
            ? 'bg-red-950 text-red-300 border-red-500/60'
            : palette === 'AMBER'
            ? 'bg-amber-950 text-amber-300 border-amber-500/60'
            : 'bg-zinc-950 text-zinc-200 border-zinc-700'
        }`}>
          <span>🌙</span>
          <span>ENGINE ROOM NIGHT SHIFT ACTIVE [{palette} PHOSPHOR]</span>
          <span className="hidden sm:inline">· 100% BLUE-LIGHT ATTENUATED (&lt;500NM)</span>
          <span className="hidden md:inline">· HIGH-CONTRAST PALETTE (IMO SOLAS / ISO 8468 COMPLIANT)</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Schneider Harmony HMI Screen (Matches reference photos!) */}
        {activeTab === 'hmi' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  SCHNEIDER ELECTRIC HARMONY HMI & ZF MARINE STEERING
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time touchscreen interface adapted from reference hardware samples. Includes circular dial gauges, annunciator lamps, and alarm ticker.
                </p>
              </div>
            </div>

            <SchneiderHmiScreen
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onDispatch={handleDispatch}
              onTriggerAlert={handleTriggerAlert}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              connectionConfig={connectionConfig}
              onUpdateConfig={(cfg) => setConnectionConfig((prev) => ({ ...prev, ...cfg }))}
              onOpenChecklist={(alert) => setSelectedChecklistAlert(alert)}
              onViewTrend={() => setActiveTab('trend')}
              onOpenResetCenter={(alert) => {
                setSelectedAlarmForReset(alert || null);
                setIsAlarmResetOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 2: Android Phone Emulator */}
        {activeTab === 'phone' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  ANDROID APPLICATION EMULATOR
                </h2>
                <p className="text-xs text-slate-400">
                  Simulates the compiled Android APK on a rugged technician handheld. Test Heads-Up notifications, action buttons, and live telemetry.
                </p>
              </div>
            </div>

            <div className="flex justify-center py-4">
              <AndroidSimulator
                alerts={alerts}
                machines={machines}
                onAcknowledge={handleAcknowledge}
                onDispatch={handleDispatch}
                onSnooze={handleSnooze}
                onTriggerTestAlert={handleTriggerAlert}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onOpenChecklist={(alert) => setSelectedChecklistAlert(alert)}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Emergency Alternative HMI & Direct PLC Read/Write */}
        {activeTab === 'emergencyHmi' && (
          <EmergencyHmiConsole
            onTriggerAlert={(sev, title, msg, tag) => handleTriggerAlert(sev, title, msg, tag)}
          />
        )}

        {/* TAB 4: Live PLC Data Reader & Modbus Bus Monitor */}
        {activeTab === 'readPlc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  READ PLC DATA — MODBUS MEMORY REGISTER TABLE & SNIFFER
                </h2>
                <p className="text-xs text-slate-400">
                  Continuous live polling of Schneider Modicon M580/M340 memory (%MW holding registers, %M coils, %SW system words). Supports live force injection, filtering by scenario, and CSV export.
                </p>
              </div>
            </div>

            <PlcLiveDataReader
              onTriggerAlert={(sev, title, msg, tag) => handleTriggerAlert(sev, title, msg, tag)}
            />
          </div>
        )}

        {/* TAB: Modbus TCP Diagnostic Traffic Log & Intermittent Communication Debugger */}
        {activeTab === 'diagnosticLog' && (
          <DiagnosticLogTab
            onTriggerAlert={(sev, title, msg, tag) => handleTriggerAlert(sev, title, msg, tag)}
          />
        )}

        {/* TAB: Schneider M580 Wiring Schematic & Animated Step-by-Step Connection Guide */}
        {activeTab === 'wiringSchematic' && (
          <WiringSchematicTab />
        )}

        {/* TAB 5: Schneider Hardware Drivers & Automated Network Scanner */}
        {activeTab === 'drivers' && (
          <SchneiderDriverHub
            config={connectionConfig}
            onUpdateConfig={(cfg) => setConnectionConfig((prev) => ({ ...prev, ...cfg }))}
            onTriggerAlert={(title, msg, tag) => handleTriggerAlert('HIGH', title, msg, tag)}
            onConnectDeviceToHmi={(device) => {
              setConnectionConfig((prev) => ({
                ...prev,
                plcIpAddress: device.ip,
                modbusPort: device.driver.defaultPort,
                slaveUnitId: device.driver.defaultUnitId,
                connected: true,
              }));
              setConnectionStatus('ONLINE');
              setActiveTab('hmi');
            }}
          />
        )}

        {/* TAB 4: Notification Center */}
        {activeTab === 'notifications' && (
          <NotificationCenter
            settings={notificationSettings}
            onUpdateSettings={(cfg) => setNotificationSettings((prev) => ({ ...prev, ...cfg }))}
            onTriggerTestAlert={(sev, title, msg, tag) => handleTriggerAlert(sev, title, msg, tag)}
          />
        )}

        {/* TAB 5: 24h Telemetry Trend Analytics (Recharts Dual-Axis) */}
        {activeTab === 'trend' && (
          <TelemetryTrendChart
            onNavigateToPredictive={() => setActiveTab('predictive')}
            onOpenChecklistForTrend={() => {
              const seaWaterAlert = alerts.find((a) => a.plcTag.includes('100')) || alerts[0];
              setSelectedChecklistAlert(seaWaterAlert);
            }}
          />
        )}

        {/* TAB: Predictive Component Failure Analytics & RUL (Simulated Regression) */}
        {activeTab === 'predictive' && (
          <PredictiveAnalyticsTab
            onOpenChecklist={(code) => {
              const matchedAlert = alerts.find((a) => a.checklistId === code) || alerts[0];
              setSelectedChecklistAlert(matchedAlert);
            }}
            onTriggerAlert={(sev, title, msg, tag) => handleTriggerAlert(sev, title, msg, tag)}
          />
        )}

        {/* TAB 6: APK Build & CI/CD */}
        {activeTab === 'apk' && <ApkBuildTerminal />}

        {/* TAB 7: Kotlin Codebase Viewer */}
        {activeTab === 'code' && <CodebaseViewer />}
      </main>

      {/* Routine Maintenance Checklist Modal triggered from alert */}
      <MaintenanceChecklistModal
        alert={selectedChecklistAlert}
        isOpen={!!selectedChecklistAlert}
        onClose={() => setSelectedChecklistAlert(null)}
        onResolveAlert={handleResolveFromChecklist}
      />

      {/* Alarm Acknowledge and Trip Reset Options Modal */}
      <AlarmResetCenter
        alerts={alerts}
        selectedAlert={selectedAlarmForReset}
        isOpen={isAlarmResetOpen}
        onClose={() => setIsAlarmResetOpen(false)}
        onAcknowledge={handleAcknowledge}
        onAcknowledgeAll={handleAcknowledgeAll}
        onResetAlert={handleResetAlert}
        onMasterResetAll={handleResetAllAlarms}
        onSilenceBuzzer={handleSilenceBuzzer}
        soundEnabled={soundEnabled}
      />

      {/* Android Package Installer & Sideloading Hub Modal */}
      <PackageInstallerModal
        isOpen={isPackageInstallerOpen}
        onClose={() => setIsPackageInstallerOpen(false)}
      />

      {/* Footer */}
      <footer className={`border-t py-4 px-6 text-center text-xs font-mono transition-colors ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-950 text-red-400'
            : palette === 'AMBER'
            ? 'bg-black border-amber-950 text-amber-400'
            : 'bg-black border-zinc-900 text-zinc-400'
          : 'bg-slate-950 border-slate-900 text-slate-500'
      }`}>
        PLC Direct Maintenance • Schneider Electric Modicon & Magelis Harmony Drivers • Android Kotlin APK Engine • IMO SOLAS Low-Lux Night Watch
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <NightShiftProvider>
      <MainAppContent />
    </NightShiftProvider>
  );
}
