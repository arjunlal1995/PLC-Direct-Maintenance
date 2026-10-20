import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Search, 
  Download, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink, 
  Server, 
  HardDrive, 
  FileCode, 
  Layers, 
  Radio, 
  Gauge, 
  ShieldCheck, 
  Activity,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  FolderArchive,
  Bluetooth,
  Signal,
  X
} from 'lucide-react';
import { NetworkDevice, DeviceCategory } from '../types/networkScanner';
import { 
  INITIAL_NETWORK_DEVICES, 
  NEARBY_WIRELESS_PLCS,
  MDNS_SCHNEIDER_DEVICES,
  HEARTBEAT_SCHNEIDER_DEVICES,
  downloadDeviceDriverPackage, 
  downloadAllDriversMasterBundle 
} from '../utils/driverPackageGenerator';
import { useNightShift } from '../context/NightShiftContext';
import { NetworkTopologyMap } from './NetworkTopologyMap';
import { AndroidSecurityCertModal } from './AndroidSecurityCertModal';

interface NetworkScannerHubProps {
  onConnectDeviceToHmi?: (device: NetworkDevice) => void;
  currentConnectedIp?: string;
}

export const NetworkScannerHub: React.FC<NetworkScannerHubProps> = ({
  onConnectDeviceToHmi,
  currentConnectedIp = '192.168.1.10',
}) => {
  const { isNightShift, palette } = useNightShift();

  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_NETWORK_DEVICES);
  const [activeView, setActiveView] = useState<'TOPOLOGY' | 'DEVICES'>('TOPOLOGY');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [isScanningNearby, setIsScanningNearby] = useState(false);
  const [isScanningMdns, setIsScanningMdns] = useState(false);
  const [isListeningHeartbeat, setIsListeningHeartbeat] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | 'MDNS_ZEROCONF' | 'UDP_BROADCAST_HEARTBEAT' | 'WIRED_ETHERNET' | 'WIRELESS'>('ALL');
  const [selectedPayloadDevice, setSelectedPayloadDevice] = useState<NetworkDevice | null>(null);
  const [selectedSubnet, setSelectedSubnet] = useState('192.168.1.0/24');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DeviceCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [isContinuousPolling, setIsContinuousPolling] = useState(false);
  const [isMasterDownloading, setIsMasterDownloading] = useState(false);
  const [connectionSuccessNotice, setConnectionSuccessNotice] = useState<string | null>(null);
  const [isSecurityCertModalOpen, setIsSecurityCertModalOpen] = useState(false);

  // Trigger simulated mDNS ZeroConf Discovery (_schneider-epac._udp / _modbus._tcp)
  const handleScanMdns = () => {
    setIsScanningMdns(true);
    setTimeout(() => {
      setIsScanningMdns(false);
      setDevices((prev) => {
        const existingIds = new Set(prev.map(d => d.id));
        const newItems = MDNS_SCHNEIDER_DEVICES.filter(d => !existingIds.has(d.id));
        return [...newItems, ...prev];
      });
      setConnectionSuccessNotice('mDNS ZeroConf: Resolved Schneider M580 ePAC & M340 services (_schneider-epac._udp & _modbus._tcp)');
      setTimeout(() => setConnectionSuccessNotice(null), 5000);
    }, 1000);
  };

  // Trigger simulated UDP Broadcast Heartbeat Listener (Port 1740 UMAS & Port 2222 EtherNet/IP)
  const handleListenHeartbeat = () => {
    setIsListeningHeartbeat(true);
    setTimeout(() => {
      setIsListeningHeartbeat(false);
      setDevices((prev) => {
        const existingIds = new Set(prev.map(d => d.id));
        const newItems = HEARTBEAT_SCHNEIDER_DEVICES.filter(d => !existingIds.has(d.id));
        return [...newItems, ...prev];
      });
      setConnectionSuccessNotice('UDP Broadcast Heartbeat: Captured active UMAS beacon pulses on Port 1740 (M580 Hot-Standby Primary & SIL3 Safety)');
      setTimeout(() => setConnectionSuccessNotice(null), 5000);
    }, 1000);
  };

  // Trigger simulated Bluetooth & Wi-Fi Direct Nearby PLC Discovery
  const handleScanNearbyPlcs = () => {
    setIsScanningNearby(true);
    setTimeout(() => {
      setIsScanningNearby(false);
      setDevices((prev) => {
        // Merge without duplicate IDs
        const existingIds = new Set(prev.map(d => d.id));
        const newItems = NEARBY_WIRELESS_PLCS.filter(d => !existingIds.has(d.id));
        return [...newItems, ...prev];
      });
      setConnectionSuccessNotice('Discovered 3 Nearby PLCs via Bluetooth LE 5.3 & Wi-Fi Direct (M580 detected at -52 dBm)');
      setTimeout(() => setConnectionSuccessNotice(null), 5000);
    }, 1200);
  };

  // Trigger simulated network scan
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDevices([]);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        setScanProgress(100);
        setIsScanning(false);
        setDevices(INITIAL_NETWORK_DEVICES);
        clearInterval(interval);
      } else {
        setScanProgress(current);
        const count = Math.ceil((current / 100) * INITIAL_NETWORK_DEVICES.length);
        setDevices(INITIAL_NETWORK_DEVICES.slice(0, count));
      }
    }, 180);
  };

  // Continuous background polling simulation
  useEffect(() => {
    if (!isContinuousPolling) return;
    const pollInterval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          rttMs: Math.max(0.8, +(d.rttMs + (Math.random() * 0.6 - 0.3)).toFixed(1)),
          lastSeen: Date.now(),
        }))
      );
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [isContinuousPolling]);

  // Handle single device driver download
  const handleDownloadDriver = async (device: NetworkDevice) => {
    try {
      setDownloadingId(device.id);
      await downloadDeviceDriverPackage(device);
      setDownloadingId(null);
      setDownloadSuccessId(device.id);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err) {
      console.error('Driver package download failed:', err);
      setDownloadingId(null);
    }
  };

  // Handle master bundle download
  const handleDownloadAll = async () => {
    try {
      setIsMasterDownloading(true);
      await downloadAllDriversMasterBundle(devices);
      setIsMasterDownloading(false);
    } catch (err) {
      console.error('Master bundle download failed:', err);
      setIsMasterDownloading(false);
    }
  };

  // 1-Click Connect to HMI
  const handleConnectToHmi = (device: NetworkDevice) => {
    if (onConnectDeviceToHmi) {
      onConnectDeviceToHmi(device);
      setConnectionSuccessNotice(`Connected HMI to ${device.model} (${device.ip})`);
      setTimeout(() => setConnectionSuccessNotice(null), 4000);
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter((dev) => {
    const matchesCategory = categoryFilter === 'ALL' || dev.category === categoryFilter;
    const matchesProtocol = 
      protocolFilter === 'ALL' ||
      (protocolFilter === 'MDNS_ZEROCONF' && dev.discoveryProtocol === 'MDNS_ZEROCONF') ||
      (protocolFilter === 'UDP_BROADCAST_HEARTBEAT' && dev.discoveryProtocol === 'UDP_BROADCAST_HEARTBEAT') ||
      (protocolFilter === 'WIRELESS' && (dev.discoveryMedium === 'BLUETOOTH_LE' || dev.discoveryMedium === 'WIFI_DIRECT')) ||
      (protocolFilter === 'WIRED_ETHERNET' && dev.discoveryMedium !== 'BLUETOOTH_LE' && dev.discoveryMedium !== 'WIFI_DIRECT');

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      dev.model.toLowerCase().includes(query) ||
      dev.ip.includes(query) ||
      dev.vendor.toLowerCase().includes(query) ||
      dev.mac.toLowerCase().includes(query) ||
      dev.subsystemLocation.toLowerCase().includes(query);
    return matchesCategory && matchesProtocol && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Network Scanner Controls */}
      <div className={`rounded-2xl p-5 border transition-colors ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-500/60'
            : palette === 'AMBER'
            ? 'bg-black border-amber-500/60'
            : 'bg-black border-zinc-700'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`p-2 rounded-xl border ${
                isNightShift
                  ? palette === 'RED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <Wifi className="w-5 h-5" />
              </span>
              <div>
                <h2 className={`text-base font-extrabold font-mono tracking-tight ${
                  isNightShift
                    ? palette === 'RED'
                      ? 'text-red-300'
                      : 'text-amber-300'
                    : 'text-white'
                }`}>
                  AUTOMATIC NETWORK SCANNER & DRIVER DOWNLOADER
                </h2>
                <p className={`text-xs ${isNightShift ? 'text-zinc-400' : 'text-slate-400'}`}>
                  Auto-discovers industrial PLCs, HMIs, VFDs, and serial gateways on the machinery LAN and generates ready-to-run Android driver packages.
                </p>
              </div>
            </div>
          </div>

          {/* Subnet selector & Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className={`text-xs font-mono font-semibold ${isNightShift ? 'text-zinc-400' : 'text-slate-400'}`}>
                Subnet:
              </label>
              <select
                value={selectedSubnet}
                onChange={(e) => setSelectedSubnet(e.target.value)}
                className={`text-xs font-mono rounded-xl px-2.5 py-2 border outline-none ${
                  isNightShift
                    ? 'bg-zinc-950 text-amber-200 border-zinc-800'
                    : 'bg-slate-950 text-white border-slate-700'
                }`}
              >
                <option value="192.168.1.0/24">192.168.1.0/24 (Machinery ECR LAN)</option>
                <option value="10.10.40.0/24">10.10.40.0/24 (Switchboard Bus)</option>
                <option value="172.16.0.0/24">172.16.0.0/24 (Propulsion & Cargo)</option>
              </select>
            </div>

            {/* 1. ARP Subnet Scan */}
            <button
              onClick={handleStartScan}
              disabled={isScanning || isScanningMdns || isListeningHeartbeat}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-md ${
                isScanning
                  ? 'bg-amber-600/50 text-white cursor-wait'
                  : isNightShift
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
              title="Perform subnet ping and ARP port scan across selected subnet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? `ARP (${scanProgress}%)` : 'Scan Subnet'}</span>
            </button>

            {/* 2. mDNS ZeroConf Discovery Button */}
            <button
              onClick={handleScanMdns}
              disabled={isScanning || isScanningMdns || isListeningHeartbeat}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-md ${
                isScanningMdns
                  ? 'bg-sky-600/50 text-white cursor-wait'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
              }`}
              title="Scan for Schneider PLCs advertising mDNS ZeroConf services (_schneider-epac._udp, _modbus._tcp, _umas._tcp)"
            >
              <Wifi className={`w-3.5 h-3.5 ${isScanningMdns ? 'animate-bounce' : ''}`} />
              <span>{isScanningMdns ? 'Resolving mDNS...' : 'mDNS ZeroConf'}</span>
            </button>

            {/* 3. UDP Broadcast Heartbeat Listener Button */}
            <button
              onClick={handleListenHeartbeat}
              disabled={isScanning || isScanningMdns || isListeningHeartbeat}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-md ${
                isListeningHeartbeat
                  ? 'bg-emerald-600/50 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
              title="Listen for periodic Schneider UMAS (UDP:1740) & EtherNet/IP (UDP:2222) broadcast heartbeats"
            >
              <Activity className={`w-3.5 h-3.5 ${isListeningHeartbeat ? 'animate-spin' : ''}`} />
              <span>{isListeningHeartbeat ? 'Listening UDP:1740...' : 'Broadcast Heartbeat'}</span>
            </button>

            {/* 4. Nearby Wireless PLCs */}
            <button
              onClick={handleScanNearbyPlcs}
              disabled={isScanningNearby || isScanning}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border ${
                isScanningNearby
                  ? 'bg-purple-600/40 text-purple-200 border-purple-500 cursor-wait'
                  : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/40'
              }`}
              title="Scan nearby PLCs via Bluetooth LE 5.3 & Wi-Fi Direct"
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isScanningNearby ? 'animate-ping' : ''}`} />
              <span>{isScanningNearby ? 'Probing BLE...' : 'Nearby PLCs'}</span>
            </button>

            {/* 5. Continuous Auto-Polling */}
            <button
              onClick={() => setIsContinuousPolling(!isContinuousPolling)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition ${
                isContinuousPolling
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
              title="Continuously monitors device heartbeats every 4s"
            >
              <Radio className={`w-3.5 h-3.5 ${isContinuousPolling ? 'text-blue-400 animate-pulse' : 'text-zinc-500'}`} />
              <span>{isContinuousPolling ? 'Auto-Polling: ON' : 'Auto-Poll'}</span>
            </button>

            {/* 6. Download All Drivers Master Bundle */}
            <button
              onClick={handleDownloadAll}
              disabled={isMasterDownloading || devices.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition ${
                isNightShift
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Download all drivers for all detected devices in a single ZIP bundle"
            >
              <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
              <span>{isMasterDownloading ? 'Packaging...' : 'All Drivers (.ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* Scan Progress Bar */}
        {(isScanning || isScanningMdns || isListeningHeartbeat) && (
          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>
                  {isScanningMdns
                    ? 'Android NsdManager resolving _modbus._tcp.local & _schneider-epac._udp.local...'
                    : isListeningHeartbeat
                    ? 'MulticastLock active: Listening on 255.255.255.255:1740 (Schneider UMAS cyclic beacon)...'
                    : 'Auditing ARP broadcast, Modbus :502, UMAS :1740, S7comm :102...'}
                </span>
              </span>
              <span className="text-zinc-400 font-bold">
                {isScanning ? `${scanProgress}% (254 IPs swept)` : 'Active Discovery Engine'}
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className={`h-full transition-all duration-200 ${
                  isScanningMdns 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-400 w-full animate-pulse' 
                    : isListeningHeartbeat
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 w-full animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={isScanning ? { width: `${scanProgress}%` } : undefined}
              />
            </div>
          </div>
        )}

        {/* Success Notice for 1-Click Connect */}
        {connectionSuccessNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{connectionSuccessNotice}</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">Live Modbus routing established</span>
          </div>
        )}

        {/* Diagnostics & Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono">
          <div className={`p-3 rounded-xl border ${
            isNightShift ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-zinc-400 block text-[11px]">Subnet Hosts Scanned</span>
            <span className="text-lg font-bold text-white mt-0.5 block">254 IPs</span>
            <span className="text-[10px] text-emerald-400">Class C / 24-bit mask</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isNightShift ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-zinc-400 block text-[11px]">Connected Devices</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{devices.length} Online</span>
            <span className="text-[10px] text-zinc-400">0 IP conflicts detected</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isNightShift ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-zinc-400 block text-[11px]">Verified Drivers Ready</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{devices.length} Packages</span>
            <span className="text-[10px] text-emerald-400">JNI / CDC-ACM / OTG ready</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isNightShift ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-zinc-400 block text-[11px]">Average Subnet Latency</span>
            <span className="text-lg font-bold text-sky-400 mt-0.5 block">
              {(devices.reduce((acc, d) => acc + d.rttMs, 0) / (devices.length || 1)).toFixed(1)} ms
            </span>
            <span className="text-[10px] text-zinc-400">Deterministic industrial link</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PLC', 'HMI', 'DRIVE_VFD', 'GATEWAY', 'IO_ISLAND'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition shrink-0 text-[11px] ${
                categoryFilter === cat
                  ? isNightShift
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-emerald-500 text-slate-950'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat === 'ALL' ? 'All Types' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search IP, Model, Vendor, MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono outline-none border transition ${
              isNightShift
                ? 'bg-black text-amber-200 border-zinc-800 focus:border-amber-500'
                : 'bg-slate-950 text-white border-slate-800 focus:border-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Discovery Protocol Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono pb-1 border-b border-zinc-800/80">
        <span className="text-[11px] text-zinc-400 font-semibold shrink-0 mr-1">Discovery Engine:</span>
        <button
          onClick={() => setProtocolFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
            protocolFilter === 'ALL'
              ? 'bg-zinc-200 text-zinc-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          All Methods ({devices.length})
        </button>

        <button
          onClick={() => setProtocolFilter('MDNS_ZEROCONF')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
            protocolFilter === 'MDNS_ZEROCONF'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'bg-sky-950/40 text-sky-300 hover:bg-sky-900/40 border border-sky-800/50'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>mDNS ZeroConf ({devices.filter(d => d.discoveryProtocol === 'MDNS_ZEROCONF').length})</span>
        </button>

        <button
          onClick={() => setProtocolFilter('UDP_BROADCAST_HEARTBEAT')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
            protocolFilter === 'UDP_BROADCAST_HEARTBEAT'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/50'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>UDP Heartbeat UDP:1740 ({devices.filter(d => d.discoveryProtocol === 'UDP_BROADCAST_HEARTBEAT').length})</span>
        </button>

        <button
          onClick={() => setProtocolFilter('WIRED_ETHERNET')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
            protocolFilter === 'WIRED_ETHERNET'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Wired Subnet ({devices.filter(d => !d.discoveryMedium || d.discoveryMedium === 'WIRED_ETHERNET').length})
        </button>

        <button
          onClick={() => setProtocolFilter('WIRELESS')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
            protocolFilter === 'WIRELESS'
              ? 'bg-purple-500 text-white'
              : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/40 border border-purple-800/50'
          }`}
        >
          <Bluetooth className="w-3 h-3" />
          <span>Nearby Wireless ({devices.filter(d => d.discoveryMedium === 'BLUETOOTH_LE' || d.discoveryMedium === 'WIFI_DIRECT').length})</span>
        </button>
      </div>

      {/* Device Cards Directory */}
      <div className="space-y-3">
        {filteredDevices.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-400 text-xs">
            No devices matched the filter or search criteria.
          </div>
        ) : (
          filteredDevices.map((device) => {
            const isConnectedToThis = currentConnectedIp === device.ip;
            const isDownloading = downloadingId === device.id;
            const isDownloadSuccess = downloadSuccessId === device.id;
            const isExpanded = expandedDeviceId === device.id;

            return (
              <div
                key={device.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isConnectedToThis
                    ? isNightShift
                      ? 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-900/20'
                      : 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-900/20'
                    : isNightShift
                    ? 'border-zinc-800 bg-black hover:border-zinc-700'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Device identity & IP */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                      device.vendor === 'Schneider Electric'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : device.vendor === 'Siemens AG'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      <Server className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-bold font-mono text-sm ${
                          isNightShift ? 'text-zinc-100' : 'text-white'
                        }`}>
                          {device.model}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {device.vendor}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-900 text-amber-400 border border-amber-500/30">
                          {device.category}
                        </span>
                        {isConnectedToThis && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500 text-slate-950 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>CURRENT HMI TARGET</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-mono">
                        <span>📍 {device.subsystemLocation}</span>
                      </p>

                      {/* Network & Protocol Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
                        <span className="text-zinc-200 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          IP: {device.ip}
                        </span>
                        <span className="text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          MAC: {device.mac}
                        </span>
                        <span className="text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          RTT: {device.rttMs} ms
                        </span>
                        <span className="text-sky-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          FW: {device.firmware}
                        </span>
                      </div>

                      {/* Discovery Protocol Badges & Payload Inspector Triggers */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-mono">
                        {device.discoveryProtocol === 'MDNS_ZEROCONF' && (
                          <button
                            onClick={() => setSelectedPayloadDevice(device)}
                            className="px-2 py-0.5 rounded font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 flex items-center gap-1 transition cursor-pointer"
                            title="Inspect mDNS ZeroConf Service & TXT records"
                          >
                            <Wifi className="w-3 h-3 text-sky-400" />
                            <span>mDNS: {device.mdnsDetails?.serviceType || '_schneider-epac._udp'}</span>
                            <span className="underline ml-1 text-sky-200">Inspect TXT</span>
                          </button>
                        )}

                        {device.discoveryProtocol === 'UDP_BROADCAST_HEARTBEAT' && (
                          <button
                            onClick={() => setSelectedPayloadDevice(device)}
                            className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                            title="Inspect Schneider UMAS UDP Heartbeat frame & hex dump"
                          >
                            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                            <span>UDP Heartbeat: Port {device.heartbeatDetails?.port || 1740} ({device.heartbeatDetails?.scanCycleMs || 11.8}ms)</span>
                            <span className="underline ml-1 text-emerald-200">Inspect Beacon</span>
                          </button>
                        )}

                        {device.discoveryMedium === 'BLUETOOTH_LE' && (
                          <span className="px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                            <Bluetooth className="w-3 h-3" />
                            <span>Bluetooth LE ({device.rssi} dBm)</span>
                          </span>
                        )}

                        {device.discoveryMedium === 'WIFI_DIRECT' && (
                          <span className="px-2 py-0.5 rounded font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
                            <Signal className="w-3 h-3" />
                            <span>Wi-Fi Direct ({device.rssi} dBm)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* 1-Click Connect to HMI */}
                    <button
                      onClick={() => handleConnectToHmi(device)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-sm ${
                        isConnectedToThis
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 cursor-default'
                          : isNightShift
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                      title="Route HMI Telemetry & Modbus registers directly to this controller"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{isConnectedToThis ? 'Connected' : '1-Click Connect'}</span>
                    </button>

                    {/* Download Driver Package Button */}
                    <button
                      onClick={() => handleDownloadDriver(device)}
                      disabled={isDownloading}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 border shadow-sm ${
                        isDownloadSuccess
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : isNightShift
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      }`}
                      title={`Download Android driver ZIP (${device.driver.packageSize})`}
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : isDownloadSuccess ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>
                        {isDownloading ? 'Packaging...' : isDownloadSuccess ? 'Downloaded!' : `Driver (${device.driver.packageSize})`}
                      </span>
                    </button>

                    {/* Expand Details Toggle */}
                    <button
                      onClick={() => setExpandedDeviceId(isExpanded ? null : device.id)}
                      className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white transition"
                      title="Inspect driver specs, register map & JNI modules"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Inspector Drawer: Driver Manifest & Architecture */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/80 bg-zinc-950/60 font-mono text-xs space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* Driver Overview */}
                      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span>📦 Driver Architecture:</span>
                          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                            {device.driver.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                          {device.driver.description}
                        </p>
                        <div className="pt-1 text-[11px] text-zinc-400 space-y-0.5">
                          <div>• <strong>Package:</strong> {device.driver.downloadFileName}</div>
                          <div>• <strong>Compatibility:</strong> {device.driver.supportedAndroidVersions}</div>
                          <div>• <strong>JNI Shared Objects:</strong> {device.driver.jniLibs.join(', ')}</div>
                          <div>• <strong>Default Modbus Port:</strong> {device.driver.defaultPort} (Slave ID: {device.driver.defaultUnitId})</div>
                        </div>
                      </div>

                      {/* Register Mapping Preview */}
                      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                        <span className="text-emerald-400 font-bold block">
                          ⚡ Mapped Register Tags ({device.driver.sampleRegisterMap.length} points):
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {device.driver.sampleRegisterMap.map((reg, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] p-1 rounded bg-zinc-950 border border-zinc-800/80">
                              <span className="text-amber-300 font-bold">{reg.tag}</span>
                              <span className="text-zinc-300 truncate max-w-[160px]">{reg.description}</span>
                              <span className="text-zinc-400">{reg.scale}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detected Industrial Protocol Ports */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-zinc-400">Open Industrial Ports:</span>
                      {device.protocols.map((proto, pidx) => (
                        <span key={pidx} className="px-2 py-0.5 rounded bg-zinc-900 text-sky-300 border border-zinc-800">
                          {proto}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Schneider mDNS & Broadcast Heartbeat Packet Dissector Modal */}
      {selectedPayloadDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl space-y-4 font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  selectedPayloadDevice.discoveryProtocol === 'MDNS_ZEROCONF'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {selectedPayloadDevice.discoveryProtocol === 'MDNS_ZEROCONF' ? (
                    <Wifi className="w-5 h-5" />
                  ) : (
                    <Activity className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {selectedPayloadDevice.discoveryProtocol === 'MDNS_ZEROCONF'
                      ? 'SCHNEIDER mDNS ZEROCONF SERVICE DISSECTOR'
                      : 'SCHNEIDER UDP BROADCAST HEARTBEAT DISSECTOR'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Target: {selectedPayloadDevice.model} ({selectedPayloadDevice.ip})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayloadDevice(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* mDNS ZeroConf Details */}
            {selectedPayloadDevice.mdnsDetails && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Service FQDN:</span>
                    <span className="text-sky-300 font-bold break-all">{selectedPayloadDevice.mdnsDetails.serviceName}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Host Target & Domain:</span>
                    <span className="text-white">{selectedPayloadDevice.mdnsDetails.hostTarget} ({selectedPayloadDevice.mdnsDetails.domain})</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Resolved Socket:</span>
                    <span className="text-emerald-400 font-bold">{selectedPayloadDevice.mdnsDetails.resolvedIp}:{selectedPayloadDevice.mdnsDetails.port}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">DNS-SD Cache TTL:</span>
                    <span className="text-amber-300">{selectedPayloadDevice.mdnsDetails.ttlSeconds} seconds</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-300 font-bold block text-[11px]">Decoded mDNS TXT Record Attributes:</span>
                  <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 space-y-1 max-h-44 overflow-y-auto">
                    {Object.entries(selectedPayloadDevice.mdnsDetails.txtRecords).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-[10px] py-0.5 border-b border-zinc-900">
                        <span className="text-sky-400 font-bold">{key}</span>
                        <span className="text-zinc-200">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UDP Broadcast Heartbeat Details */}
            {selectedPayloadDevice.heartbeatDetails && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Beacon Port:</span>
                    <span className="text-emerald-400 font-bold">UDP {selectedPayloadDevice.heartbeatDetails.port}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">CPU Status:</span>
                    <span className="text-emerald-400 font-bold">{selectedPayloadDevice.heartbeatDetails.cpuState}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Scan Cycle:</span>
                    <span className="text-sky-400 font-bold">{selectedPayloadDevice.heartbeatDetails.scanCycleMs} ms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Sequence No:</span>
                    <span className="text-amber-400 font-bold">#{selectedPayloadDevice.heartbeatDetails.sequenceNumber}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-300 font-bold">Raw Preamble & Heartbeat Frame (Hex Dump):</span>
                    <span className="text-emerald-400 text-[10px]">Protocol: {selectedPayloadDevice.heartbeatDetails.protocol}</span>
                  </div>
                  <pre className="p-2 rounded bg-zinc-950 border border-zinc-800/80 text-amber-300 text-[10px] overflow-x-auto">
                    {selectedPayloadDevice.heartbeatDetails.rawHexPreamble}
                  </pre>
                  <p className="text-[10px] text-zinc-400">
                    Decoded: Header 0x53 0x45 ("SE" - Schneider Electric) • Family 0x0580 (M580 ePAC) • MAC {selectedPayloadDevice.mac} • Redundancy Status: {selectedPayloadDevice.heartbeatDetails.rstpRingStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400">
                Found via {selectedPayloadDevice.discoveryProtocol?.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleConnectToHmi(selectedPayloadDevice);
                    setSelectedPayloadDevice(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Connect HMI to this PLC</span>
                </button>
                <button
                  onClick={() => setSelectedPayloadDevice(null)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
