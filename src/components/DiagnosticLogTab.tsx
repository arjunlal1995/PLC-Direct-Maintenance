import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Terminal, 
  Search, 
  Download, 
  Trash2, 
  Pause, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Wifi, 
  Cpu, 
  Layers, 
  ArrowDownRight, 
  ArrowUpRight, 
  Sliders, 
  Zap, 
  FileSpreadsheet, 
  FileCode, 
  Copy, 
  Check, 
  Info, 
  ShieldAlert, 
  Activity, 
  Maximize2, 
  X,
  Filter,
  Flame,
  Radio
} from 'lucide-react';
import { 
  ModbusTcpPacket, 
  ModbusDiagnosticStats, 
  IntermittentSimulationProfile, 
  ModbusStatusCode 
} from '../types/modbusDiagnostic';
import { 
  generateModbusTcpPacket, 
  calculateDiagnosticStats, 
  exportToCsv, 
  exportToJson, 
  generateInitialDiagnosticLog 
} from '../utils/modbusTrafficLogger';
import { useNightShift } from '../context/NightShiftContext';

interface DiagnosticLogTabProps {
  onTriggerAlert?: (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO', title: string, message: string, tag: string) => void;
}

export const DiagnosticLogTab: React.FC<DiagnosticLogTabProps> = ({ onTriggerAlert }) => {
  const { isNightShift, palette, highContrast } = useNightShift();

  // Traffic log state
  const [packets, setPackets] = useState<ModbusTcpPacket[]>(() => generateInitialDiagnosticLog(35));
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [pollingRateMs, setPollingRateMs] = useState<number>(500);
  const [bufferLimit, setBufferLimit] = useState<number>(500);
  
  // Intermittent simulation profile
  const [simulationProfile, setSimulationProfile] = useState<IntermittentSimulationProfile>('NORMAL');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'EXCEPTION' | 'TIMEOUT' | 'COMM_ERROR'>('ALL');
  const [functionCodeFilter, setFunctionCodeFilter] = useState<'ALL' | '1' | '3' | '4' | '5' | '6'>('ALL');
  const [anomaliesOnly, setAnomaliesOnly] = useState<boolean>(false);

  // Inspector modal for selected packet
  const [selectedPacket, setSelectedPacket] = useState<ModbusTcpPacket | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Table container ref for auto-scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Live polling effect that captures incoming Modbus TCP traffic
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      const newPacket = generateModbusTcpPacket(simulationProfile);
      
      setPackets((prev) => {
        const next = [newPacket, ...prev];
        if (next.length > bufferLimit) {
          return next.slice(0, bufferLimit);
        }
        return next;
      });

      // If a severe intermittent communication error or timeout occurs, trigger alarm blip if handler exists
      if (newPacket.statusText === 'TIMEOUT' && onTriggerAlert) {
        onTriggerAlert(
          'HIGH',
          'Intermittent Modbus TCP Timeout',
          `No ACK response from ${newPacket.sourceIp}:502 for ${newPacket.registerAddress} within ${newPacket.latencyMs}ms.`,
          newPacket.registerAddress
        );
      } else if (newPacket.statusText === 'EXCEPTION' && newPacket.statusCode === '0x02' && onTriggerAlert) {
        onTriggerAlert(
          'MEDIUM',
          'Modbus Exception 0x02 Illegal Address',
          `PLC rejected register address ${newPacket.registerAddress} (${newPacket.tagName}).`,
          newPacket.registerAddress
        );
      }
    }, pollingRateMs);

    return () => clearInterval(interval);
  }, [isCapturing, pollingRateMs, bufferLimit, simulationProfile, onTriggerAlert]);

  // Handle auto-scroll to top when new packets arrive
  useEffect(() => {
    if (autoScroll && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [packets, autoScroll]);

  // Compute live diagnostic stats over current buffer
  const stats: ModbusDiagnosticStats = useMemo(() => {
    return calculateDiagnosticStats(packets);
  }, [packets]);

  // Filtered packets list
  const filteredPackets = useMemo(() => {
    return packets.filter((p) => {
      // Status filter
      if (statusFilter !== 'ALL' && p.statusText !== statusFilter) return false;

      // Function code filter
      if (functionCodeFilter !== 'ALL' && p.functionCode.toString() !== functionCodeFilter) return false;

      // Anomaly only toggle
      if (anomaliesOnly && !p.isAnomaly && p.statusText === 'SUCCESS') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = p.registerAddress.toLowerCase().includes(q);
        const matchesName = (p.tagName || '').toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesHex = p.rawHex.toLowerCase().includes(q);
        const matchesMessage = p.statusMessage.toLowerCase().includes(q);
        const matchesStatusCode = p.statusCode.toLowerCase().includes(q);
        const matchesIp = p.sourceIp.includes(q) || p.destIp.includes(q);
        if (!matchesTag && !matchesName && !matchesId && !matchesHex && !matchesMessage && !matchesStatusCode && !matchesIp) {
          return false;
        }
      }

      return true;
    });
  }, [packets, statusFilter, functionCodeFilter, anomaliesOnly, searchQuery]);

  // Copy visible records to clipboard
  const handleCopyClipboard = () => {
    if (filteredPackets.length === 0) return;
    const tsvRows = filteredPackets.map((p) => 
      `${p.timestampFormatted}\t${p.id}\t${p.direction}\t${p.sourceIp}:502\t${p.functionCodeName}\t${p.registerAddress}\t${p.tagName || ''}\t${p.rawHex}\t${p.scaledValue || ''}\t${p.statusCode} (${p.statusText})\t${p.latencyMs}ms\t${p.statusMessage}`
    );
    const header = 'Timestamp\tPacket ID\tDirection\tEndpoint\tFunction\tRegister\tName\tRaw Hex\tScaled Value\tStatus\tRTT\tMessage';
    const textToCopy = [header, ...tsvRows].join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedNotification(`Copied ${filteredPackets.length} Modbus traffic records to clipboard!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    });
  };

  // Manual anomaly injector
  const handleInjectManualAnomaly = (type: 'TIMEOUT' | 'EXCEPTION_02' | 'EXCEPTION_04' | 'CRC_ERROR') => {
    const injected = generateModbusTcpPacket('NORMAL', type);
    setPackets((prev) => [injected, ...prev.slice(0, bufferLimit - 1)]);
    if (onTriggerAlert) {
      onTriggerAlert(
        type === 'TIMEOUT' ? 'HIGH' : 'MEDIUM',
        `Diagnostic Test: Injected ${type}`,
        `Manual injection of ${type} into Modbus TCP stream at ${injected.registerAddress}`,
        injected.registerAddress
      );
    }
  };

  // Clear log
  const handleClearLog = () => {
    if (window.confirm('Clear all logged Modbus TCP diagnostic packets?')) {
      setPackets([]);
    }
  };

  // Night shift color variables
  const containerBg = isNightShift ? 'bg-black' : 'bg-slate-900';
  const cardBorder = isNightShift
    ? palette === 'RED'
      ? 'border-red-900/60'
      : palette === 'AMBER'
      ? 'border-amber-900/60'
      : 'border-zinc-800'
    : 'border-slate-800';

  const textHeaderColor = isNightShift
    ? palette === 'RED'
      ? 'text-red-400'
      : palette === 'AMBER'
      ? 'text-amber-400'
      : 'text-zinc-200'
    : 'text-emerald-400';

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Toast notification */}
      {copiedNotification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-300 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header bar with Status & Target description */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${containerBg} ${cardBorder} shadow-2xl transition-colors`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isNightShift
                  ? palette === 'RED'
                    ? 'bg-red-950/80 text-red-400 border border-red-800'
                    : palette === 'AMBER'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${textHeaderColor}`}>
                  MODBUS TCP DIAGNOSTIC TRAFFIC & INTERMITTENT FAULT ANALYZER
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-wider ${
                    isCapturing 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isCapturing ? '● LIVE SNIFFING' : '❚❚ CAPTURE PAUSED'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time recording of Modbus TCP MBAP / PDU telegrams (%MW holding registers, %M coils, %SW words).
                  Equipped with latency jitter profiling and intermittent PLC drop detection for marine ECR & automation LAN.
                </p>
              </div>
            </div>
          </div>

          {/* Quick controls: Pause/Resume, Auto-scroll, Clear, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCapturing(!isCapturing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isCapturing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black border-emerald-400'
              }`}
              title={isCapturing ? 'Pause traffic capture' : 'Resume traffic capture'}
            >
              {isCapturing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isCapturing ? 'Pause Capture' : 'Resume Capture'}</span>
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                autoScroll
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle auto-scroll to newest packet"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleCopyClipboard}
              disabled={filteredPackets.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
              title="Copy filtered rows to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </button>

            <button
              onClick={() => exportToCsv(filteredPackets)}
              disabled={filteredPackets.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 disabled:opacity-40"
              title="Download entire log as CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportToJson(filteredPackets)}
              disabled={filteredPackets.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 disabled:opacity-40"
              title="Download raw log as JSON file"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleClearLog}
              disabled={packets.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition disabled:opacity-30"
              title="Clear traffic buffer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Target Info, Polling Rate, and Buffer settings */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300 font-bold">Target PLC:</span> 192.168.1.10:502
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span><strong className="text-slate-300">Slave Unit ID:</strong> 1</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span><strong className="text-slate-300">Active Architecture:</strong> Modbus TCP (MBAP over IEEE 802.3)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Poll Speed:</span>
              <select
                value={pollingRateMs}
                onChange={(e) => setPollingRateMs(Number(e.target.value))}
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={150}>150ms (Ultra-Fast)</option>
                <option value={250}>250ms (High Speed)</option>
                <option value={500}>500ms (Standard Industrial)</option>
                <option value={1000}>1000ms (Slow Telemetry)</option>
                <option value={2000}>2000ms (Low Bandwidth)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Buffer Max:</span>
              <select
                value={bufferLimit}
                onChange={(e) => setBufferLimit(Number(e.target.value))}
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={100}>100 packets</option>
                <option value={250}>250 packets</option>
                <option value={500}>500 packets</option>
                <option value={1000}>1000 packets</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Communication Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Captured Packets */}
        <div className={`p-4 rounded-xl border ${containerBg} ${cardBorder} shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Captured Packets</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.totalPackets}</span>
            <span className="text-xs text-slate-400">in memory</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Rate:</span>
            <span className="text-sky-300 font-bold">{(1000 / pollingRateMs).toFixed(1)} pkts/sec</span>
          </div>
        </div>

        {/* Card 2: Packet Success Rate */}
        <div className={`p-4 rounded-xl border ${containerBg} ${cardBorder} shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${
              stats.packetLossPercent > 5 ? 'text-red-400' : stats.packetLossPercent > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {(100 - stats.packetLossPercent).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              ({stats.successCount} OK)
            </span>
          </div>
          <div className="mt-1 text-[11px] flex items-center gap-1">
            <span className="text-slate-500">Loss / Error:</span>
            <span className={`font-bold ${stats.packetLossPercent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {stats.packetLossPercent}%
            </span>
          </div>
        </div>

        {/* Card 3: Intermittent Drops & Exceptions */}
        <div className={`p-4 rounded-xl border ${containerBg} ${cardBorder} shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Faults & Timeouts</span>
            <AlertTriangle className={`w-4 h-4 ${
              stats.timeoutCount + stats.exceptionCount + stats.commErrorCount > 0 ? 'text-amber-400' : 'text-slate-500'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${
              stats.timeoutCount + stats.exceptionCount + stats.commErrorCount > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}>
              {stats.timeoutCount + stats.exceptionCount + stats.commErrorCount}
            </span>
            <span className="text-xs text-slate-400">total errors</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-red-400 font-bold">{stats.timeoutCount} timeouts</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{stats.exceptionCount} exceptions</span>
          </div>
        </div>

        {/* Card 4: Round Trip Latency & Jitter */}
        <div className={`p-4 rounded-xl border ${containerBg} ${cardBorder} shadow-lg`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Round-Trip Latency</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.avgLatencyMs}</span>
            <span className="text-xs text-slate-400">ms avg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Jitter:</span>
            <span className={`font-bold ${stats.jitterMs > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ±{stats.jitterMs} ms
            </span>
            <span className="text-slate-500">(1σ)</span>
          </div>
        </div>
      </div>

      {/* Intermittent Communication Issue Alert (If detected) */}
      {stats.intermittentIssueDetected && stats.activeAnomalyWarning && (
        <div className="p-4 rounded-xl bg-red-950/60 border-2 border-red-500/80 text-red-200 shadow-xl flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-red-300 uppercase">
                INTERMITTENT PLC COMMUNICATION ANOMALY FLAGGED
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-500 text-slate-950">
                ATTENTION REQUIRED
              </span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">
              {stats.activeAnomalyWarning}
            </p>
            <div className="text-[11px] text-red-300/80 pt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans">
              <span><strong>Physical Layer:</strong> Verify RJ-45 latching and shielded CAT6 grounding pin</span>
              <span><strong>Topology:</strong> Check Schneider Magelis switch port buffer queue for packet drops</span>
            </div>
          </div>
        </div>
      )}

      {/* Intermittent Issue Simulator & Test Injector Drawer */}
      <div className={`p-4 rounded-xl border ${containerBg} ${cardBorder} shadow-lg space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Intermittent Issue Debug Simulator & Fault Injection
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">
              (Simulate realistic network noise and verify diagnostic detection)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Simulation Profile:</span>
            <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-950">
              <button
                onClick={() => setSimulationProfile('NORMAL')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  simulationProfile === 'NORMAL'
                    ? 'bg-emerald-600 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Healthy (99.5%)
              </button>
              <button
                onClick={() => setSimulationProfile('LOOSE_CABLE_DROPS')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  simulationProfile === 'LOOSE_CABLE_DROPS'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulates intermittent timeouts due to loose marine RJ-45 cable"
              >
                Loose Cable (Drops)
              </button>
              <button
                onClick={() => setSimulationProfile('ADDRESS_EXCEPTION')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  simulationProfile === 'ADDRESS_EXCEPTION'
                    ? 'bg-amber-600 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulates Modbus Exception 0x02 Illegal Address"
              >
                Address 0x02 Error
              </button>
              <button
                onClick={() => setSimulationProfile('EMI_NOISE_BURSTS')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  simulationProfile === 'EMI_NOISE_BURSTS'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulates high inductive EMI noise bursts / bad checksums"
              >
                EMI Bursts
              </button>
              <button
                onClick={() => setSimulationProfile('SLAVE_BUSY')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  simulationProfile === 'SLAVE_BUSY'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulates Modbus Exception 0x06 Slave Busy"
              >
                Slave Busy 0x06
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Manual Fault Injections */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1-Click Inject:
          </span>
          <button
            onClick={() => handleInjectManualAnomaly('TIMEOUT')}
            className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold transition"
          >
            + Inject Timeout (2000ms)
          </button>
          <button
            onClick={() => handleInjectManualAnomaly('EXCEPTION_02')}
            className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800/80 text-amber-300 font-bold transition"
          >
            + Inject Exception 0x02 (Illegal Addr)
          </button>
          <button
            onClick={() => handleInjectManualAnomaly('CRC_ERROR')}
            className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-800/80 text-purple-300 font-bold transition"
          >
            + Inject TCP RST / Corrupt Checksum
          </button>
          <button
            onClick={() => handleInjectManualAnomaly('EXCEPTION_04')}
            className="px-2.5 py-1 rounded bg-orange-950 hover:bg-orange-900 border border-orange-800/80 text-orange-300 font-bold transition"
          >
            + Inject 0x04 (Slave Failure)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3.5 rounded-xl border ${containerBg} ${cardBorder} shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs`}>
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search register (%MW100, %M1), packet ID, IP, hex data, status..."
            className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ALL">All Statuses ({packets.length})</option>
              <option value="SUCCESS">Success OK ({stats.successCount})</option>
              <option value="EXCEPTION">Modbus Exceptions ({stats.exceptionCount})</option>
              <option value="TIMEOUT">Timeouts ({stats.timeoutCount})</option>
              <option value="COMM_ERROR">Comm / CRC Errors ({stats.commErrorCount})</option>
            </select>
          </div>

          {/* Function code filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Function:</span>
            <select
              value={functionCodeFilter}
              onChange={(e) => setFunctionCodeFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ALL">All FCs</option>
              <option value="1">FC01 (Read Coils)</option>
              <option value="3">FC03 (Read Holding %MW)</option>
              <option value="4">FC04 (Read Inputs)</option>
              <option value="5">FC05 (Write Single Coil)</option>
              <option value="6">FC06 (Write Register)</option>
            </select>
          </div>

          {/* Anomaly only toggle */}
          <button
            onClick={() => setAnomaliesOnly(!anomaliesOnly)}
            className={`px-2.5 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${
              anomaliesOnly
                ? 'bg-red-500 text-slate-950 border-red-400 font-black'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Filter down exclusively to anomalous or faulty packets"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Faults Only</span>
          </button>
        </div>
      </div>

      {/* Main Diagnostic Table Container */}
      <div className={`rounded-xl border ${containerBg} ${cardBorder} shadow-2xl overflow-hidden`}>
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span>Showing <strong className="text-slate-200">{filteredPackets.length}</strong> of <strong className="text-slate-200">{packets.length}</strong> logged Modbus TCP telegrams</span>
            {searchQuery && (
              <span className="text-amber-400">(Filtered by "{searchQuery}")</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Click any row to inspect MBAP header & decode PDU bytes
          </span>
        </div>

        <div 
          ref={tableContainerRef}
          className="max-h-[520px] overflow-y-auto overflow-x-auto divide-y divide-slate-800/60"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-2">ID</th>
                <th className="py-2.5 px-2">Dir</th>
                <th className="py-2.5 px-2">Function</th>
                <th className="py-2.5 px-3">Address / Tag</th>
                <th className="py-2.5 px-3">Value (Hex / Scaled)</th>
                <th className="py-2.5 px-3">Status Code</th>
                <th className="py-2.5 px-2 text-right">RTT</th>
                <th className="py-2.5 px-3">Details / Message</th>
                <th className="py-2.5 px-2 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">No Modbus TCP packets match current filter criteria</p>
                    <p className="text-[11px] text-slate-600 mt-1">Adjust search query or switch status filter to ALL</p>
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isError = pkt.statusText !== 'SUCCESS';
                  const isTimeout = pkt.statusText === 'TIMEOUT';
                  const isException = pkt.statusText === 'EXCEPTION';

                  return (
                    <tr
                      key={pkt.id + pkt.timestamp}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`cursor-pointer transition-colors hover:bg-slate-800/60 ${
                        isTimeout
                          ? 'bg-red-950/30 hover:bg-red-950/50'
                          : isException
                          ? 'bg-amber-950/20 hover:bg-amber-950/40'
                          : isNightShift && palette === 'RED'
                          ? 'hover:bg-red-950/30'
                          : isNightShift && palette === 'AMBER'
                          ? 'hover:bg-amber-950/30'
                          : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-2 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {pkt.timestampFormatted.split(' ')[1]}
                      </td>

                      {/* Packet ID */}
                      <td className="py-2 px-2 whitespace-nowrap text-slate-300 font-bold">
                        {pkt.id}
                      </td>

                      {/* Direction */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-black bg-slate-800 text-sky-400 border border-slate-700">
                          <ArrowDownRight className="w-3 h-3 text-sky-400" />
                          RX
                        </span>
                      </td>

                      {/* Function Code */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pkt.functionCode === 3
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pkt.functionCode === 1
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : pkt.functionCode === 6 || pkt.functionCode === 16
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {pkt.functionCodeName.split(' ')[0]}
                        </span>
                      </td>

                      {/* Register Address & Tag Name */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{pkt.registerAddress}</span>
                          {pkt.isAnomaly && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" title="Anomaly flagged" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={pkt.tagName}>
                          {pkt.tagName || 'Holding Register'}
                        </div>
                      </td>

                      {/* Value (Hex / Scaled) */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="text-emerald-400 font-mono font-bold">
                          {pkt.scaledValue || pkt.rawHex}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {pkt.rawHex} (Dec: {Array.isArray(pkt.rawValue) ? pkt.rawValue.join(',') : pkt.rawValue})
                        </div>
                      </td>

                      {/* Status Code */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {pkt.statusText === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>0x00 OK</span>
                          </span>
                        ) : isTimeout ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-black bg-red-500 text-white animate-pulse">
                            <XCircle className="w-3 h-3 text-white" />
                            <span>0xFE TIMEOUT</span>
                          </span>
                        ) : isException ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>{pkt.statusCode} EXCEPTION</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            <Flame className="w-3 h-3 text-purple-400" />
                            <span>{pkt.statusCode} COMM_RST</span>
                          </span>
                        )}
                      </td>

                      {/* RTT Latency */}
                      <td className="py-2 px-2 whitespace-nowrap text-right font-mono">
                        <span className={`font-bold ${
                          pkt.latencyMs > 1000
                            ? 'text-red-400 font-black'
                            : pkt.latencyMs > 80
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}>
                          {pkt.latencyMs}ms
                        </span>
                      </td>

                      {/* Message / Details */}
                      <td className="py-2 px-3 text-slate-300 max-w-[240px] truncate text-[11px]" title={pkt.statusMessage}>
                        {pkt.statusMessage}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPacket(pkt);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold transition"
                        >
                          Dissect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Dissector Modal / Detail Inspector */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-3xl rounded-2xl border ${containerBg} ${cardBorder} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  selectedPacket.statusText === 'TIMEOUT'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : selectedPacket.statusText === 'EXCEPTION'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    MODBUS TCP PACKET DISSECTOR [{selectedPacket.id}]
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      selectedPacket.statusText === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : selectedPacket.statusText === 'TIMEOUT'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {selectedPacket.statusCode} {selectedPacket.statusText}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Timestamp: {selectedPacket.timestampFormatted} • Unit ID: {selectedPacket.unitId} • Port 502
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPacket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-mono">
              {/* Anomaly diagnostic callout if flagged */}
              {selectedPacket.isAnomaly && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/80 text-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase text-red-300">Intermittent Fault Analysis</h4>
                    <p className="text-xs text-red-200 mt-0.5">{selectedPacket.anomalyReason || selectedPacket.statusMessage}</p>
                    <p className="text-[11px] text-red-300/80 font-sans mt-1">
                      Check for intermittent connection drops, cable vibration, or electrical noise from nearby high-current switchgear.
                    </p>
                  </div>
                </div>
              )}

              {/* MBAP Header Inspection */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  MBAP Header (Modbus Application Protocol - 7 Bytes)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Transaction ID</span>
                    <span className="font-bold text-white">{selectedPacket.transactionId} (0x{selectedPacket.transactionId.toString(16).toUpperCase()})</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Protocol ID</span>
                    <span className="font-bold text-white">0x0000 (Modbus TCP)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">MBAP Length</span>
                    <span className="font-bold text-white">{selectedPacket.mbapLength} bytes</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Unit Identifier</span>
                    <span className="font-bold text-white">{selectedPacket.unitId}</span>
                  </div>
                </div>
              </div>

              {/* PDU (Protocol Data Unit) Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Modbus PDU Payload & Register Decoding
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Target Register / Tag:</span>
                    <div className="font-bold text-white text-sm">
                      {selectedPacket.registerAddress} • {selectedPacket.tagName}
                    </div>
                    <span className="text-[11px] text-slate-400">Function: {selectedPacket.functionCodeName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Decoded Value:</span>
                    <div className="font-bold text-emerald-400 text-base">
                      {selectedPacket.scaledValue || selectedPacket.rawHex}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Raw Int: {Array.isArray(selectedPacket.rawValue) ? selectedPacket.rawValue.join(', ') : selectedPacket.rawValue} • Hex: {selectedPacket.rawHex}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw Frame Hex Dissector */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    Hexadecimal Packet Representation
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPacket.rawFrameHex);
                      setCopiedNotification('Raw Hex payload copied!');
                      setTimeout(() => setCopiedNotification(null), 2000);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Hex</span>
                  </button>
                </div>
                <div className="p-2.5 rounded bg-black border border-slate-800 font-mono text-emerald-400 text-xs tracking-widest break-all select-all">
                  {selectedPacket.rawFrameHex}
                </div>
              </div>

              {/* Network Transport & Round-trip Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Source Endpoint</span>
                  <span className="font-bold text-white block">{selectedPacket.sourceIp}:{selectedPacket.port}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Destination Endpoint</span>
                  <span className="font-bold text-white block">{selectedPacket.destIp}:44818</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Round-Trip Time</span>
                  <span className={`font-bold block ${selectedPacket.latencyMs > 1000 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedPacket.latencyMs} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Modicon M340/M580 Modbus TCP Engine</span>
              <button
                onClick={() => setSelectedPacket(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close Dissector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
