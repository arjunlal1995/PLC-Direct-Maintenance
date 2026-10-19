import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Radio, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  Cable, 
  Activity, 
  Zap, 
  Layers 
} from 'lucide-react';
import { audioAlerts } from '../utils/audioAlerts';

export type ConnectivityState = 'ONLINE' | 'CONNECTING' | 'OFFLINE';

interface ConnectivityStatusBadgeProps {
  status: ConnectivityState;
  onToggleStatus: (newStatus: ConnectivityState) => void;
  connectionMode: 'USB_B_TO_TYPE_C' | 'RJ45_TO_TYPE_C';
  plcIpAddress: string;
  onConnectionLost?: () => void;
}

export const ConnectivityStatusBadge: React.FC<ConnectivityStatusBadgeProps> = ({
  status,
  onToggleStatus,
  connectionMode,
  plcIpAddress,
  onConnectionLost,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState(14);
  const [packetCount, setPacketCount] = useState(18420);
  const [lastHeartbeat, setLastHeartbeat] = useState('Just now');

  // Live fluctuating latency and packet stream when online
  useEffect(() => {
    if (status !== 'ONLINE') return;

    const interval = setInterval(() => {
      setLatencyMs(Math.floor(11 + Math.random() * 15));
      setPacketCount((p) => p + Math.floor(1 + Math.random() * 4));
      setLastHeartbeat(`${Math.floor(Math.random() * 2)}s ago`);
    }, 1800);

    return () => clearInterval(interval);
  }, [status]);

  const handleSimulateToggle = () => {
    if (status === 'ONLINE') {
      onToggleStatus('OFFLINE');
      audioAlerts.playWarningBeep();
      if (onConnectionLost) onConnectionLost();
    } else {
      onToggleStatus('CONNECTING');
      setTimeout(() => {
        onToggleStatus('ONLINE');
        audioAlerts.playAckBlip();
      }, 1200);
    }
  };

  return (
    <div className="relative select-none font-mono">
      {/* Visual Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-300 shadow-md ${
          status === 'ONLINE'
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 ring-1 ring-emerald-500/20 shadow-emerald-950/30'
            : status === 'CONNECTING'
            ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/50 animate-pulse'
            : 'bg-red-950/90 border-red-500/80 text-red-200 hover:bg-red-900/80 ring-2 ring-red-500/50 shadow-red-950/60 animate-siren'
        }`}
        title="Hardware Link Status • Click for details and simulate drop"
      >
        {/* Pulsing Status Dot / Icon */}
        <div className="relative flex items-center justify-center">
          {status === 'ONLINE' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping"></span>
            </>
          ) : status === 'CONNECTING' ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <WifiOff className="w-3.5 h-3.5 text-red-400 ml-1" />
            </>
          )}
        </div>

        {/* Status Text & Health Indicator */}
        <div className="flex items-center gap-1.5 text-left leading-tight">
          <span className="font-bold tracking-tight text-[11px] sm:text-xs">
            {status === 'ONLINE' ? 'PLC LINK: ONLINE' : status === 'CONNECTING' ? 'CONNECTING...' : 'PLC LINK: OFFLINE'}
          </span>
          {status === 'ONLINE' && (
            <span className="text-[10px] text-emerald-400/90 hidden sm:inline">
              ({latencyMs}ms)
            </span>
          )}
        </div>

        {isOpen ? <ChevronUp className="w-3 h-3 opacity-70" /> : <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {/* Dropdown Quick Health Check Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-xl border-2 border-slate-700 rounded-2xl p-4 shadow-2xl text-xs space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-[11px]">HARDWARE LINK HEALTH CHECK</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status === 'ONLINE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : status === 'CONNECTING'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-red-500/20 text-red-300 border border-red-500/50'
              }`}
            >
              {status}
            </span>
          </div>

          {/* Connection Specs */}
          <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Driver Type:</span>
              <span className="text-white font-semibold">
                {connectionMode === 'USB_B_TO_TYPE_C' ? 'Schneider USB-B (CDC-ACM 19200)' : 'RJ-45 Modbus TCP (Port 502)'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Target Node:</span>
              <span className="text-amber-400 font-semibold">
                {connectionMode === 'USB_B_TO_TYPE_C' ? 'USB /dev/bus/usb/001/002' : `${plcIpAddress}:502`}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Telemetry Stream:</span>
              <span className={status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}>
                {status === 'ONLINE' ? 'WebSocket Active (10Hz)' : 'Socket Closed (Broken)'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Round-Trip Latency:</span>
              <span className="text-white">{status === 'ONLINE' ? `${latencyMs} ms` : 'N/A (Timeout)'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Packets Processed:</span>
              <span className="text-slate-300">{packetCount.toLocaleString()} pkts</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Heartbeat:</span>
              <span className="text-slate-300">{status === 'ONLINE' ? lastHeartbeat : 'Expired'}</span>
            </div>
          </div>

          {/* Quick Toggle Action to simulate disconnect */}
          <div>
            <button
              onClick={handleSimulateToggle}
              className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                status === 'ONLINE'
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {status === 'ONLINE' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Simulate Connection Drop (Go Offline)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reconnect Hardware Link</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5 font-sans">
              Tests how the app alert engine and notification channels react to hardware link failure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
