import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  RotateCcw, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Zap, 
  Power,
  Flame,
  CheckCheck
} from 'lucide-react';
import { PlcAlert } from '../types';
import { audioAlerts } from '../utils/audioAlerts';

interface AlarmResetCenterProps {
  alerts: PlcAlert[];
  selectedAlert: PlcAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onAcknowledgeAll: () => void;
  onResetAlert: (id: string, forceReset?: boolean) => void;
  onMasterResetAll: () => void;
  onSilenceBuzzer: () => void;
  soundEnabled: boolean;
}

export const AlarmResetCenter: React.FC<AlarmResetCenterProps> = ({
  alerts,
  selectedAlert,
  isOpen,
  onClose,
  onAcknowledge,
  onAcknowledgeAll,
  onResetAlert,
  onMasterResetAll,
  onSilenceBuzzer,
  soundEnabled,
}) => {
  if (!isOpen) return null;

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const acknowledgedAlerts = alerts.filter((a) => a.status === 'ACKNOWLEDGED');
  const targetAlert = selectedAlert || activeAlerts[0] || alerts[0];

  const [forceBypassChecked, setForceBypassChecked] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const handleResetTarget = () => {
    if (!targetAlert) return;
    onResetAlert(targetAlert.id, forceBypassChecked);
    setResetFeedback(`✓ Alarm ${targetAlert.id} reset and safety latch re-armed.`);
    setTimeout(() => {
      setResetFeedback(null);
      if (activeAlerts.length <= 1) onClose();
    }, 1400);
  };

  const handleMasterReset = () => {
    onMasterResetAll();
    setResetFeedback('✓ Master Safety Bus Reset: All diagnostic fault registers and safety relays cleared.');
    setTimeout(() => {
      setResetFeedback(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden font-mono text-xs select-none">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RotateCcw className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ALARM SUPERVISORY CONTROL
                </span>
                <span className="text-slate-400 text-[10px]">
                  Active Alarms: <strong className="text-red-400">{activeAlerts.length}</strong>
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                ALARM ACKNOWLEDGE & TRIP RESET OPTIONS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {resetFeedback && (
          <div className="px-5 py-2.5 bg-emerald-950/80 border-b border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resetFeedback}</span>
          </div>
        )}

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Target Alarm Summary Card */}
          {targetAlert && (
            <div className={`p-4 rounded-2xl border transition ${
              targetAlert.severity === 'CRITICAL'
                ? 'bg-red-950/30 border-red-500/60 ring-1 ring-red-500/30'
                : 'bg-amber-950/20 border-amber-500/50'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      targetAlert.severity === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {targetAlert.severity}
                    </span>
                    <span className="text-slate-400 text-[10px]">{targetAlert.id}</span>
                    <span className="text-amber-400 font-bold">{targetAlert.plcTag}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 font-sans">
                    {targetAlert.title}
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 font-sans leading-relaxed">
                    {targetAlert.message}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  targetAlert.status === 'ACTIVE' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {targetAlert.status}
                </span>
              </div>

              {/* Physical Sensor Status Check */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Node:</span>
                  <span className="text-white font-semibold">{targetAlert.machineName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Interlock State:</span>
                  <span className={targetAlert.status === 'ACTIVE' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {targetAlert.status === 'ACTIVE' ? 'LATCHED (Safety Open)' : 'ARMED / OK'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* OPTION 1: ACKNOWLEDGE (ACK) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    1. ACKNOWLEDGE ALARM (ACK)
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">F2 Key</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans leading-normal">
                  Silences audible siren and turns flashing beacons into steady illumination. Takes operator ownership while keeping fault tracked until repaired.
                </p>
              </div>

              <button
                onClick={() => {
                  if (targetAlert) onAcknowledge(targetAlert.id);
                }}
                disabled={!targetAlert || targetAlert.status === 'ACKNOWLEDGED'}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{targetAlert?.status === 'ACKNOWLEDGED' ? 'Already Acknowledged' : 'Acknowledge Alarm'}</span>
              </button>
            </div>

            {/* OPTION 2: RESET TRIP (RESET) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4" />
                    2. RESET SAFETY TRIP (RESET)
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">PLC Write</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans leading-normal">
                  Clears the latched PLC safety relay, resets Schneider diagnostic word %SW50 to 0x0000, and re-arms master contactors.
                </p>
              </div>

              <button
                onClick={handleResetTarget}
                disabled={!targetAlert}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Alarm & Clear Latch</span>
              </button>
            </div>

            {/* OPTION 3: SILENCE SIREN / BUZZER ONLY */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    3. SILENCE BUZZER ONLY
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">F1 Key</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans leading-normal">
                  Immediately mutes the audible horn siren without changing the alarm state or acknowledging responsibility.
                </p>
              </div>

              <button
                onClick={onSilenceBuzzer}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Siren Audio (Buzzer Off)</span>
              </button>
            </div>

            {/* OPTION 4: MASTER BULK RESET */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    4. MASTER PLANT FLOOR RESET
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">All Nodes</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans leading-normal">
                  Sends blue master reset command across all 5 PLC lines, clears all latches, and resets simulated sensor faults back to nominal.
                </p>
              </div>

              <button
                onClick={handleMasterReset}
                className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Master Trip Reset</span>
              </button>
            </div>
          </div>

          {/* Bulk Acknowledge Bar */}
          {activeAlerts.length > 1 && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                Multiple alarms active ({activeAlerts.length} alarms).
              </span>
              <button
                onClick={onAcknowledgeAll}
                className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Acknowledge All ({activeAlerts.length})</span>
              </button>
            </div>
          )}

          {/* Safety Interlock Note */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 font-sans leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>SAFETY INTERLOCK RULE:</strong> Resetting an alarm re-arms the master safety bus. If physical raw water pressure remains below 0.80 Bar or an E-Stop button remains mechanically latched, the PLC will immediately re-trip the alarm for personnel safety.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            PLC Supervisory Safety Standard ISO 13849-1 / IEC 61508
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
