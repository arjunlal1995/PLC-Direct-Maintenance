import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Cpu, 
  Wifi, 
  Cable, 
  Activity, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  Info, 
  Download, 
  ExternalLink, 
  Check, 
  X,
  Radio,
  Sliders,
  Send,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { useNightShift } from '../context/NightShiftContext';
import { downloadAndroid14ApkPackage } from '../utils/apkGenerator';

export type TopologyLinkState = 'GIGABIT_HEALTHY' | 'DEGRADED_100MB' | 'DISCONNECTED';

type SelectedTopologyElement = 
  | 'ANDROID_DEVICE' 
  | 'USB_LINK' 
  | 'ETHERNET_ADAPTER' 
  | 'CAT6_CABLE' 
  | 'M580_PLC' 
  | null;

interface NetworkTopologyMapProps {
  onConnectHmi?: () => void;
  m580Ip?: string;
}

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
  onConnectHmi,
  m580Ip = '192.168.1.10',
}) => {
  const { isNightShift, palette } = useNightShift();

  // Topology simulation states
  const [linkState, setLinkState] = useState<TopologyLinkState>('GIGABIT_HEALTHY');
  const [selectedElement, setSelectedElement] = useState<SelectedTopologyElement>('M580_PLC');
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingRtt, setPingRtt] = useState<number>(1.4);
  const [pingSuccess, setPingSuccess] = useState<boolean>(true);
  const [pingHistory, setPingHistory] = useState<number[]>([1.4, 1.2, 1.5, 1.3, 1.4]);
  const [txPacketCount, setTxPacketCount] = useState<number>(14820);
  const [rxPacketCount, setRxPacketCount] = useState<number>(14818);
  const [isApkDownloading, setIsApkDownloading] = useState<boolean>(false);
  const [apkDownloadSuccess, setApkDownloadSuccess] = useState<boolean>(false);

  // Live packet count increments when link is connected
  useEffect(() => {
    if (linkState === 'DISCONNECTED') return;

    const interval = setInterval(() => {
      const increment = Math.floor(2 + Math.random() * 4);
      setTxPacketCount((prev) => prev + increment);
      setRxPacketCount((prev) => prev + increment);
    }, 1000);

    return () => clearInterval(interval);
  }, [linkState]);

  // Ping test execution
  const handleTriggerPing = () => {
    setIsPinging(true);
    setPingSuccess(linkState !== 'DISCONNECTED');

    setTimeout(() => {
      setIsPinging(false);
      if (linkState === 'GIGABIT_HEALTHY') {
        const newRtt = +(1.1 + Math.random() * 0.5).toFixed(1);
        setPingRtt(newRtt);
        setPingHistory((prev) => [...prev.slice(-5), newRtt]);
      } else if (linkState === 'DEGRADED_100MB') {
        const newRtt = +(11.5 + Math.random() * 4.2).toFixed(1);
        setPingRtt(newRtt);
        setPingHistory((prev) => [...prev.slice(-5), newRtt]);
      } else {
        setPingRtt(0);
      }
    }, 600);
  };

  // 1-Click APK Download
  const handleDownloadAndroid14Apk = async () => {
    try {
      setIsApkDownloading(true);
      await downloadAndroid14ApkPackage();
      setIsApkDownloading(false);
      setApkDownloadSuccess(true);
      setTimeout(() => setApkDownloadSuccess(false), 3500);
    } catch (e) {
      console.error(e);
      setIsApkDownloading(false);
    }
  };

  // Color variables for night shift
  const containerBg = isNightShift ? 'bg-black' : 'bg-slate-900';
  const cardBorder = isNightShift
    ? palette === 'RED'
      ? 'border-red-900/60'
      : palette === 'AMBER'
      ? 'border-amber-900/60'
      : 'border-zinc-800'
    : 'border-slate-800';

  const accentColor = isNightShift
    ? palette === 'RED'
      ? 'text-red-400'
      : palette === 'AMBER'
      ? 'text-amber-400'
      : 'text-zinc-200'
    : 'text-emerald-400';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-2xl space-y-5 transition-colors font-mono ${containerBg} ${cardBorder}`}>
      
      {/* Topology Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl border ${
              isNightShift
                ? palette === 'RED'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-extrabold tracking-tight ${accentColor}`}>
                  PHYSICAL CONNECTION TOPOLOGY: ANDROID $\rightarrow$ ADAPTER $\rightarrow$ M580
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-950 border border-slate-700 text-slate-300">
                  INTERACTIVE BACKBONE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time physical layer diagram from technician tablet (Android 14+) through USB-C Gigabit NIC to Schneider Modicon M580 Service Port.
              </p>
            </div>
          </div>
        </div>

        {/* Link Simulation State Buttons & Action Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Link State Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setLinkState('GIGABIT_HEALTHY')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                linkState === 'GIGABIT_HEALTHY'
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1000M Full</span>
            </button>

            <button
              onClick={() => setLinkState('DEGRADED_100MB')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                linkState === 'DEGRADED_100MB'
                  ? 'bg-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Simulates 100Mbps fallback due to noisy cable"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>100M Fallback</span>
            </button>

            <button
              onClick={() => setLinkState('DISCONNECTED')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                linkState === 'DISCONNECTED'
                  ? 'bg-red-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Simulates unplugged cable"
            >
              <X className="w-3.5 h-3.5" />
              <span>Unplugged</span>
            </button>
          </div>

          {/* Diagnostic Ping Probe Button */}
          <button
            onClick={handleTriggerPing}
            disabled={isPinging}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Send ICMP/Modbus probe through connection chain"
          >
            <Radio className={`w-3.5 h-3.5 text-sky-400 ${isPinging ? 'animate-ping' : ''}`} />
            <span>{isPinging ? 'Probing...' : 'Probe RTT'}</span>
          </button>

          {/* Download Android 14+ APK Button */}
          <button
            onClick={handleDownloadAndroid14Apk}
            disabled={isApkDownloading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              apkDownloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
            title="Download compiled Android 14+ APK binary"
          >
            {apkDownloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{apkDownloadSuccess ? 'APK Downloaded!' : isApkDownloading ? 'Building...' : 'Download APK (Android 14+)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Topology Diagram Visual Canvas */}
      <div className="relative rounded-2xl bg-black border-2 border-slate-800 p-4 sm:p-6 overflow-hidden select-none">
        {/* Subtle Engineering Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        {/* Top Status Indicators inside Canvas */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs mb-6">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              linkState === 'GIGABIT_HEALTHY'
                ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse'
                : linkState === 'DEGRADED_100MB'
                ? 'bg-amber-400 shadow-md shadow-amber-400'
                : 'bg-red-500 animate-ping'
            }`} />
            <span className="font-bold text-white">
              {linkState === 'GIGABIT_HEALTHY' 
                ? '1000BASE-T GIGABIT LINK ACTIVE (HEALTHY)' 
                : linkState === 'DEGRADED_100MB' 
                ? '100BASE-TX LINK SPEED DOWNGRADED' 
                : 'PHYSICAL LINK SEVERED (DISCONNECTED)'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Ping RTT: <strong className={linkState === 'DISCONNECTED' ? 'text-red-400' : 'text-emerald-400'}>{linkState === 'DISCONNECTED' ? 'TIMEOUT' : `${pingRtt} ms`}</strong></span>
            <span>•</span>
            <span>Tx: <strong className="text-white">{txPacketCount.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Rx: <strong className="text-white">{rxPacketCount.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* 3-Node Physical Chain Layout */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 py-4 sm:py-6">
          
          {/* ================= NODE 1: ANDROID HANDHELD (API 34+) ================= */}
          <div 
            onClick={() => setSelectedElement('ANDROID_DEVICE')}
            className={`w-full lg:w-72 p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xl ${
              selectedElement === 'ANDROID_DEVICE'
                ? 'bg-slate-900/90 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-xs">Technician Handheld</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Android 14+ (API 34)
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">IP Address:</span>
                <span className="text-emerald-400 font-bold">192.168.1.50 /24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Interface:</span>
                <span className="text-white font-mono">eth0 (USB OTG)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware MAC:</span>
                <span className="text-slate-400 font-mono text-[11px]">7C:D1:C3:88:2E:14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OS Target:</span>
                <span className="text-amber-400 font-semibold">Upside Down Cake</span>
              </div>
            </div>

            {/* Bottom port connector badge */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Port: USB-C (OTG Host)</span>
              <span className="text-emerald-400 font-bold">5V DC VBUS</span>
            </div>
          </div>

          {/* ================= LINK 1: TYPE-C BUS ================= */}
          <div 
            onClick={() => setSelectedElement('USB_LINK')}
            className={`flex-1 w-full flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition ${
              selectedElement === 'USB_LINK' ? 'bg-slate-900/60 ring-1 ring-amber-500/50' : 'hover:bg-slate-950/60'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>USB 3.2 Gen 1 (5 Gbps)</span>
            </span>

            {/* Cable visual line with data particles */}
            <div className="w-full h-3 bg-slate-800 rounded-full border border-slate-700 relative overflow-hidden">
              {linkState !== 'DISCONNECTED' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-shimmer" />
              )}
            </div>

            <span className="text-[9px] text-slate-500 mt-1">Reversible Type-C Connector</span>
          </div>

          {/* ================= NODE 2: USB-TO-ETHERNET ADAPTER ================= */}
          <div 
            onClick={() => setSelectedElement('ETHERNET_ADAPTER')}
            className={`w-full lg:w-72 p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xl ${
              selectedElement === 'ETHERNET_ADAPTER'
                ? 'bg-slate-900/90 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cable className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-xs">USB-to-Ethernet Adapter</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Realtek RTL8153
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">USB VID:PID:</span>
                <span className="text-white font-mono font-bold">0x0BDA : 0x8153</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Negotiated PHY:</span>
                <span className={`font-bold ${
                  linkState === 'GIGABIT_HEALTHY' 
                    ? 'text-emerald-400' 
                    : linkState === 'DEGRADED_100MB' 
                    ? 'text-amber-400' 
                    : 'text-red-400'
                }`}>
                  {linkState === 'GIGABIT_HEALTHY' ? '1000M Full-Duplex' : linkState === 'DEGRADED_100MB' ? '100M Full-Duplex' : 'NO PHY LINK'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver Kernel:</span>
                <span className="text-slate-300 font-mono text-[11px]">cdc_ether / r8152</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auto-MDIX:</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>

            {/* Adapter LEDs */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${linkState !== 'DISCONNECTED' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`} />
                <span className="text-slate-400 font-bold">LINK (Green)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${linkState !== 'DISCONNECTED' ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                <span className="text-slate-400 font-bold">ACT (Amber)</span>
              </div>
            </div>
          </div>

          {/* ================= LINK 2: CAT6A SHIELDED CABLE ================= */}
          <div 
            onClick={() => setSelectedElement('CAT6_CABLE')}
            className={`flex-1 w-full flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition ${
              selectedElement === 'CAT6_CABLE' ? 'bg-slate-900/60 ring-1 ring-blue-500/50' : 'hover:bg-slate-950/60'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-blue-400" />
              <span>CAT6A S/FTP (T568B)</span>
            </span>

            {/* Cable visual line with data particles */}
            <div className={`w-full h-3 rounded-full border relative overflow-hidden ${
              linkState === 'DISCONNECTED' 
                ? 'bg-red-950/40 border-red-500/80 border-dashed' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              {linkState !== 'DISCONNECTED' ? (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" />
              ) : (
                <div className="flex items-center justify-center h-full text-[8px] text-red-400 font-black">
                  BROKEN
                </div>
              )}
            </div>

            <span className="text-[9px] text-slate-500 mt-1">
              {linkState === 'DISCONNECTED' ? 'Cable Unplugged' : '100m Shielded Patch Cord'}
            </span>
          </div>

          {/* ================= NODE 3: SCHNEIDER MODICON M580 PLC ================= */}
          <div 
            onClick={() => setSelectedElement('M580_PLC')}
            className={`w-full lg:w-72 p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xl ${
              selectedElement === 'M580_PLC'
                ? 'bg-slate-900/90 border-blue-400 ring-2 ring-blue-500/30'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white text-xs">Modicon M580 ePAC</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                BMEP582040
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">PLC IP Address:</span>
                <span className="text-blue-400 font-bold">{m580Ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Port:</span>
                <span className="text-white font-mono font-bold">502 (Modbus TCP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware MAC:</span>
                <span className="text-slate-400 font-mono text-[11px]">00:80:F4:3D:11:8A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rack / Backplane:</span>
                <span className="text-emerald-400 font-semibold">BMXXBP0800</span>
              </div>
            </div>

            {/* M580 Status LEDs */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">RUN</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
                <span className="text-slate-400">ERR</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${linkState !== 'DISCONNECTED' ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                <span className="text-slate-400">ETH ACT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Hint inside Canvas */}
        <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Click any node or cable in the diagram to inspect physical layer details & pinouts.</span>
          <span className="text-emerald-400 font-bold">Modicon M580 Service Port Loopback: Healthy</span>
        </div>
      </div>

      {/* Selected Element Detailed Inspector Drawer */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">
              {selectedElement === 'ANDROID_DEVICE' && 'Physical Node Inspector: Android Technician Handheld (Android 14+)'}
              {selectedElement === 'USB_LINK' && 'Link Inspector: USB 3.2 Gen 1 SuperSpeed Bus (Type-C)'}
              {selectedElement === 'ETHERNET_ADAPTER' && 'Hardware Inspector: USB-C to Gigabit Ethernet Adapter (Realtek RTL8153)'}
              {selectedElement === 'CAT6_CABLE' && 'Cable Inspector: Industrial S/FTP CAT6A Patch Cord (T568B)'}
              {selectedElement === 'M580_PLC' && 'PLC Target Inspector: Schneider Electric Modicon M580 (BMEP582040)'}
            </h4>
          </div>

          {onConnectHmi && (
            <button
              onClick={onConnectHmi}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition flex items-center gap-1 shadow-md shadow-emerald-950/40"
            >
              <span>Connect HMI to this Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content based on selected element */}
        {selectedElement === 'ANDROID_DEVICE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Operating System</span>
              <span className="font-bold text-white text-sm">Android 14 (API 34)</span>
              <p className="text-[11px] text-slate-400">Targeting UpsideDownCake and Android 15. Supports strict foreground service connected-device permissions.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Host USB Subsystem</span>
              <span className="font-bold text-emerald-400 text-sm">USB OTG Host Mode</span>
              <p className="text-[11px] text-slate-400">Automatically discovers attached USB network adapters using Android USB device_filter.xml intent filters.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">TCP/IP Network Stack</span>
              <span className="font-bold text-amber-400 text-sm">Static Subnet (192.168.1.50)</span>
              <p className="text-[11px] text-slate-400">Direct zero-hop routing to M580 PLC. Bypasses corporate proxy and AP isolation.</p>
            </div>
          </div>
        )}

        {selectedElement === 'USB_LINK' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Signaling Speed</span>
              <span className="font-bold text-white text-sm">5.0 Gbps (USB SuperSpeed)</span>
              <p className="text-[11px] text-slate-400">8b/10b line encoding with dual differential RX/TX pairs (SSTX+/SSTX- and SSRX+/SSRX-).</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Power Negotiation</span>
              <span className="font-bold text-emerald-400 text-sm">5.0V @ 900 mA (Type-C)</span>
              <p className="text-[11px] text-slate-400">Host powers the Ethernet PHY controller directly from technician phone battery.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">EMI Mitigation</span>
              <span className="font-bold text-amber-400 text-sm">Braided Ground Shell</span>
              <p className="text-[11px] text-slate-400">Continuous 360° ground shell prevents high-frequency inverter noise from resetting USB bus.</p>
            </div>
          </div>
        )}

        {selectedElement === 'ETHERNET_ADAPTER' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Chipset & Architecture</span>
              <span className="font-bold text-white text-sm">Realtek RTL8153-VB-CG</span>
              <p className="text-[11px] text-slate-400">Integrated 10/100/1000M Ethernet transceiver with USB 3.0 controller and hardware checksum offload.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Driver Binding</span>
              <span className="font-bold text-emerald-400 text-sm">Linux / Android cdc_ether</span>
              <p className="text-[11px] text-slate-400">Natively supported out-of-the-box on Android 14 without requiring root permissions.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Ethernet Magnetics</span>
              <span className="font-bold text-amber-400 text-sm">1500V Isolation Transformer</span>
              <p className="text-[11px] text-slate-400">Protects Android tablet against ground potential differences between machinery consoles.</p>
            </div>
          </div>
        )}

        {selectedElement === 'CAT6_CABLE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Pinout Standard</span>
              <span className="font-bold text-white text-sm">EIA/TIA T568B</span>
              <p className="text-[11px] text-slate-400">Pin 1: Orange/White, Pin 2: Orange, Pin 3: Green/White, Pin 6: Green.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Cable Shielding</span>
              <span className="font-bold text-emerald-400 text-sm">S/FTP Screened Foiled Pair</span>
              <p className="text-[11px] text-slate-400">Essential in marine engine rooms to shield Modbus TCP packets from high-power VFD harmonic induction.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Maximum Run Length</span>
              <span className="font-bold text-blue-400 text-sm">100 meters (328 ft)</span>
              <p className="text-[11px] text-slate-400">Compliant with IEEE 802.3ab 1000BASE-T link budgets.</p>
            </div>
          </div>
        )}

        {selectedElement === 'M580_PLC' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">PLC Controller Family</span>
              <span className="font-bold text-white text-sm">Modicon M580 (BMEP582040)</span>
              <p className="text-[11px] text-slate-400">Dual Core ePAC CPU with native Ethernet embedded into the rack backplane.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Diagnostic Port</span>
              <span className="font-bold text-emerald-400 text-sm">Front SERVICE Port (RJ-45)</span>
              <p className="text-[11px] text-slate-400">Dedicated port for technician programming, separate from the redundant RSTP device network ring.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Protocol Compatibility</span>
              <span className="font-bold text-blue-400 text-sm">Modbus TCP (Port 502)</span>
              <p className="text-[11px] text-slate-400">Continuous telemetry querying of %MW holding registers and %M coils with determinism.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
