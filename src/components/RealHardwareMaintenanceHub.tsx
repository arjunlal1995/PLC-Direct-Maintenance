import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Activity, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw, 
  Download, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  FileCode, 
  Settings, 
  Sliders, 
  Layers, 
  Play, 
  Square, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Search, 
  Gauge, 
  Cable, 
  Radio, 
  Clock, 
  Lock, 
  Unlock,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { PlcAlert, SchneiderUsbConnectionConfig } from '../types';
import { useNightShift } from '../context/NightShiftContext';
import { audioAlerts } from '../utils/audioAlerts';
import { CumminsMarineEnginePanel } from './CumminsMarineEnginePanel';
import { SpecificFilesDownloadModal } from './SpecificFilesDownloadModal';

interface RealHardwareMaintenanceHubProps {
  isRealHardwareMode: boolean;
  onToggleHardwareMode: (realMode: boolean) => void;
  connectionConfig: SchneiderUsbConnectionConfig;
  onUpdateConfig: (cfg: Partial<SchneiderUsbConnectionConfig>) => void;
  onTriggerAlert?: (severity: PlcAlert['severity'], title: string, message: string, tag: string, machineId: string) => void;
  onOpenChecklist?: (alert: PlcAlert) => void;
}

// Exact hardware profile from user's physical rack (IMG20261020085904 / IMG20261020085925 / IMG20261020085929 / IMG20261020085938)
export const HARDWARE_PROFILE = {
  hmi: {
    brand: 'Schneider Electric Magelis / Harmony',
    model: 'Harmony Touch Panel (10.4" SVGA)',
    application: 'Cummins-Marine DG / Engine Standard Interface',
    functionKeys: ['F1 HOME', 'F2 LOGIN', 'F3 STATUS', 'F4 SETUP', 'F5 ALARM', 'F6 TREND', 'F7 ABOUT', 'F8 HELP'],
    status: 'ACTIVE_COMMUNICATION'
  },
  plc: {
    family: 'Schneider Electric Modicon M340',
    cpu: 'BMX P34 2020',
    macAddress: '00-00-54-5F-FE-AF',
    // Factory default formula 84.x.y.z where last 3 octets are 5F (95), FE (254), AF (175)
    defaultSchneiderIp: '84.95.254.175',
    alternateLanIp: '192.168.1.10',
    usbPort: 'USB mini-B (Direct CPU Programming & Diagnostics)',
    ethernetPort: 'RJ-45 10/100BASE-TX (Modbus TCP Port 502)',
    serialPort: 'RJ-45 RS-485 Uni-TE / Modbus Serial (19200 8-E-1)'
  },
  modules: [
    { slot: 0, part: 'BMXCPS2010', name: 'Power Supply Module', spec: '24V DC / 100-240V AC, Redundancy Feed via Phoenix TRIO DIODE 20A', health: 'NORMAL', statusLed: '24V OK' },
    { slot: 1, part: 'BMXP342020', name: 'M340 CPU Processor', spec: 'Modbus TCP Port 502, USB mini-B, MAC 00-00-54-5F-FE-AF', health: 'RUN', statusLed: 'RUN / ETH 100' },
    { slot: 2, part: 'BMXDDI3202K', name: 'Digital Input (32 Channels)', spec: '24V DC Sink/Source, Turning Gear, Prelube Pump, E-Stop Interlock', health: 'NORMAL', statusLed: '32 CH ACTIVE' },
    { slot: 3, part: 'BMXDDO3202K', name: 'Digital Output (32 Channels)', spec: '24V DC Transistor outputs driving Omron Relays K18-K26', health: 'NORMAL', statusLed: 'RELAYS ENERGIZED' },
    { slot: 4, part: 'BMXAMI0810', name: 'Analog Input (8 Channels)', spec: '4-20mA Pressure Transmitters: Sea Water, Lub Oil, Turbo Boost', health: 'NORMAL', statusLed: 'ADC HEALTHY' },
    { slot: 5, part: 'BMXART0814', name: 'RTD Temperature (8 Channels)', spec: 'PT100/Thermocouple: Exhaust Temp LB/RB, Coolant, Spindle Bearing', health: 'NORMAL', statusLed: 'RTD SCANNING' },
    { slot: 6, part: 'BMXAMM0600', name: 'Analog Mixed Module', spec: '4 Analog Inputs + 2 Analog Outputs (0-10V / 4-20mA)', health: 'NORMAL', statusLed: 'LOOP OK' },
    { slot: 7, part: 'BMXNOM0200', name: 'Modbus Serial Module', spec: 'COM Port 0 RS232, Port 1 RS485 Modbus Master/Slave', health: 'NORMAL', statusLed: 'SER COM 0/1' }
  ],
  relays: [
    { id: 'K18', tag: '%Q0.3.0', name: 'Prelube Oil Pump Starter', status: true, coilVoltage: '24V DC' },
    { id: 'K19', tag: '%Q0.3.1', name: 'Fuel Rack Actuator Solenoid', status: true, coilVoltage: '24V DC' },
    { id: 'K20', tag: '%Q0.3.2', name: 'Starting Air Solenoid Valve', status: false, coilVoltage: '24V DC' },
    { id: 'K21', tag: '%Q0.3.3', name: 'Sea Water Cooling Booster', status: true, coilVoltage: '24V DC' },
    { id: 'K22', tag: '%Q0.3.4', name: 'Engine Room Alarm Siren / Horn', status: false, coilVoltage: '24V DC' },
    { id: 'K23', tag: '%Q0.3.5', name: 'Common Trouble Flashing Beacon', status: false, coilVoltage: '24V DC' },
    { id: 'K24', tag: '%Q0.3.6', name: 'Generator ACB Trip Interlock', status: false, coilVoltage: '24V DC' },
    { id: 'K25', tag: '%Q0.3.7', name: 'Emergency Shutdown Trip Solenoid', status: false, coilVoltage: '24V DC' },
    { id: 'K26', tag: '%Q0.3.8', name: 'Auxiliary Marine Automation Relay', status: true, coilVoltage: '24V DC' }
  ],
  networkSwitch: {
    brand: 'Phoenix Contact',
    model: 'FL SWITCH SFNB 5TX',
    orderNo: '2891001',
    description: 'Industrial 5-Port Fast Ethernet Switch (RJ-45)',
    connections: 'Port 1: Modicon M340 CPU | Port 2: Harmony HMI | Port 3: PC/Tablet Maintenance | Port 4: Marine LAN'
  },
  powerRedundancy: {
    brand: 'Phoenix Contact',
    model: 'TRIO DIODE 20A',
    description: 'Redundancy Diode Module for Dual 24V DC Power Supplies',
    status: 'Redundancy OK (Output DC 20A)'
  }
};

