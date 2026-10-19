import React, { useState, useEffect } from 'react';
import { 
  Cable, 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  Wifi, 
  Activity, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  Eye, 
  Sliders, 
  Terminal, 
  Zap, 
  Check, 
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { useNightShift } from '../context/NightShiftContext';

type InterfaceMode = 'USB_B' | 'RJ45';

interface StepDetail {
  id: number;
  title: string;
  subtitle: string;
  instruction: string;
  technicianTip: string;
  safetyWarning?: string;
  expectedLedState: string;
  signalAnimation: 'NONE' | 'PLUG_MOVING' | 'HANDSHAKE' | 'DATA_FLOW' | 'VERIFIED';
}

const USB_STEPS: StepDetail[] = [
  {
    id: 1,
    title: 'Pre-Inspection & Port De-energization Check',
    subtitle: 'Safety isolation & M580 front panel inspection',
    instruction: 'Inspect the Modicon M580 (BMEP58) CPU front panel. Ensure the rubber dust cover over the USB Type-B/Mini-B diagnostic port is clean and free of conductive engine-room oil or sea mist. Verify that the M580 CPU RUN LED is powered and the 24V DC auxiliary power supply (BMXCPS) is stable.',
    technicianTip: 'Use a soft ESD-safe brush to clear the port. Avoid using metallic picks which can short VBUS (+5V) to the grounded metallic chassis.',
    safetyWarning: 'Ensure proper ESD grounding strap is worn before contacting the M580 CPU front terminal contacts.',
    expectedLedState: 'PWR: Solid Green • RUN: Flashing or Solid Green • ERR: OFF',
    signalAnimation: 'NONE'
  },
  {
    id: 2,
    title: 'Cable Selection & Android OTG Verification',
    subtitle: 'Selecting certified USB-B to USB-C industrial cable',
    instruction: 'Use an industrial shielded USB 2.0 cable (USB-C male to USB Type-B male or Schneider TSXCRJMD25 / TSXCUSB485). Ensure the cable features dual ferrite chokes to prevent common-mode electrical noise from neighboring Variable Frequency Drives (VFDs) or bow thruster starters.',
    technicianTip: 'Standard consumer charging cables often lack data pins D+ / D-. Ensure high-speed data transmission lines are present and cable length does not exceed 3.0 meters (9.8 ft).',
    expectedLedState: 'PWR: Solid Green • USB Port: Standby',
    signalAnimation: 'PLUG_MOVING'
  },
  {
    id: 3,
    title: 'Physical Insertion & Latching',
    subtitle: 'Mating USB-B into M580 CPU diagnostic receptacle',
    instruction: 'Firmly insert the USB-B connector into the M580 CPU diagnostic port until the spring-detent latch clicks into place. Connect the USB-C end into the rugged Android tablet or handheld technician phone. Verify mechanical strain relief is engaged so engine vibration does not loosen the connector.',
    technicianTip: 'Marine vibrations can cause microscopic pin chatter. Route the cable through the cabinet tie-wrap saddle adjacent to the rack grounding bar.',
    expectedLedState: 'USB PHY: Initializing VBUS 5.0V handshake',
    signalAnimation: 'PLUG_MOVING'
  },
  {
    id: 4,
    title: 'Android USB Host Enumeration & Driver Binding',
    subtitle: 'CDC-ACM / FTDI driver authorization in Android OS',
    instruction: 'When prompted on the Android screen, accept the USB Permission dialog: "Allow Schneider Modicon Driver to access USB-Serial Device (VID: 0x2122, PID: 0x0241)?". Select "Always allow" for direct automatic reconnection. The native Android driver establishes virtual COM port binding at 19200 baud, 8 data bits, Even parity, 1 stop bit.',
    technicianTip: 'If the permission prompt does not appear, verify USB OTG is enabled in Android Settings > Connected Devices > OTG Connection.',
    expectedLedState: 'Android: CDC-ACM Virtual COM Bound • Baud: 19200 Even',
    signalAnimation: 'HANDSHAKE'
  },
  {
    id: 5,
    title: 'Live Modbus Polling & %SW0 Diagnostic Verification',
    subtitle: 'Querying CPU status registers & establishing live telemetry',
    instruction: 'The app initiates Modbus RTU-over-USB protocol handshaking. Read System Word %SW0 (CPU status) and %SW1 (Cycle time). Confirm the M580 diagnostic response is received with 0 errors. Live engine room data (%MW holding registers) begins streaming into your HMI dashboard.',
    technicianTip: 'A successful link displays a latency of 8-16 ms. If frame errors occur, check Parity setting is strictly set to EVEN.',
    expectedLedState: 'M580 RUN: Solid Green • STS: Solid Green • Data Flow: Active (Bi-directional)',
    signalAnimation: 'DATA_FLOW'
  }
];

const RJ45_STEPS: StepDetail[] = [
  {
    id: 1,
    title: 'Port Identification: ETH1, ETH2 vs SERVICE Port',
    subtitle: 'Locating the dedicated M580 field diagnostic Ethernet port',
    instruction: 'Examine the M580 CPU dual RJ-45 ports. Ports labeled ETH1 and ETH2 are typically reserved for the deterministic Daisy Chain Loop (RSTP / Ethernet/IP) between remote drops. For technician laptop or tablet diagnostics, locate the dedicated SERVICE Port (or plug directly into ETH2 if standalone point-to-point mode is configured).',
    technicianTip: 'Never break an active RSTP Ring during vessel propulsion operations unless bypass switches are energized.',
    safetyWarning: 'Do NOT connect to the Safety Bus (black/yellow jacket) without prior Chief Engineer authorization.',
    expectedLedState: 'M580 ETH1/2: Green Link • Service Port: Ready',
    signalAnimation: 'NONE'
  },
  {
    id: 2,
    title: 'Cable Standard & T568B Shielding Inspection',
    subtitle: 'Verifying CAT6A S/FTP patch cord & 360° shield continuity',
    instruction: 'Prepare an industrial CAT6 or CAT6A shielded twisted pair (S/FTP) patch cable with metal-clad RJ-45 connectors. Verify pinout wiring adheres to standard EIA/TIA T568B. Ensure the ground tab on the RJ-45 plug contacts the shielded receptacle inside the M580 port to dissipate electrostatic transients.',
    technicianTip: 'In marine environments, use gold-plated 50-micron pins to prevent salt-fog galvanic corrosion and high contact resistance.',
    expectedLedState: 'Port Receptacle: Mechanically Inspected',
    signalAnimation: 'PLUG_MOVING'
  },
  {
    id: 3,
    title: 'Android USB-C Gigabit Adapter Connection',
    subtitle: 'Linking USB-C Ethernet NIC (Realtek RTL8153 / ASIX AX88179)',
    instruction: 'Plug the USB-C Gigabit Ethernet adapter into the Android device. Connect the RJ-45 patch cable between the adapter and the M580 Service Port. Observe the green LINK LED on both the M580 and the USB-C adapter turn ON solid, indicating successful 100BASE-TX or 1000BASE-T physical layer link establishment.',
    technicianTip: 'Auto-MDIX is supported on M580; both straight-through and crossover cables will auto-negotiate correct TX/RX pairs.',
    expectedLedState: 'ETH LINK: Solid Green (100Mbps/1Gbps established) • ACT: Flashing Amber',
    signalAnimation: 'PLUG_MOVING'
  },
  {
    id: 4,
    title: 'Subnet IP Configuration & Rotary Switch Alignment',
    subtitle: 'Matching technician IP (192.168.1.50) with M580 IP (192.168.1.10)',
    instruction: 'Configure the Android Ethernet interface with a Static IP on the same subnet: IP Address: 192.168.1.50, Subnet Mask: 255.255.255.0 (/24), Gateway: 192.168.1.1. Confirm the M580 CPU rotary switches on the side/front are set to "Stored" or matching MAC suffix (default M580 IP: 192.168.1.10).',
    technicianTip: 'If DHCP is selected, the M580 acts as DHCP client and expects an address from the marine automation router. Use Static IP for direct field diagnostics.',
    expectedLedState: 'IP Assigned: 192.168.1.50 • ARP Cache Resolved • Ping RTT: <2ms',
    signalAnimation: 'HANDSHAKE'
  },
  {
    id: 5,
    title: 'Modbus TCP Socket Handshake & Port 502 Streaming',
    subtitle: 'Establishing TCP three-way handshake & reading memory registers',
    instruction: 'The Android app opens a TCP socket connection to 192.168.1.10 on port 502. The MBAP header (Transaction ID, Protocol ID 0x0000, Length 6, Unit ID 1) is transmitted. The M580 replies with standard Modbus TCP PDU responses. High-speed 100Mbps telemetry streaming is fully operational!',
    technicianTip: 'Enable Keep-Alive packets (2000ms) to prevent timeout resets on harsh industrial subnets.',
    expectedLedState: 'ETH ACT: Rapid Amber Blinking (Packets Transmitting) • All Systems Nominal',
    signalAnimation: 'DATA_FLOW'
  }
];

export const WiringSchematicTab: React.FC = () => {
  const { isNightShift, palette } = useNightShift();

  const [activeInterface, setActiveInterface] = useState<InterfaceMode>('USB_B');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(true);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(3500);
  const [inspectedHotspot, setInspectedHotspot] = useState<string | null>(null);

  const steps = activeInterface === 'USB_B' ? USB_STEPS : RJ45_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-play step sequence
  useEffect(() => {
    if (!isPlayingSequence) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, playbackSpeedMs);

    return () => clearInterval(timer);
  }, [isPlayingSequence, playbackSpeedMs, steps.length]);

  // Reset step index when changing interface
  const handleSwitchInterface = (mode: InterfaceMode) => {
    setActiveInterface(mode);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    setIsPlayingSequence(false);
    setCurrentStepIndex((prev) => (prev + 1) % steps.length);
  };

  const handlePrevStep = () => {
    setIsPlayingSequence(false);
    setCurrentStepIndex((prev) => (prev - 1 + steps.length) % steps.length);
  };

  // Color variables for night shift
  const containerBg = isNightShift ? 'bg-black' : 'bg-slate-950';
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
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Header Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${containerBg} ${cardBorder} shadow-2xl transition-colors`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              activeInterface === 'USB_B'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              <Cable className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${accentColor}`}>
                  SCHNEIDER MODICON M580 WIRING SCHEMATICS & CONNECTION SEQUENCES
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-900 border border-slate-700 text-slate-300">
                  FIELD TECHNICIAN GUIDE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive physical layer schematics, animated connection walkthroughs, and EIA/TIA pinout diagrams for USB-B vs RJ-45 Ethernet interfaces.
              </p>
            </div>
          </div>

          {/* Interface Selector Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchInterface('USB_B')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeInterface === 'USB_B'
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>USB-B Interface (Serial OTG)</span>
            </button>

            <button
              onClick={() => handleSwitchInterface('RJ45')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeInterface === 'RJ45'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>RJ-45 Interface (Modbus TCP)</span>
            </button>
          </div>
        </div>

        {/* Quick Interface Specifications Summary */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Interface Target</span>
            <span className="font-bold text-white text-xs">
              {activeInterface === 'USB_B' ? 'M580 Front Diagnostic USB-B' : 'M580 Dual ETH1 / Service Port'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Protocol / Framing</span>
            <span className="font-bold text-emerald-400 text-xs">
              {activeInterface === 'USB_B' ? 'Modbus RTU over CDC-ACM (19.2k)' : 'Native Modbus TCP (Port 502)'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Max Recommended Length</span>
            <span className="font-bold text-amber-400 text-xs">
              {activeInterface === 'USB_B' ? '3.0 meters (9.8 ft) Shielded' : '100 meters (328 ft) CAT6A'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Grounding / Noise Shield</span>
            <span className="font-bold text-sky-400 text-xs">
              {activeInterface === 'USB_B' ? 'Dual Ferrite Choke + Drain Wire' : '360° S/FTP Metal Shell to Chassis'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram & Animation Section */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${containerBg} ${cardBorder} shadow-2xl space-y-5`}>
        
        {/* Step Sequence Player Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step {currentStep.id} of {steps.length}:
            </span>
            <span className="text-sm font-bold text-white">
              {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Play / Next */}
            <button
              onClick={handlePrevStep}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlayingSequence(!isPlayingSequence)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                isPlayingSequence
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-slate-950 font-black border-emerald-400'
              }`}
            >
              {isPlayingSequence ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingSequence ? 'Pause Sequence' : 'Auto-Play Sequence'}</span>
            </button>

            <button
              onClick={handleNextStep}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlayingSequence(true);
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Restart Sequence"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlayingSequence(false);
              }}
              className={`p-2 rounded-lg text-left transition border text-xs ${
                currentStepIndex === idx
                  ? activeInterface === 'USB_B'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md'
                  : currentStepIndex > idx
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                  : 'bg-slate-950 border-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px]">
                <span>STEP {step.id}</span>
                {currentStepIndex > idx && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="truncate text-[11px] mt-0.5 font-semibold">
                {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
              </div>
            </button>
          ))}
        </div>

        {/* ANIMATED SCHEMATIC CANVAS: Technician Device <---> Cable <---> Schneider M580 Rack */}
        <div className="relative rounded-2xl bg-black border-2 border-slate-800 p-4 sm:p-6 overflow-hidden min-h-[360px] flex flex-col justify-between select-none">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Canvas Top Status */}
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Simulated Signal Engine: <strong>{currentStep.signalAnimation}</strong></span>
            </span>

            <span className="text-slate-400 text-[11px]">
              Expected PLC LEDs: <strong className="text-emerald-400 font-mono">{currentStep.expectedLedState}</strong>
            </span>
          </div>

          {/* SVG Animated Diagram */}
          <div className="relative z-10 py-6 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
            
            {/* Left: Technician Android Handheld Device */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 sm:w-48 h-64 sm:h-72 rounded-2xl bg-slate-900 border-4 border-slate-700 p-2 shadow-2xl flex flex-col justify-between">
                {/* Top Speaker & Sensor */}
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />
                
                {/* Screen Content */}
                <div className="flex-1 my-2 rounded-xl bg-slate-950 p-2.5 border border-slate-800 flex flex-col justify-between text-[10px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400 font-bold">SCHNEIDER HMI</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      {activeInterface === 'USB_B' ? <Zap className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                    </div>
                    <div className="font-bold text-white text-[11px]">
                      {activeInterface === 'USB_B' ? 'USB OTG Host' : 'Ethernet NIC'}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {activeInterface === 'USB_B' ? 'CDC-ACM 19200,E,8,1' : 'IP: 192.168.1.50'}
                    </div>
                  </div>

                  {/* Status Banner inside phone */}
                  <div className={`p-1.5 rounded text-center font-bold text-[9px] ${
                    currentStep.id >= 4
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}>
                    {currentStep.id >= 4 ? 'LINK ESTABLISHED' : 'STANDBY WAITING'}
                  </div>
                </div>

                {/* Bottom USB-C Port Indicator */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-1.5 bg-slate-600 rounded-sm" />
                  <span className="text-[9px] text-slate-500 mt-0.5">USB-C Receptacle</span>
                </div>
              </div>

              <span className="mt-2 text-xs font-bold text-slate-300">
                Technician Rugged Android Tablet
              </span>
            </div>

            {/* Middle: Animated Cable & Signal Transmission Line */}
            <div className="flex-1 w-full flex flex-col items-center justify-center relative px-2">
              <div className="w-full flex flex-col items-center">
                {/* Cable Label */}
                <div className="mb-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shadow-md">
                  <Cable className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeInterface === 'USB_B' 
                      ? 'USB-C to Type-B Shielded Cable (TSXCRJMD25)' 
                      : 'CAT6A S/FTP Industrial Patch Cord (EIA/TIA 568B)'}
                  </span>
                </div>

                {/* Animated Flow Line */}
                <div className="relative w-full h-8 flex items-center justify-center">
                  {/* Base Wire Path */}
                  <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700 relative overflow-hidden">
                    {/* Animated Data Particles */}
                    {(currentStep.id >= 4 || isPlayingSequence) && (
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                        activeInterface === 'USB_B' ? 'via-emerald-400' : 'via-blue-400'
                      } to-transparent animate-shimmer`} />
                    )}
                  </div>

                  {/* Flow Particles */}
                  {currentStep.id >= 4 && (
                    <div className="absolute flex gap-16 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400" />
                    </div>
                  )}
                </div>

                {/* Cable Wire Core Breakdown badge */}
                <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                  {activeInterface === 'USB_B' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" title="VBUS +5V" />
                      <span className="text-red-400 font-bold">VBUS</span>
                      <span className="w-2 h-2 rounded-full bg-white" title="D- Data" />
                      <span className="text-white font-bold">D-</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="D+ Data" />
                      <span className="text-emerald-400 font-bold">D+</span>
                      <span className="w-2 h-2 rounded-full bg-slate-500" title="GND Ground" />
                      <span className="text-slate-400 font-bold">GND</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" title="TX+" />
                      <span className="text-orange-400 font-bold">TX+</span>
                      <span className="w-2 h-2 rounded-full bg-orange-700" title="TX-" />
                      <span className="text-orange-500 font-bold">TX-</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="RX+" />
                      <span className="text-emerald-400 font-bold">RX+</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-700" title="RX-" />
                      <span className="text-emerald-500 font-bold">RX-</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Schneider Modicon M580 ePAC Controller Rack */}
            <div className="flex flex-col items-center">
              <div className="relative w-52 sm:w-60 h-72 rounded-2xl bg-slate-900 border-4 border-slate-600 p-2.5 shadow-2xl flex flex-col justify-between">
                {/* M580 Header Brand */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span className="font-extrabold text-[11px] text-white tracking-wider">Schneider</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Modicon M580
                  </span>
                </div>

                {/* M580 LED Status Panel */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[9px] font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${currentStep.id >= 1 ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`} />
                    <span className="text-slate-400 text-[8px] mt-0.5">PWR</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${currentStep.id >= 1 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-slate-400 text-[8px] mt-0.5">RUN</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                    <span className="text-slate-400 text-[8px] mt-0.5">ERR</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${currentStep.id >= 4 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className="text-slate-400 text-[8px] mt-0.5">STS</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${currentStep.id >= 3 && activeInterface === 'RJ45' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className="text-slate-400 text-[8px] mt-0.5">LINK</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full ${currentStep.id >= 4 && activeInterface === 'RJ45' ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                    <span className="text-slate-400 text-[8px] mt-0.5">ACT</span>
                  </div>
                </div>

                {/* Front Port Panel Receptacle */}
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-2">
                  {/* USB-B Diagnostic Port */}
                  <div 
                    onClick={() => setInspectedHotspot('USB_PORT')}
                    className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      activeInterface === 'USB_B'
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold text-white">USB-B Diagnostic Port</span>
                    </div>
                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1 rounded">19.2k RTU</span>
                  </div>

                  {/* Dual RJ-45 Ethernet Ports */}
                  <div 
                    onClick={() => setInspectedHotspot('RJ45_PORTS')}
                    className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      activeInterface === 'RJ45'
                        ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <Wifi className="w-3 h-3 text-blue-400" />
                      <span className="font-bold text-white">Dual ETH / Service Port</span>
                    </div>
                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1 rounded">502 TCP</span>
                  </div>
                </div>

                {/* Grounding & Chassis Lug */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>BMXXBP Rack Ground: OK</span>
                  <span className="text-emerald-400 font-bold">24V DC</span>
                </div>
              </div>

              <span className="mt-2 text-xs font-bold text-white">
                Schneider Modicon M580 (BMEP582040)
              </span>
            </div>
          </div>

          {/* Interactive Step Narrative & Field Action Bar */}
          <div className="relative z-10 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {currentStep.subtitle}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans sm:font-mono">
                  {currentStep.instruction}
                </p>
              </div>

              <div className="shrink-0 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] max-w-xs space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Technician Field Tip:
                </span>
                <p className="text-[10px] text-slate-300 leading-normal">
                  {currentStep.technicianTip}
                </p>
              </div>
            </div>

            {currentStep.safetyWarning && (
              <div className="mt-2 pt-2 border-t border-red-900/40 flex items-center gap-2 text-red-300 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                <span><strong>Safety Protocol:</strong> {currentStep.safetyWarning}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interface Pinout & Technical Specifications Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: USB-B Pinout & Electrical Specs */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${containerBg} ${cardBorder} shadow-lg space-y-3`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                USB Type-B Female Diagnostic Port Pinout
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              EIA USB 2.0 Full-Speed
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The M580 CPU front port uses a standard USB Type-B or Mini-B connector. Internal optocouplers isolate the serial logic from field noise.
          </p>

          {/* Pinout Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <th className="p-2">Pin #</th>
                  <th className="p-2">Signal</th>
                  <th className="p-2">Wire Color</th>
                  <th className="p-2">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-white">Pin 1</td>
                  <td className="p-2 text-red-400 font-bold">VBUS</td>
                  <td className="p-2 text-slate-300">Red (+5V DC)</td>
                  <td className="p-2 text-slate-400">Power detection from Android host</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 2</td>
                  <td className="p-2 text-white font-bold">D-</td>
                  <td className="p-2 text-slate-300">White (Data -)</td>
                  <td className="p-2 text-slate-400">Differential serial data line minus</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 3</td>
                  <td className="p-2 text-emerald-400 font-bold">D+</td>
                  <td className="p-2 text-slate-300">Green (Data +)</td>
                  <td className="p-2 text-slate-400">Differential serial data line plus</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 4</td>
                  <td className="p-2 text-slate-400 font-bold">GND</td>
                  <td className="p-2 text-slate-300">Black (0V Ref)</td>
                  <td className="p-2 text-slate-400">Signal ground reference</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Shell</td>
                  <td className="p-2 text-sky-400 font-bold">SHIELD</td>
                  <td className="p-2 text-slate-300">Braided Metal</td>
                  <td className="p-2 text-slate-400">Connects to M580 ground lug clamp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: RJ-45 Pinout & T568B Color Code */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${containerBg} ${cardBorder} shadow-lg space-y-3`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                RJ-45 Ethernet Port Pinout (T568B Standard)
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
              100BASE-TX / 1000BASE-T
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The M580 Ethernet ports support Auto-MDIX. Recommended wiring follows EIA/TIA T568B with continuous grounded drain shielding.
          </p>

          {/* Pinout Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <th className="p-2">Pin #</th>
                  <th className="p-2">Signal</th>
                  <th className="p-2">T568B Wire Color</th>
                  <th className="p-2">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-white">Pin 1</td>
                  <td className="p-2 text-orange-400 font-bold">TX_D1+</td>
                  <td className="p-2 text-orange-300 font-semibold">White / Orange</td>
                  <td className="p-2 text-slate-400">Transmit Differential Pair +</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 2</td>
                  <td className="p-2 text-orange-500 font-bold">TX_D1-</td>
                  <td className="p-2 text-orange-400 font-semibold">Solid Orange</td>
                  <td className="p-2 text-slate-400">Transmit Differential Pair -</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 3</td>
                  <td className="p-2 text-emerald-400 font-bold">RX_D2+</td>
                  <td className="p-2 text-emerald-300 font-semibold">White / Green</td>
                  <td className="p-2 text-slate-400">Receive Differential Pair +</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pin 6</td>
                  <td className="p-2 text-emerald-500 font-bold">RX_D2-</td>
                  <td className="p-2 text-emerald-400 font-semibold">Solid Green</td>
                  <td className="p-2 text-slate-400">Receive Differential Pair -</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-white">Pins 4,5,7,8</td>
                  <td className="p-2 text-blue-400 font-bold">D3 / D4</td>
                  <td className="p-2 text-blue-300 font-semibold">Blue / Brown Pairs</td>
                  <td className="p-2 text-slate-400">Gigabit bidirectional signaling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Field Troubleshooting & Common Faults Matrix */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${containerBg} ${cardBorder} shadow-lg space-y-3`}>
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            Field Technician Troubleshooting: Common M580 Connection Faults
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>No Android USB Prompt</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Symptom:</strong> Cable connected, but Android does not prompt for USB permissions.
            </p>
            <p className="text-slate-400 text-[10px]">
              <strong>Solution:</strong> Verify Android OTG is toggled ON in system settings. Inspect cable for missing D+/D- lines (charge-only cable fault).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Ethernet Link LED Dark</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Symptom:</strong> RJ-45 inserted into M580, but green LINK LED does not illuminate.
            </p>
            <p className="text-slate-400 text-[10px]">
              <strong>Solution:</strong> Check USB-C adapter compatibility (Realtek RTL8153 required). Verify pins 1, 2, 3, and 6 continuity on cable tester.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Modbus 0xFE Timeout</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Symptom:</strong> IP pings OK, but Modbus requests time out after 2000ms.
            </p>
            <p className="text-slate-400 text-[10px]">
              <strong>Solution:</strong> Verify Unit ID is set to 1 or 255 (M580 gateway). Ensure port 502 is not blocked by local switch firewall rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
