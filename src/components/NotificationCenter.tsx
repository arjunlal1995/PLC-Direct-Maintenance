import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Smartphone, 
  ShieldAlert, 
  Clock, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { NotificationSettings, PlcAlert } from '../types';
import { audioAlerts } from '../utils/audioAlerts';

interface NotificationCenterProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onTriggerTestAlert: (severity: PlcAlert['severity'], title: string, message: string, tag: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  settings,
  onUpdateSettings,
  onTriggerTestAlert,
}) => {
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    if (permission === 'granted') {
      onUpdateSettings({ browserNotificationsEnabled: true });
      new Notification('🚨 PLC Direct Maintenance Alerts Enabled', {
        body: 'Real-time notifications active for Schneider Modicon and industrial plant floor alarms.',
        icon: '/favicon.ico'
      });
    }
  };

  const testSystemNotification = (severity: PlcAlert['severity']) => {
    const title = severity === 'CRITICAL' 
      ? '🚨 [CRITICAL] EM-STOP ACTIVE (BRIDGE)'
      : '⚠️ [HIGH] Sea Water Pressure Moderate Low';
    const body = severity === 'CRITICAL'
      ? 'Modicon M580 E-Stop loop opened via USB-B port. Immediate technician intervention needed.'
      : 'Pressure dropped to 0.42 Bar on cooling water loop. Setpoint 0.80 Bar.';

    // Web Audio Sound
    if (severity === 'CRITICAL') {
      audioAlerts.playCriticalSiren();
    } else {
      audioAlerts.playWarningBeep();
    }

    // Trigger in app
    onTriggerTestAlert(severity, title, body, severity === 'CRITICAL' ? '%M1_ESTOP' : '%MW100_PRESS');

    // Real Native Browser Notification (if granted)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag: 'plc-alert',
          requireInteraction: severity === 'CRITICAL',
        });
      } catch (e) {
        // Fallback
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Native Browser / Android Notification Permission */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                REAL-TIME NOTIFICATION ENGINE CONFIGURATION
              </h2>
              <p className="text-xs text-slate-400">
                Configures Android NotificationChannels, custom vibration cadences, siren sirens, and heads-up popups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {browserPermission === 'granted' ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              OS Notifications Enabled
            </span>
          ) : (
            <button
              onClick={requestBrowserPermission}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Bell className="w-4 h-4" />
              Enable Device Push Notifications
            </button>
          )}
        </div>
      </div>

      {/* Notification Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Channel 1: Critical Alarms */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-red-500/40 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono text-red-400 font-bold uppercase">
                Channel ID: channel_plc_critical_alerts
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5">PLC Critical Alarms (Siren)</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
              MAX PRIORITY
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5 font-mono text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Heads-Up Banner:</span>
              <span className="text-emerald-400 font-bold">ENABLED (Lockscreen)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vibration Cadence:</span>
              <span className="text-white">0, 400, 200, 400, 200, 800</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">LED Light Ring:</span>
              <span className="text-red-400 font-bold">Pulsing RED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bypass Do Not Disturb:</span>
              <span className="text-amber-400 font-bold">TRUE (Safety Alarms)</span>
            </div>
          </div>

          <button
            onClick={() => testSystemNotification('CRITICAL')}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
          >
            <AlertOctagon className="w-4 h-4" />
            Test Critical Siren Alert
          </button>
        </div>

        {/* Channel 2: High Warnings */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-amber-500/40 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                Channel ID: channel_plc_warning_alerts
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5">PLC High Warnings</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
              HIGH PRIORITY
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5 font-mono text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Heads-Up Banner:</span>
              <span className="text-emerald-400 font-bold">ENABLED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vibration Cadence:</span>
              <span className="text-white">0, 250, 250, 250</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">LED Light Ring:</span>
              <span className="text-amber-400 font-bold">Pulsing AMBER</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auto-Escalate:</span>
              <span className="text-slate-300">After 5 mins if unack</span>
            </div>
          </div>

          <button
            onClick={() => testSystemNotification('HIGH')}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30"
          >
            <AlertTriangle className="w-4 h-4" />
            Test High Warning Alert
          </button>
        </div>

        {/* Channel 3: Foreground Telemetry Service */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                Channel ID: channel_plc_service_status
              </div>
              <h3 className="font-bold text-sm text-white mt-0.5">Background PLC Watcher</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              FOREGROUND
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5 font-mono text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Service Type:</span>
              <span className="text-white font-bold">dataSync (Android 14)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hardware Links:</span>
              <span className="text-emerald-400 font-bold">USB-B & RJ-45 Poller</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device Sleep Behavior:</span>
              <span className="text-white">WAKE_LOCK on Alarms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sticky Status:</span>
              <span className="text-slate-300">START_STICKY</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 text-slate-400 text-[11px] font-mono text-center border border-slate-800">
            Prevents Android OS from killing real-time Modicon sockets when phone is locked.
          </div>
        </div>
      </div>

      {/* Real-Time Escalation Matrix */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono">
            AUTOMATED REAL-TIME ALERT ESCALATION MATRIX
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-amber-400 font-bold">STAGE 1: T+0 SECONDS</div>
            <div className="text-white font-semibold">Technician Heads-Up Alert</div>
            <p className="text-slate-400 text-[11px]">
              Vibrates Android phone with siren, presents Heads-Up notification banner with [Acknowledge] and [Dispatch Tech] buttons.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-amber-400 font-bold">STAGE 2: T+60 SECONDS</div>
            <div className="text-white font-semibold">Maintenance Lead Pager</div>
            <p className="text-slate-400 text-[11px]">
              If unacknowledged after 60s, escalates to shift supervisors and maintenance leads with high-priority push broadcast.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-red-400 font-bold">STAGE 3: T+180 SECONDS</div>
            <div className="text-white font-semibold">Plant Floor Siren / Line Interlock</div>
            <p className="text-slate-400 text-[11px]">
              Unacknowledged critical E-Stops trigger audible plant floor strobe and inhibit automatic upstream feed conveyors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