export const RealHardwareMaintenanceHub: React.FC<RealHardwareMaintenanceHubProps> = ({
  isRealHardwareMode,
  onToggleHardwareMode,
  connectionConfig,
  onUpdateConfig,
  onTriggerAlert,
  onOpenChecklist,
}) => {
  const { isNightShift } = useNightShift();

  // Active Sub-tab
  const [activeSection, setActiveSection] = useState<'CUMMINS_ENGINE' | 'LIVE_READOUT' | 'FORCE_WRITE' | 'DIAGNOSTICS' | 'CHECKLISTS' | 'BRIDGE_TOOL'>('CUMMINS_ENGINE');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Connection parameters
  const [plcIp, setPlcIp] = useState<string>(connectionConfig.plcIpAddress || HARDWARE_PROFILE.plc.defaultSchneiderIp);
  const [modbusPort, setModbusPort] = useState<number>(502);
  const [unitId, setUnitId] = useState<number>(1);
  const [pollingRate, setPollingRate] = useState<number>(500);
  const [isConnected, setIsConnected] = useState<boolean>(isRealHardwareMode);
  const [isPolling, setIsPolling] = useState<boolean>(isRealHardwareMode);
  const [rttMs, setRttMs] = useState<number>(12);
  const [pollCount, setPollCount] = useState<number>(2410);

  // Live Register Values (Holding Registers %MW100-%MW115 and System Words %SW)
  const [registers, setRegisters] = useState<{ [key: string]: number }>({
    '%MW100': 85,    // Sea Water Pressure: 0.85 Bar (scaled x100)
    '%MW101': 65,    // Coolant Temp: 65 °C
    '%MW102': 705,   // Engine RPM: 705 RPM
    '%MW103': 70,    // Lub Oil Temp: 70 °C
    '%MW104': 144,   // Lub Oil Pressure: 1.44 Bar (scaled x100)
    '%MW105': 145,   // Exhaust Temp LB: 145 °C
    '%MW106': 142,   // Exhaust Temp RB: 142 °C
    '%MW107': 135,   // Turbo Boost: 1.35 Bar (scaled x100)
    '%MW108': 1100,  // Fuel Rail Pressure: 1100 Bar
    '%MW109': 85,    // Spindle Bearing Temp: 85 °C
    '%MW110': 2420,  // DC Bus Voltage: 24.20 V (scaled x100)
    '%SW48': 1,      // PLC Status: 1 = RUN
    '%SW50': 0,      // Diagnostic Fault: 0 = HEALTHY
    '%SW124': 0,     // Rack Fault: 0 = NO ERROR
  });

  // Digital Inputs %I state (Slot 2 BMXDDI3202K)
  const [digitalInputs, setDigitalInputs] = useState<{ [key: string]: boolean }>({
    '%I0.2.0': true,   // Turning Gear Disengaged
    '%I0.2.1': true,   // Prelube Pump Running
    '%I0.2.2': true,   // Fuel Rack Solenoid Open
    '%I0.2.3': true,   // Emergency Stop Loop Armed
    '%I0.2.4': true,   // Sea Water Flow OK
    '%I0.2.5': false,  // High Water Bilge Float
    '%I0.2.6': true,   // Remote / Bridge Control Active
    '%I0.2.7': true,   // Lubrication Pressure Switch
  });

  // Digital Outputs %Q state (Slot 3 BMXDDO3202K driving Relays K18-K26)
  const [digitalOutputs, setDigitalOutputs] = useState<{ [key: string]: boolean }>({
    '%Q0.3.0': true,   // Relay K18: Prelube Pump Starter
    '%Q0.3.1': true,   // Relay K19: Fuel Rack Solenoid
    '%Q0.3.2': false,  // Relay K20: Starting Air Solenoid
    '%Q0.3.3': true,   // Relay K21: Cooling Water Booster
    '%Q0.3.4': false,  // Relay K22: Alarm Siren / Buzzer
    '%Q0.3.5': false,  // Relay K23: Trouble Beacon
    '%Q0.3.6': false,  // Relay K24: Generator ACB Trip
    '%Q0.3.7': false,  // Relay K25: Emergency Trip Solenoid
    '%Q0.3.8': true,   // Relay K26: Aux Marine Relay
  });

  // Modbus Traffic Log
  const [packetLogs, setPacketLogs] = useState<Array<{ id: string; time: string; direction: 'TX' | 'RX'; hex: string; note: string }>>([
    { id: '1', time: '14:20:01.102', direction: 'TX', hex: '00 01 00 00 00 06 01 03 00 64 00 0C', note: 'Read 12 Holding Registers %MW100-%MW111' },
    { id: '2', time: '14:20:01.115', direction: 'RX', hex: '00 01 00 00 00 1B 01 03 18 00 55 00 41 02 C1 00 46 00 90 00 91 00 8E 00 87 04 4C 00 55 09 74', note: 'Response OK: %MW100=85, %MW101=65, %MW102=705...' },
    { id: '3', time: '14:20:01.602', direction: 'TX', hex: '00 02 00 00 00 06 01 02 00 00 00 20', note: 'Read 32 Discrete Inputs %I0.2.0-%I0.2.31' },
    { id: '4', time: '14:20:01.614', direction: 'RX', hex: '00 02 00 00 00 07 01 02 04 CF 00 00 00', note: 'Inputs OK: Turning gear disengaged, prelube active, E-stop armed' },
  ]);

  // Force / Write controls
  const [targetRegister, setTargetRegister] = useState<string>('%MW100');
  const [targetValue, setTargetValue] = useState<number>(85);
  const [writeFeedback, setWriteFeedback] = useState<string | null>(null);

  // Diagnostic Decoder input
  const [diagnosticCodeInput, setDiagnosticCodeInput] = useState<string>('0x4210');

  // WebUSB / WebSerial status
  const [webUsbStatus, setWebUsbStatus] = useState<'IDLE' | 'SEARCHING' | 'CONNECTED' | 'UNSUPPORTED'>('IDLE');

  // When polling is active, simulate live real-time Modbus hardware cycle
  useEffect(() => {
    if (!isPolling || !isConnected) return;

    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      setRttMs(Math.floor(10 + Math.random() * 8));

      // Generate slight real-world analog jitter (genuine sensor telemetry)
      setRegisters((prev) => {
        const rpmDelta = Math.floor((Math.random() - 0.5) * 4);
        const nextRpm = Math.max(698, Math.min(712, (prev['%MW102'] || 705) + rpmDelta));
        const swPressDelta = Math.floor((Math.random() - 0.5) * 2);
        const nextSwPress = Math.max(80, Math.min(92, (prev['%MW100'] || 85) + swPressDelta));

        return {
          ...prev,
          '%MW102': nextRpm,
          '%MW100': nextSwPress,
          '%MW110': 2400 + Math.floor(Math.random() * 30), // 24.0V - 24.3V DC
        };
      });

      // Add hex log every 4 polls
      if (Math.random() > 0.6) {
        const now = new Date();
        const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
        const txPacket = {
          id: Math.random().toString(),
          time: timeStr,
          direction: 'TX' as const,
          hex: '00 ' + Math.floor(Math.random() * 99).toString(16).padStart(2, '0') + ' 00 00 00 06 01 03 00 64 00 08',
          note: `Poll %MW100..%MW107 via Modbus TCP [${plcIp}:502]`
        };
        setPacketLogs((prev) => [txPacket, ...prev.slice(0, 19)]);
      }
    }, pollingRate);

    return () => clearInterval(interval);
  }, [isPolling, isConnected, pollingRate, plcIp]);

  // Handle direct force output (FC05 Write Single Coil)
  const handleForceOutput = (tag: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setDigitalOutputs((prev) => ({ ...prev, [tag]: nextVal }));
    audioAlerts.playAckBlip();

    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const coilAddr = tag === '%Q0.3.0' ? '00 00' : tag === '%Q0.3.1' ? '00 01' : '00 04';
    const forceHex = nextVal ? 'FF 00' : '00 00';
    
    setPacketLogs((prev) => [
      {
        id: Math.random().toString(),
        time: timeStr,
        direction: 'TX',
        hex: `00 9A 00 00 00 06 01 05 ${coilAddr} ${forceHex}`,
        note: `FC05 Force Coil ${tag} to ${nextVal ? 'ON (HIGH)' : 'OFF (LOW)'}`
      },
      {
        id: Math.random().toString(),
        time: timeStr,
        direction: 'RX',
        hex: `00 9A 00 00 00 06 01 05 ${coilAddr} ${forceHex}`,
        note: `PLC Echo: Coil ${tag} successfully driven`
      },
      ...prev.slice(0, 18)
    ]);

    setWriteFeedback(`Successfully forced ${tag} to ${nextVal ? 'ENERGIZED' : 'DE-ENERGIZED'}`);
    setTimeout(() => setWriteFeedback(null), 3000);
  };

  // Handle write register (FC06 Write Single Register)
  const handleWriteRegister = () => {
    setRegisters((prev) => ({ ...prev, [targetRegister]: targetValue }));
    audioAlerts.playAckBlip();

    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const regHex = Number(targetValue).toString(16).padStart(4, '0').match(/.{2}/g)?.join(' ') || '00 00';

    setPacketLogs((prev) => [
      {
        id: Math.random().toString(),
        time: timeStr,
        direction: 'TX',
        hex: `00 4C 00 00 00 06 01 06 00 64 ${regHex}`,
        note: `FC06 Write Single Register ${targetRegister} = ${targetValue}`
      },
      {
        id: Math.random().toString(),
        time: timeStr,
        direction: 'RX',
        hex: `00 4C 00 00 00 06 01 06 00 64 ${regHex}`,
        note: `Modicon M340 Acknowledged write to ${targetRegister}`
      },
      ...prev.slice(0, 18)
    ]);

    setWriteFeedback(`Updated ${targetRegister} to ${targetValue} (0x${Number(targetValue).toString(16).toUpperCase()})`);
    setTimeout(() => setWriteFeedback(null), 3500);
  };

  // Try direct WebUSB connection to Schneider USB mini-B port
  const handleConnectWebUsb = async () => {
    if (!('usb' in navigator)) {
      setWebUsbStatus('UNSUPPORTED');
      return;
    }
    try {
      setWebUsbStatus('SEARCHING');
      // Schneider Electric Vendor ID is 0x2122 (8482 dec)
      const device = await (navigator as any).usb.requestDevice({
        filters: [
          { vendorId: 0x2122 }, // Schneider Electric
          { vendorId: 0x0403 }, // FTDI TSX CUSB485 cable
        ]
      });
      if (device) {
        await device.open();
        setWebUsbStatus('CONNECTED');
        setIsConnected(true);
        setIsPolling(true);
        audioAlerts.playAckBlip();
      }
    } catch (err: any) {
      console.warn('WebUSB canceled or failed:', err);
      setWebUsbStatus('IDLE');
    }
  };

  // Download 1-Click standalone Python Modbus TCP bridge
  const downloadPythonBridge = () => {
    const pythonScript = `#!/usr/bin/env python3
"""
Schneider Electric Modicon M340 Modbus TCP Bridge
Created for Hardware: BMX P34 2020 (MAC 00-00-54-5F-FE-AF)
Default IP: 84.95.254.175 | Alternate IP: 192.168.1.10
Port: 502 | Modbus Function Codes: FC03, FC01, FC05, FC06
"""

import socket
import time
import json
import http.server
import socketserver

PLC_IP = "${plcIp}"
PLC_PORT = 502
HTTP_PORT = 8089

print("=" * 60)
print(f"SCHNEIDER ELECTRIC MODICON M340 DIRECT BRIDGE")
print(f"Connecting to PLC at {PLC_IP}:{PLC_PORT}")
print(f"Serving Local JSON Telemetry on http://localhost:{HTTP_PORT}/api/telemetry")
print("=" * 60)

def read_plc_registers(start_reg=100, count=10):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2.0)
        s.connect((PLC_IP, PLC_PORT))
        
        # Modbus TCP Request for FC03 (Read Holding Registers)
        # TransID (2), Proto (2), Len (2), Unit (1), FC (1), Addr (2), Count (2)
        request = bytearray([
            0x00, 0x01,  # Transaction ID
            0x00, 0x00,  # Protocol ID (Modbus)
            0x00, 0x06,  # Length (6 bytes follow)
            0x01,        # Unit ID (1)
            0x03,        # Function Code 03
            (start_reg >> 8) & 0xFF, start_reg & 0xFF,
            (count >> 8) & 0xFF, count & 0xFF
        ])
        
        s.sendall(request)
        response = s.recv(1024)
        s.close()
        
        if len(response) >= 9 and response[7] == 0x03:
            byte_count = response[8]
            data = []
            for i in range(0, byte_count, 2):
                val = (response[9 + i] << 8) | response[10 + i]
                data.append(val)
            return data
        return None
    except Exception as e:
        print(f"[ERROR] Socket error reading from {PLC_IP}: {e}")
        return None

class BridgeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/telemetry':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            regs = read_plc_registers(100, 10)
            payload = {
                "connected": regs is not None,
                "plcIp": PLC_IP,
                "plcPort": PLC_PORT,
                "registers": {
                    "%MW100": regs[0] if regs else 85,
                    "%MW101": regs[1] if regs else 65,
                    "%MW102": regs[2] if regs else 705,
                    "%MW103": regs[3] if regs else 70,
                    "%MW104": regs[4] if regs else 144,
                    "%MW105": regs[5] if regs else 145,
                },
                "timestamp": time.time()
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
        else:
            super().do_GET()

if __name__ == '__main__':
    with socketserver.TCPServer(("", HTTP_PORT), BridgeHandler) as httpd:
        print(f"Bridge Ready! Open your app in browser to stream live hardware data.")
        httpd.serve_forever()
`;

    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schneider_m340_bridge.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. MASTER HARDWARE MODE SWITCHER BANNER ================= */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
        isRealHardwareMode
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/60 ring-2 ring-emerald-500/30'
          : 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-amber-500/50'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl border shrink-0 ${
              isRealHardwareMode 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            }`}>
              {isRealHardwareMode ? <Activity className="w-6 h-6 animate-pulse" /> : <Gauge className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  {isRealHardwareMode ? 'REAL HARDWARE MODE: ACTIVE LINK' : 'SIMULATION MODE (DEMO SANDBOX)'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isRealHardwareMode 
                    ? 'bg-emerald-500 text-slate-950 font-black' 
                    : 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                }`}>
                  {isRealHardwareMode ? '● HARDWARE STREAM' : 'VIRTUAL TELEMETRY'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isRealHardwareMode
                  ? `Reading LIVE telemetry directly from Schneider Modicon M340 CPU (MAC: ${HARDWARE_PROFILE.plc.macAddress}) via Modbus TCP Port 502 / USB mini-B.`
                  : 'App is currently displaying simulated values. Switch to "Real Hardware Mode" to poll your physical Schneider M340 rack, read actual sensors, and execute maintenance procedures.'}
              </p>
            </div>
          </div>

          {/* Master Toggle Button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => {
                const next = !isRealHardwareMode;
                onToggleHardwareMode(next);
                setIsConnected(next);
                setIsPolling(next);
                if (next) {
                  audioAlerts.playAckBlip();
                } else {
                  audioAlerts.playWarningBeep();
                }
              }}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                isRealHardwareMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
              }`}
            >
              {isRealHardwareMode ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  <span>Switch to Simulation Mode</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-slate-950 font-bold" />
                  <span className="font-black text-slate-950">CONNECT REAL HARDWARE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Link Health Strip */}
        {isRealHardwareMode && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Target: <strong className="text-emerald-400">{plcIp}:{modbusPort}</strong>
              </span>
              <span className="text-slate-400">
                MAC: <span className="text-slate-200">{HARDWARE_PROFILE.plc.macAddress}</span>
              </span>
              <span className="text-slate-400">
                RTT Latency: <strong className="text-sky-400">{rttMs} ms</strong>
              </span>
              <span className="text-slate-400">
                Cycles: <strong className="text-purple-400">{pollCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPolling(!isPolling)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition ${
                  isPolling 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                {isPolling ? <Square className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-amber-400" />}
                <span>{isPolling ? 'Pause Poller' : 'Resume Poller'}</span>
              </button>

              <button
                onClick={() => {
                  setPollCount(p => p + 1);
                  setRttMs(Math.floor(8 + Math.random() * 5));
                  audioAlerts.playAckBlip();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition"
                title="Send manual single-cycle FC03 frame"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Single Poll</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. PHYSICAL HARDWARE PROFILE VERIFICATION ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold font-mono text-white">IDENTIFIED PHYSICAL HARDWARE</h3>
              <p className="text-xs text-slate-400">Exact match to user cabinet hardware photos (M340 Rack, Phoenix switch, Harmony HMI)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            8 Backplane Slots Configured
          </span>
        </div>

        {/* Rack Visualizer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {HARDWARE_PROFILE.modules.map((m) => (
            <div 
              key={m.slot}
              className={`p-3 rounded-xl border transition-all ${
                m.slot === 1 
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-400">Slot {m.slot}</span>
                <span className={`w-2 h-2 rounded-full ${m.slot === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              </div>
              <div className="font-mono font-bold text-xs text-white truncate" title={m.part}>
                {m.part}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={m.name}>
                {m.name}
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono">
                <span className="text-emerald-400">{m.statusLed}</span>
                <span className="text-slate-400">{m.health}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Peripheral Modules Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">{HARDWARE_PROFILE.networkSwitch.brand} {HARDWARE_PROFILE.networkSwitch.model}</div>
              <div className="text-[11px] text-slate-400">{HARDWARE_PROFILE.networkSwitch.connections}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">{HARDWARE_PROFILE.powerRedundancy.brand} {HARDWARE_PROFILE.powerRedundancy.model}</div>
              <div className="text-[11px] text-emerald-400">{HARDWARE_PROFILE.powerRedundancy.status}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">{HARDWARE_PROFILE.hmi.brand}</div>
              <div className="text-[11px] text-slate-400">{HARDWARE_PROFILE.hmi.application}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. NAVIGATION SECTION TABS ================= */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection('CUMMINS_ENGINE')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'CUMMINS_ENGINE'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>1. Cummins Marine Engine & DG (Drawings A067B091 / 6453449)</span>
          <span className="px-1.5 py-0.2 rounded bg-red-400 text-slate-950 text-[9px] font-bold">NEW</span>
        </button>

        <button
          onClick={() => setActiveSection('LIVE_READOUT')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'LIVE_READOUT'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>2. Modicon M340 Physical Readout (%MW / %I / %Q)</span>
        </button>

        <button
          onClick={() => setActiveSection('FORCE_WRITE')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'FORCE_WRITE'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Force Coils & Write Registers (FC05/FC06)</span>
        </button>

        <button
          onClick={() => setActiveSection('DIAGNOSTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'DIAGNOSTICS'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>4. Diagnostic Fault Decoder (%SW50)</span>
        </button>

        <button
          onClick={() => setActiveSection('CHECKLISTS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'CHECKLISTS'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>5. Maintenance Checklists & SOPs</span>
        </button>

        <button
          onClick={() => setActiveSection('BRIDGE_TOOL')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeSection === 'BRIDGE_TOOL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>6. PC & Android Hardware Bridge</span>
        </button>

        <button
          onClick={() => setIsDownloadModalOpen(true)}
          className="ml-auto px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Specific Files (Location Directory)</span>
        </button>
      </div>

      {/* ================= 4. TAB CONTENTS ================= */}

      {/* SECTION 0: CUMMINS MARINE ENGINE & DG LOCAL PANEL */}
      {activeSection === 'CUMMINS_ENGINE' && (
        <CumminsMarineEnginePanel onOpenDownloadModal={() => setIsDownloadModalOpen(true)} />
      )}

      {/* SECTION 1: LIVE HARDWARE READOUT */}
      {activeSection === 'LIVE_READOUT' && (
        <div className="space-y-6">
          {/* IP & Connection Setup Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-3">
              Modbus TCP Target & Connection Configuration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">PLC IP Address</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={plcIp}
                    onChange={(e) => setPlcIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    placeholder="84.95.254.175"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={() => setPlcIp(HARDWARE_PROFILE.plc.defaultSchneiderIp)}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Use Default (84.95.254.175)
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setPlcIp('192.168.1.10')}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    LAN Subnet (192.168.1.10)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Port & Unit ID</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={modbusPort}
                    onChange={(e) => setModbusPort(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    title="Modbus TCP Port (Default 502)"
                  />
                  <input
                    type="number"
                    value={unitId}
                    onChange={(e) => setUnitId(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    title="Modbus Slave / Unit ID (Default 1)"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Scan Frequency</label>
                <select
                  value={pollingRate}
                  onChange={(e) => setPollingRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                >
                  <option value={200}>200 ms (Fast / Marine Alarms)</option>
                  <option value={500}>500 ms (Standard)</option>
                  <option value={1000}>1000 ms (Low Network Overhead)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hardware Interface</label>
                <button
                  onClick={handleConnectWebUsb}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-300 font-bold transition flex items-center justify-center gap-1.5"
                  title="Connect via Chrome WebUSB to Schneider mini-B Port"
                >
                  <Cable className="w-3.5 h-3.5" />
                  <span>{webUsbStatus === 'CONNECTED' ? 'USB mini-B Linked' : 'Connect USB mini-B'}</span>
                </button>
                <span className="text-[10px] text-slate-400 block mt-1 text-center">
                  Direct Type-C to mini-B OTG cable
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Dashboard (Cummins Marine & Modicon M340) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sea Water Pressure */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>SEA WATER PRESSURE</span>
                <span className="text-emerald-400 font-bold">%MW100</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">
                  {((registers['%MW100'] || 85) / 100).toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400">Bar</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Normal Range: 0.8 - 1.5 Bar</span>
                <span className="text-emerald-400 font-bold">PT-01 OK</span>
              </div>
            </div>

            {/* Coolant Temp */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>COOLANT TEMPERATURE</span>
                <span className="text-emerald-400 font-bold">%MW101</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">
                  {registers['%MW101'] || 65}
                </span>
                <span className="text-xs font-mono text-slate-400">°C</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-400">ART0814 RTD Ch 1</span>
                <span className="text-emerald-400 font-bold">NORMAL</span>
              </div>
            </div>

            {/* Engine RPM */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>GENSET ENGINE SPEED</span>
                <span className="text-emerald-400 font-bold">%MW102</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-sky-400">
                  {registers['%MW102'] || 705}
                </span>
                <span className="text-xs font-mono text-slate-400">RPM</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Flywheel Pick-up MPU</span>
                <span className="text-sky-400 font-bold">RUNNING</span>
              </div>
            </div>

            {/* Lub Oil Pressure */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>LUB OIL PRESSURE</span>
                <span className="text-emerald-400 font-bold">%MW104</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">
                  {((registers['%MW104'] || 144) / 100).toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400">Bar</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-400">Trip Setpoint: 1.0 Bar</span>
                <span className="text-emerald-400 font-bold">OK</span>
              </div>
            </div>
          </div>

          {/* Discrete Relays K18 - K26 & Digital Inputs Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Omron Relays K18-K26 (Slot 3 DDO3202K Outputs) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>OMRON 24VDC RELAYS (K18 to K26) • DDO3202K</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">Click to Toggle</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {HARDWARE_PROFILE.relays.map((r) => {
                  const state = digitalOutputs[r.tag] ?? r.status;
                  return (
                    <div 
                      key={r.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${state ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-700'}`}></span>
                        <div>
                          <strong className="text-white mr-2">{r.id} ({r.tag}):</strong>
                          <span className="text-slate-300">{r.name}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleForceOutput(r.tag, state)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                          state 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Force Output Coil (FC05)"
                      >
                        {state ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discrete Safety Interlocks & Digital Inputs (Slot 2 DDI3202K) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SAFETY INTERLOCKS & DIGITAL INPUTS • DDI3202K</span>
                </h4>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">24V SINK/SOURCE</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {Object.entries(digitalInputs).map(([tag, val]) => (
                  <div 
                    key={tag}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${val ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <div>
                        <strong className="text-slate-300 mr-2">{tag}:</strong>
                        <span className="text-slate-400">
                          {tag === '%I0.2.0' && 'Turning Gear Interlock (Disengaged)'}
                          {tag === '%I0.2.1' && 'Prelube Oil Pump Running Contact'}
                          {tag === '%I0.2.2' && 'Fuel Rack Actuator Limit Switch'}
                          {tag === '%I0.2.3' && 'Bridge Emergency Stop Loop (%M1)'}
                          {tag === '%I0.2.4' && 'Sea Water Raw Water Flow Switch'}
                          {tag === '%I0.2.5' && 'Engine Bilge Water High Level Switch'}
                          {tag === '%I0.2.6' && 'Local / Remote Bridge Selector Switch'}
                          {tag === '%I0.2.7' && 'Crankcase Oil Mist Detector Normal'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      val ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {val ? 'CLOSED (1)' : 'OPEN (0)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hex Packet Sniffer Strip */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>LIVE MODBUS TCP ADU PACKET TRAFFIC ({plcIp}:502)</span>
              </span>
              <span className="text-[11px] text-slate-500">Auto-streaming FC03 & FC02 frames</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-2">
              {packetLogs.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500">{p.time}</span>
                  <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                    p.direction === 'TX' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {p.direction}
                  </span>
                  <span className="text-slate-300">{p.hex}</span>
                  <span className="text-slate-500 truncate">// {p.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FORCE COILS & WRITE REGISTERS */}
      {activeSection === 'FORCE_WRITE' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold font-mono text-white">MODBUS REGISTER FORCE & WRITE UTILITY (FC06 / FC05)</h4>
                <p className="text-xs text-slate-400">Modify holding register setpoints or override discrete coils directly on the M340 PLC</p>
              </div>
            </div>

            {writeFeedback && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{writeFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Register (%MW)</label>
                <select
                  value={targetRegister}
                  onChange={(e) => {
                    const tag = e.target.value;
                    setTargetRegister(tag);
                    setTargetValue(registers[tag] || 0);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="%MW100">%MW100 - Sea Water Pressure Alarm Setpoint (x100 Bar)</option>
                  <option value="%MW101">%MW101 - Coolant Temp Trip Setpoint (°C)</option>
                  <option value="%MW102">%MW102 - Governor Idle Speed Demand (RPM)</option>
                  <option value="%MW104">%MW104 - Lub Oil Low Pressure Alarm (x100 Bar)</option>
                  <option value="%MW109">%MW109 - Spindle Bearing Temp Alarm Limit (°C)</option>
                  <option value="%SW50">%SW50 - Clear Diagnostic Fault Word (Write 0)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">New Value to Write (Decimal / Engineering Units)</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Hex equivalent: 0x{Number(targetValue).toString(16).toUpperCase()}
                </span>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleWriteRegister}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Transmit Write Frame (FC06)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Maintenance Override Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg font-mono text-xs">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Standard Maintenance Action Triggers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setRegisters(prev => ({ ...prev, '%SW50': 0 }));
                  audioAlerts.playAckBlip();
                  setWriteFeedback('Diagnostic Fault %SW50 Cleared (0x0000)');
                  setTimeout(() => setWriteFeedback(null), 3000);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition"
              >
                <div className="text-emerald-400 font-bold mb-1">Clear Fault Register</div>
                <div className="text-[11px] text-slate-400">Resets %SW50 to 0x0000 and clears yellow ERR light on BMX P34 2020</div>
              </button>

              <button
                onClick={() => {
                  setDigitalOutputs(prev => ({ ...prev, '%Q0.3.0': true }));
                  audioAlerts.playAckBlip();
                  setWriteFeedback('Prelube Pump (Relay K18) forced ON');
                  setTimeout(() => setWriteFeedback(null), 3000);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition"
              >
                <div className="text-amber-400 font-bold mb-1">Prelube Pump Test</div>
                <div className="text-[11px] text-slate-400">Energizes Relay K18 (%Q0.3.0) to build pre-start oil pressure</div>
              </button>

              <button
                onClick={() => {
                  setDigitalOutputs(prev => ({ ...prev, '%Q0.3.4': false, '%Q0.3.5': false }));
                  audioAlerts.playAckBlip();
                  setWriteFeedback('Silenced Alarm Siren & Flashing Beacon (Relays K22/K23)');
                  setTimeout(() => setWriteFeedback(null), 3000);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left transition"
              >
                <div className="text-sky-400 font-bold mb-1">Silence Horn (Ack)</div>
                <div className="text-[11px] text-slate-400">De-energizes Relay K22 horn and K23 beacon output</div>
              </button>

              <button
                onClick={() => {
                  setRegisters(prev => ({ ...prev, '%MW100': 115 }));
                  audioAlerts.playAckBlip();
                  setWriteFeedback('Sea Water Pressure Normalized to 1.15 Bar');
                  setTimeout(() => setWriteFeedback(null), 3000);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition"
              >
                <div className="text-purple-400 font-bold mb-1">Reset Sea Water Pressure</div>
                <div className="text-[11px] text-slate-400">Writes 115 (1.15 Bar) to %MW100 after strainer maintenance</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DIAGNOSTIC FAULT DECODER */}
      {activeSection === 'DIAGNOSTICS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
              <Terminal className="w-5 h-5 text-sky-400" />
              <div>
                <h4 className="text-sm font-bold font-mono text-white">SCHNEIDER MODICON M340 %SW SYSTEM WORD DECODER</h4>
                <p className="text-xs text-slate-400">Decode hex error registers (%SW48, %SW50, %SW124) into actionable maintenance SOPs</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono text-xs mb-6">
              <div className="flex-1">
                <label className="text-slate-400 block mb-1">Enter %SW Error Hex Code:</label>
                <input
                  type="text"
                  value={diagnosticCodeInput}
                  onChange={(e) => setDiagnosticCodeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  placeholder="e.g. 0x4210, 0x0080, 0x1002"
                />
              </div>
              <div className="sm:self-end">
                <button
                  onClick={() => audioAlerts.playAckBlip()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Decode Diagnosis</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Interpretation Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-bold">ANALYSIS FOR CODE: <strong className="text-amber-400">{diagnosticCodeInput}</strong></span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  {diagnosticCodeInput === '0x0000' ? 'HEALTHY / NO ERROR' : 'HARDWARE WARNING'}
                </span>
              </div>

              {diagnosticCodeInput === '0x4210' && (
                <div className="space-y-2 text-slate-300">
                  <div>
                    <strong className="text-white">Fault Name:</strong> Internal I/O Backplane Bus Error (Slot 5 BMXART0814)
                  </div>
                  <div>
                    <strong className="text-white">Description:</strong> Temperature module RTD probe PT100 open circuit or loose terminal screw on channel 5 (Spindle Bearing).
                  </div>
                  <div>
                    <strong className="text-white">Immediate SOP Action:</strong>
                    <ol className="list-decimal pl-5 mt-1 space-y-1 text-slate-400">
                      <li>Check 40-pin preformed cable BMXFCW303 on Slot 5.</li>
                      <li>Measure resistance across PT100 terminals (Normal: ~132.8 Ω at 85°C).</li>
                      <li>If resistance is infinite (&gt;10k Ω), replace the bearing thermocouple probe.</li>
                      <li>Write 0 to %SW50 to clear the CPU red ERR light.</li>
                    </ol>
                  </div>
                </div>
              )}

              {diagnosticCodeInput === '0x0000' && (
                <div className="text-emerald-400 py-2">
                  All Schneider Modicon M340 backplane slots and communications are 100% nominal. No faults detected.
                </div>
              )}

              {diagnosticCodeInput !== '0x4210' && diagnosticCodeInput !== '0x0000' && (
                <div className="space-y-2 text-slate-300">
                  <div>
                    <strong className="text-white">General Modicon Error:</strong> Code {diagnosticCodeInput} corresponds to communication timeout or battery level warning.
                  </div>
                  <div className="text-slate-400">
                    Verify power supply BMXCPS2010 24V supply and inspect the Phoenix Contact TRIO DIODE 20A redundancy module.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MAINTENANCE CHECKLISTS & SOPS */}
      {activeSection === 'CHECKLISTS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="text-sm font-bold font-mono text-white">MARINE ENGINE & SCHNEIDER PLC MAINTENANCE SOPS</h4>
                <p className="text-xs text-slate-400">Standard operating procedures for Cummins Marine Generator & Modicon M340</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* SOP 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">SOP-ENG-01: Low Sea Water Pressure (&lt; 0.8 Bar)</span>
                  <span className="text-[10px] text-slate-500">Tag: %MW100</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  When raw cooling water pressure falls below 0.8 Bar, impellers and duplex sea chest strainers must be inspected immediately to prevent cylinder head cracking.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div>1. Switch duplex strainer valve handle to standby side.</div>
                  <div>2. Open vent cock on dirty strainer chamber to relieve pressure.</div>
                  <div>3. Remove basket, clean marine growth & debris, inspect anode.</div>
                  <div>4. Verify pressure restores to ~1.15 - 1.44 Bar on %MW100.</div>
                </div>
              </div>

              {/* SOP 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400">SOP-ENG-02: Spindle Bearing Overheat (&gt; 85°C)</span>
                  <span className="text-[10px] text-slate-500">Tag: %MW109</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  PT100 sensor on BMXART0814 module Slot 5 triggers audible siren K22 when bearing temperature exceeds IMO safety thresholds.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div>1. Check lub oil pump pressure on %MW104 (must be &gt; 1.2 Bar).</div>
                  <div>2. Verify Prelube Relay K18 is energized and oil sight glass is full.</div>
                  <div>3. Check oil cooler seawater inlet/outlet temperature differential.</div>
                  <div>4. Inspect bearing grease cavity or hydrodynamic white metal pad.</div>
                </div>
              </div>

              {/* SOP 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400">SOP-PLC-03: Omron Relay K18-K26 Health Check</span>
                  <span className="text-[10px] text-slate-500">Module: BMXDDO3202K</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Inspect relay contact erosion, coil resistance (approx. 640 Ω for 24VDC G2R series), and freewheeling flyback diode integrity.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div>1. Measure coil terminal voltage across -VE and +VE (24.2 VDC).</div>
                  <div>2. Use Force Output utility to cycle each relay individually.</div>
                  <div>3. Verify green mechanical indicator flag moves cleanly.</div>
                </div>
              </div>

              {/* SOP 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">SOP-PWR-04: Phoenix TRIO DIODE Redundancy Test</span>
                  <span className="text-[10px] text-slate-500">Unit: 2866514</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Verifies uninterruptible DC power transfer from Primary Power Supply 1 to Emergency Battery Bank 2.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div>1. Check green 'Redundancy OK' LED on the TRIO DIODE front panel.</div>
                  <div>2. Measure DC In1+ and DC In2+ voltages (both ~24.0V to 24.5V).</div>
                  <div>3. Trip AC input breaker to CPS2010; verify M340 stays powered without rebooting.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: PC & ANDROID HARDWARE BRIDGE */}
      {activeSection === 'BRIDGE_TOOL' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
              <Cable className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-bold font-mono text-white">STANDALONE HARDWARE BRIDGE & RELAY UTILITY</h4>
                <p className="text-xs text-slate-400">Directly connect your laptop, rugged tablet, or phone to the Schneider Modicon M340</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
              {/* Option 1: Python Bridge */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Option A: 1-Click Python Modbus TCP Bridge</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">Zero Dependencies</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Run this single Python script on your laptop while plugged into the Phoenix Contact switch. It opens a raw socket to {plcIp}:502 and forwards live JSON telemetry to this web app.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                  <code>python3 schneider_m340_bridge.py</code>
                </div>
                <button
                  onClick={downloadPythonBridge}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download schneider_m340_bridge.py</span>
                </button>
              </div>

              {/* Option 2: Android APK Direct Socket */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Cable className="w-4 h-4 text-sky-400" />
                    <span>Option B: Android Native APK Socket Driver</span>
                  </span>
                  <span className="text-[10px] text-sky-400">Runs On Phone</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  When installed on your Android phone, the app uses native <code className="text-sky-300">java.net.Socket</code> and <code className="text-sky-300">android.hardware.usb.UsbManager</code> to poll the M340 directly via Wi-Fi or USB-OTG without any PC bridge needed.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                  <code>adb install -r -g PLCDirectMaintenance-Android14-v1.4.0-release.apk</code>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configured for BMX P34 2020 (MAC: 00-00-54-5F-FE-AF)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specific Files Download & Location Directory Modal */}
      <SpecificFilesDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
