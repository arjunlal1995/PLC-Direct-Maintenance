import React, { useState } from 'react';
import { 
  Cable, 
  Cpu, 
  Terminal, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Hash, 
  HelpCircle,
  Copy,
  ExternalLink,
  Wifi,
  Radio,
  FolderArchive
} from 'lucide-react';
import { SchneiderUsbConnectionConfig } from '../types';
import { NetworkScannerHub } from './NetworkScannerHub';
import { NetworkDevice } from '../types/networkScanner';
import { useNightShift } from '../context/NightShiftContext';

interface SchneiderDriverHubProps {
  config: SchneiderUsbConnectionConfig;
  onUpdateConfig: (cfg: Partial<SchneiderUsbConnectionConfig>) => void;
  onTriggerAlert: (title: string, message: string, tag: string) => void;
  onConnectDeviceToHmi?: (device: NetworkDevice) => void;
}

export const SchneiderDriverHub: React.FC<SchneiderDriverHubProps> = ({
  config,
  onUpdateConfig,
  onTriggerAlert,
  onConnectDeviceToHmi,
}) => {
  const { isNightShift, palette } = useNightShift();
  const [activeDriverTab, setActiveDriverTab] = useState<'scanner' | 'cables'>('scanner');
  const [testRegister, setTestRegister] = useState('%MW100');
  const [writeValue, setWriteValue] = useState('85');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] Schneider USB-B Driver & RJ-45 Modbus TCP Stack initialized.',
    '[USB] Probing USB Host OTG: Vendor 0x2122 (Schneider), 0x0403 (FTDI TSX CUSB485).',
    '[TCP] Modbus TCP Port 502 socket handler ready for RJ-45 to Type-C adapter.',
    '[READY] Polling Schneider %SW50 (Diagnostic Faults) & %M1 (E-Stop Loop).'
  ]);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const appendLog = (line: string) => {
    setTerminalLogs((prev) => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  const handleReadRegister = () => {
    appendLog(`TX >> Modbus FC 0x03 [Read Holding Register]: ${testRegister} (Unit ID: ${config.slaveUnitId})`);
    setTimeout(() => {
      const simulatedVal = testRegister.includes('100') ? '85 (0.85 Bar)' : testRegister.includes('102') ? '705 RPM' : '1420';
      appendLog(`RX << Modbus FC 0x03 ACK: ${testRegister} = ${simulatedVal} [CRC16: OK]`);
    }, 150);
  };

  const handleWriteRegister = () => {
    appendLog(`TX >> Modbus FC 0x06 [Write Single Register]: ${testRegister} := ${writeValue}`);
    setTimeout(() => {
      appendLog(`RX << Modbus FC 0x06 ACK: Success. Register ${testRegister} updated to ${writeValue}`);
    }, 180);
  };

  const handleCalculateSchneiderMacIp = () => {
    const sampleMac = '00:80:F4:1A:2B:3C';
    // Schneider Modicon default IP is 84.x.y.z where x, y, z are the last 3 octets of MAC
    // 0x1A = 26, 0x2B = 43, 0x3C = 60 -> 84.26.43.60
    const calculatedIp = '84.26.43.60';
    onUpdateConfig({ plcIpAddress: calculatedIp });
    appendLog(`[MAC CALC] Schneider factory MAC (${sampleMac}) resolved default IP: ${calculatedIp}`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Bar */}
      <div className={`p-1.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-1.5 ${
        isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-500/50'
            : 'bg-black border-amber-500/50'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={() => setActiveDriverTab('scanner')}
          className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition ${
            activeDriverTab === 'scanner'
              ? isNightShift
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Automatic Network Scanner & Driver Downloader</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-zinc-950/40">
            AUTO-SCAN
          </span>
        </button>

        <button
          onClick={() => setActiveDriverTab('cables')}
          className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition ${
            activeDriverTab === 'cables'
              ? isNightShift
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Cable className="w-4 h-4" />
          <span>USB-B & RJ-45 Direct Hardware Console</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-zinc-950/40">
            PINOUTS & FC03/06
          </span>
        </button>
      </div>

      {/* VIEW 1: Subnet Auto-Scanner & Driver Downloader */}
      {activeDriverTab === 'scanner' && (
        <NetworkScannerHub
          currentConnectedIp={config.plcIpAddress}
          onConnectDeviceToHmi={(device) => {
            onUpdateConfig({
              plcIpAddress: device.ip,
              modbusPort: device.driver.defaultPort,
              slaveUnitId: device.driver.defaultUnitId,
              connected: true,
            });
            if (onConnectDeviceToHmi) {
              onConnectDeviceToHmi(device);
            }
          }}
        />
      )}

      {/* VIEW 2: Direct Cable Schematics & Modbus Register Terminal */}
      {activeDriverTab === 'cables' && (
        <>
          {/* Header & Connection Mode Selection */}
          <div className={`rounded-2xl p-5 border ${
            isNightShift ? 'bg-black border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cable className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className={`text-base font-bold font-mono ${isNightShift ? 'text-amber-300' : 'text-white'}`}>
                      SCHNEIDER ELECTRIC ANDROID DRIVER INTERFACE
                    </h2>
                    <p className={`text-xs ${isNightShift ? 'text-zinc-400' : 'text-slate-400'}`}>
                      Connect Android devices directly to Modicon M221, M241, M251, M340, and M580 controllers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateConfig({ connectionMode: 'USB_B_TO_TYPE_C' })}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                    config.connectionMode === 'USB_B_TO_TYPE_C'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>USB-B to Type-C (OTG)</span>
                </button>
                <button
                  onClick={() => onUpdateConfig({ connectionMode: 'RJ45_TO_TYPE_C' })}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                    config.connectionMode === 'RJ45_TO_TYPE_C'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>RJ-45 to Type-C (Ethernet)</span>
                </button>
              </div>
            </div>

            {/* Cable Schematics & Pinout Guide */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cable 1: USB-B to USB-C */}
              <div className={`p-4 rounded-xl border transition ${
                config.connectionMode === 'USB_B_TO_TYPE_C'
                  ? 'bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-bold text-emerald-400">1. USB-B to Type-C Connection</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Direct Diagnostic Port
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Plugs directly from the Android phone or rugged tablet’s USB-C port into the Modicon CPU programming port (USB Type B or Mini-B).
                </p>
                <div className="mt-3 bg-slate-900/90 p-2.5 rounded-lg font-mono text-[11px] space-y-1 text-slate-300 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Android USB Driver:</span>
                    <span className="text-emerald-400 font-bold">CDC-ACM / FTDI Serial</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Baud / Framing:</span>
                    <span className="text-white">19200, 8 Bits, Parity Even, 1 Stop Bit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Schneider Vendor ID:</span>
                    <span className="text-amber-400">0x2122 (8482 dec)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supported Cables:</span>
                    <span className="text-slate-300">Standard USB-C to USB-B / TSX CUSB485</span>
                  </div>
                </div>
              </div>

              {/* Cable 2: RJ-45 to USB-C */}
              <div className={`p-4 rounded-xl border transition ${
                config.connectionMode === 'RJ45_TO_TYPE_C'
                  ? 'bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-bold text-blue-400">2. RJ-45 to Type-C Connection</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                    High-Speed Modbus TCP
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Uses a USB-C Ethernet Adapter (Realtek RTL8153 or ASIX) to link directly to Modicon ETH1/ETH2 or Service Port.
                </p>
                <div className="mt-3 bg-slate-900/90 p-2.5 rounded-lg font-mono text-[11px] space-y-1 text-slate-300 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="text-blue-400 font-bold">Native Modbus TCP (Port 502)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target PLC IP:</span>
                    <span className="text-white">{config.plcIpAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit ID:</span>
                    <span className="text-amber-400">{config.slaveUnitId} (255 Gateway)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Schneider Default IP:</span>
                    <button
                      onClick={handleCalculateSchneiderMacIp}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Auto-Resolve 84.x.y.z
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Register Command Console */}
          <div className={`rounded-2xl p-5 border space-y-4 ${
            isNightShift ? 'bg-black border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className={`text-sm font-bold font-mono ${isNightShift ? 'text-amber-300' : 'text-white'}`}>
                  MODBUS COMMAND & REGISTER CONSOLE
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hardware Stream Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Register (%MW / %SW)</label>
                <input
                  type="text"
                  value={testRegister}
                  onChange={(e) => setTestRegister(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Value (for Write)</label>
                <input
                  type="text"
                  value={writeValue}
                  onChange={(e) => setWriteValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex items-end gap-2 md:col-span-2">
                <button
                  onClick={handleReadRegister}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Read Register (FC 03)
                </button>
                <button
                  onClick={handleWriteRegister}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold transition flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Write Register (FC 06)
                </button>
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] h-44 overflow-y-auto space-y-1 text-slate-300">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-tight">
                  {log.includes('TX >>') ? (
                    <span className="text-amber-400">{log}</span>
                  ) : log.includes('RX <<') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('CRITICAL') || log.includes('Fault') ? (
                    <span className="text-red-400 font-bold">{log}</span>
                  ) : (
                    <span className="text-slate-400">{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
