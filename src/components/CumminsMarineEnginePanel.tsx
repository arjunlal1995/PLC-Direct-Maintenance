import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Cpu, 
  Zap, 
  FileText, 
  Sliders, 
  Download, 
  ArrowRight,
  Info,
  Radio,
  Lock,
  Unlock,
  AlertOctagon,
  Layers,
  Thermometer,
  Disc,
  Play
} from 'lucide-react';
import { audioAlerts } from '../utils/audioAlerts';

interface CumminsMarineEnginePanelProps {
  onOpenDownloadModal?: () => void;
}

export const CumminsMarineEnginePanel: React.FC<CumminsMarineEnginePanelProps> = ({
  onOpenDownloadModal
}) => {
  // Live simulated or polled telemetry matching the 10 sensors
  const [telemetry, setTelemetry] = useState({
    engineRpm: 1450,
    lubOilTemp: 84.5,
    lubOilPress: 4.2,
    turningGearEngaged: false,
    seaWaterPress: 2.1,
    fuelPress: 5.8,
    coolingWaterTemp: 82.0,
    exhaustTempLb: 410,
    exhaustTempRb: 425,
    lowCoolantLevel: false,
    batteryVolts: 24.2,
    runningHours: 3412.8
  });

  // 7 Safety Interlocks State
  const [interlocks, setInterlocks] = useState([
    {
      id: 1,
      name: 'TURNING GEAR DISENGAGED',
      condition: 'Engine start prevented if turning gear engaged (Switch 4368842)',
      active: false, // false = healthy (disengaged)
      tag: '%I0.2.0',
      pin: 'J14 Pin N',
      interlocked: false
    },
    {
      id: 2,
      name: 'LOCAL / REMOTE MODE ISOLATION',
      condition: 'Remote start prohibited when local control switch is engaged',
      active: false,
      tag: '%I0.2.1',
      pin: 'X9 Pin 1-2',
      interlocked: false
    },
    {
      id: 3,
      name: 'SAFETY DEVICE TRIP RESET LATCH',
      condition: 'If any safety device operated, latch must be reset before restart',
      active: false,
      tag: '%M20_SAFETY_LATCH',
      pin: 'Internal Memory',
      interlocked: false
    },
    {
      id: 4,
      name: 'EXPANSION TANK WATER LEVEL',
      condition: 'Low fresh water level in expansion tank prevents engine start (Switch 4383931)',
      active: false,
      tag: '%I0.2.2',
      pin: 'J14 Pin M',
      interlocked: false
    },
    {
      id: 5,
      name: 'SAFETY SHUTDOWN ACTIVE LATCH',
      condition: 'Any shutdown condition must be explicitly acknowledged and reset',
      active: false,
      tag: '%M21_SHUTDOWN_LATCH',
      pin: 'Internal Memory',
      interlocked: false
    },
    {
      id: 6,
      name: 'EMERGENCY STOP LOOP CONTINUITY',
      condition: 'Emergency Stop pushbuttons (Local Panel & Remote Bridge)',
      active: false, // false = closed healthy NC circuit
      tag: '%I0.2.3 (NC)',
      pin: 'X9 Pin 3-4',
      interlocked: false
    },
    {
      id: 7,
      name: 'MARINE GEARBOX / CLUTCH IN NEUTRAL',
      condition: 'Engine start prohibited when clutch is engaged (not in neutral)',
      active: false,
      tag: '%I0.2.4',
      pin: 'J7 Pin D',
      interlocked: false
    }
  ]);

  const [activeTab, setActiveTab] = useState<'INSTRUMENTATION' | 'INTERLOCKS' | 'BOM' | 'WIRING'>('INSTRUMENTATION');
  const [tripStatus, setTripStatus] = useState<string | null>(null);

  // Periodic fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const rpmNoise = (Math.random() - 0.5) * 8;
        const pressNoise = (Math.random() - 0.5) * 0.05;
        const tempNoise = (Math.random() - 0.5) * 0.2;

        return {
          ...prev,
          engineRpm: Math.max(0, Math.round(prev.engineRpm + rpmNoise)),
          lubOilPress: Number(Math.max(0, prev.lubOilPress + pressNoise).toFixed(2)),
          seaWaterPress: Number(Math.max(0, prev.seaWaterPress + pressNoise).toFixed(2)),
          lubOilTemp: Number((prev.lubOilTemp + tempNoise).toFixed(1)),
          coolingWaterTemp: Number((prev.coolingWaterTemp + tempNoise).toFixed(1)),
          exhaustTempLb: Math.round(prev.exhaustTempLb + (Math.random() - 0.5) * 3),
          exhaustTempRb: Math.round(prev.exhaustTempRb + (Math.random() - 0.5) * 3),
        };
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  // Sensor definitions from Cummins Instrumentation List Drawing 6453449 & A067B091
  const sensors = [
    {
      srNo: 1,
      name: 'Engine Speed (MPU)',
      partNo: '4912304',
      location: 'Flywheel housing (142 Teeth)',
      signal: 'Frequency / Astronic F-I',
      value: telemetry.engineRpm,
      unit: 'RPM',
      range: '0 - 2000 RPM',
      alarm: null,
      trip: 1980,
      isTrip: telemetry.engineRpm >= 1980,
      isAlarm: false,
      modbus: '%MW0 (30001)'
    },
    {
      srNo: 2,
      name: 'Lub Oil Temperature',
      partNo: '4963242',
      location: 'Lub Oil Pan',
      signal: '4-20 mA via TM3AI8G',
      value: telemetry.lubOilTemp,
      unit: '°C',
      range: '0 - 150 °C',
      alarm: 121,
      trip: 125,
      isTrip: telemetry.lubOilTemp >= 125,
      isAlarm: telemetry.lubOilTemp >= 121,
      modbus: '%MW1 (30002)'
    },
    {
      srNo: 3,
      name: 'Lub Oil Pressure',
      partNo: '5543059 / Switch 4962856',
      location: 'Main Oil Gallery',
      signal: '4-20 mA via TM3AI8G',
      value: telemetry.lubOilPress,
      unit: 'bar',
      range: '0 - 16 bar',
      alarm: 1.2,
      trip: 0.8,
      isTrip: telemetry.lubOilPress <= 0.8,
      isAlarm: telemetry.lubOilPress <= 1.2,
      modbus: '%MW2 (30003)'
    },
    {
      srNo: 4,
      name: 'Turning Gear Engaged Interlock',
      partNo: '4368842',
      location: 'Flywheel Housing',
      signal: 'DI NO/NC via TM3DI8G',
      value: telemetry.turningGearEngaged ? 'ENGAGED (INHIBIT)' : 'DISENGAGED (SAFE)',
      unit: '',
      range: 'Digital',
      alarm: null,
      trip: null,
      isTrip: telemetry.turningGearEngaged,
      isAlarm: false,
      modbus: '%M10 (10001)'
    },
    {
      srNo: 5,
      name: 'Sea Water Pressure',
      partNo: '5543058',
      location: 'Sea water system',
      signal: '4-20 mA via TM3AI8G',
      value: telemetry.seaWaterPress,
      unit: 'bar',
      range: '0 - 6 bar',
      alarm: 0.8,
      trip: null,
      isTrip: false,
      isAlarm: telemetry.seaWaterPress <= 0.8,
      modbus: '%MW3 (30004)'
    },
    {
      srNo: 6,
      name: 'Fuel Pressure',
      partNo: '5543059',
      location: 'Fuel system header',
      signal: '4-20 mA via TM3AI8G',
      value: telemetry.fuelPress,
      unit: 'bar',
      range: '0 - 16 bar',
      alarm: null,
      trip: null,
      isTrip: false,
      isAlarm: false,
      modbus: '%MW4 (30005)'
    },
    {
      srNo: 7,
      name: 'Cooling Water Temperature',
      partNo: '4963242 / Switch 4962857',
      location: 'Engine cooling jacket',
      signal: '4-20 mA via TM3AI8G',
      value: telemetry.coolingWaterTemp,
      unit: '°C',
      range: '0 - 150 °C',
      alarm: 92,
      trip: 97,
      isTrip: telemetry.coolingWaterTemp >= 97,
      isAlarm: telemetry.coolingWaterTemp >= 92,
      modbus: '%MW5 (30006)'
    },
    {
      srNo: 8,
      name: 'Exhaust Temp Left Bank',
      partNo: '4911878',
      location: 'Exhaust Elbow (Left Bank)',
      signal: 'CR-AL Thermocouple via TM3TI4G',
      value: telemetry.exhaustTempLb,
      unit: '°C',
      range: '0 - 800 °C',
      alarm: 550,
      trip: null,
      isTrip: false,
      isAlarm: telemetry.exhaustTempLb >= 550,
      modbus: '%MW6 (30007)'
    },
    {
      srNo: 9,
      name: 'Exhaust Temp Right Bank',
      partNo: '4911878',
      location: 'Exhaust Elbow (Right Bank)',
      signal: 'CR-AL Thermocouple via TM3TI4G',
      value: telemetry.exhaustTempRb,
      unit: '°C',
      range: '0 - 800 °C',
      alarm: 550,
      trip: null,
      isTrip: false,
      isAlarm: telemetry.exhaustTempRb >= 550,
      modbus: '%MW7 (30008)'
    },
    {
      srNo: 10,
      name: 'Low Coolant Level Switch',
      partNo: '4383931',
      location: 'Fresh Water Expansion Tank',
      signal: 'Active High DI via TM3DI8G',
      value: telemetry.lowCoolantLevel ? 'LOW LEVEL ALARM' : 'NORMAL LEVEL',
      unit: '',
      range: 'Active High',
      alarm: null,
      trip: null,
      isTrip: false,
      isAlarm: telemetry.lowCoolantLevel,
      modbus: '%M12 (10002)'
    }
  ];

  // Bill of Materials from Drawing A067B091 Sheets 5 & 6 (Accurate Industrial Controls)
  const bomItems = [
    { no: 1, desc: 'HMI 7-Inch Color Touchscreen', make: 'Schneider Electric', catNo: 'HMIGTO3510', qty: 1, unit: 'EA' },
    { no: 2, desc: 'PLC CPU (Modicon M241 with Ethernet/CANopen)', make: 'Schneider Electric', catNo: 'TM241CEC24U', qty: 1, unit: 'EA' },
    { no: 3, desc: 'Digital Input Module (8 Channels)', make: 'Schneider Electric', catNo: 'TM3DI8G', qty: 1, unit: 'EA' },
    { no: 4, desc: 'Digital Output Module (8 Channels Transistor)', make: 'Schneider Electric', catNo: 'TM3DQ8TG', qty: 1, unit: 'EA' },
    { no: 5, desc: 'Analog Input Module (8 Channels 4-20mA)', make: 'Schneider Electric', catNo: 'TM3AI8G', qty: 1, unit: 'EA' },
    { no: 6, desc: 'RTD / Thermocouple Module (4 Channels)', make: 'Schneider Electric', catNo: 'TM3TI4G', qty: 1, unit: 'EA' },
    { no: 7, desc: 'Ammeter 72x72 24VDC 0-30A', make: 'Rishabh Instruments', catNo: 'PQ71', qty: 1, unit: 'EA' },
    { no: 8, desc: 'Digital Hour Meter 48x48 10-80 VDC Flush Mount', make: 'GIC', catNo: 'LD17F1', qty: 1, unit: 'EA' },
    { no: 27, desc: 'Battery Charger 230VAC to 24VDC 10A Supply', make: 'Phoenix Contact', catNo: 'QUINT-PS/3AC/24DC/10 (2866763)', qty: 1, unit: 'EA' },
    { no: 28, desc: 'Redundancy Diode Module 12-24VDC 2x10A/1x20A', make: 'Phoenix Contact', catNo: 'TRIO-DIODE (2866514)', qty: 1, unit: 'EA' },
    { no: 29, desc: 'Sealed Maintenance Free Batteries 12V 7.2Ah SMF', make: 'Exide', catNo: '12V DC, 7.2 AH (Dual Series 24V)', qty: 2, unit: 'EA' },
    { no: 47, desc: 'Frequency to Pulse Converter (MPU speed)', make: 'Astronic', catNo: 'F/I CONVERTER', qty: 1, unit: 'EA' }
  ];

  const handleToggleInterlock = (id: number) => {
    setInterlocks(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.active;
        if (nextState) {
          audioAlerts.playWarningBeep();
        } else {
          audioAlerts.playAckBlip();
        }
        return { ...item, active: nextState };
      }
      return item;
    }));
  };

  const handleSimulateOverspeed = () => {
    setTelemetry(prev => ({ ...prev, engineRpm: 2010 }));
    setTripStatus('OVERSPEED TRIP ACTIVATED: 2010 RPM (Threshold: 1980 RPM)');
    audioAlerts.playCriticalSiren();
  };

  const handleSimulateLowOil = () => {
    setTelemetry(prev => ({ ...prev, lubOilPress: 0.65 }));
    setTripStatus('VERY LOW LUB OIL PRESSURE TRIP: 0.65 bar (Trip Switch 4962856 tripped)');
    audioAlerts.playCriticalSiren();
  };

  const handleResetTrips = () => {
    setTelemetry(prev => ({
      ...prev,
      engineRpm: 1450,
      lubOilPress: 4.2,
      coolingWaterTemp: 82.0,
      turningGearEngaged: false
    }));
    setInterlocks(prev => prev.map(i => ({ ...i, active: false })));
    setTripStatus(null);
    audioAlerts.playAckBlip();
  };

  const anyInterlockActive = interlocks.some(i => i.active);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Cummins Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/40 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-red-600 text-white font-black font-mono text-lg shadow-lg shadow-red-600/30">
              CUMMINS
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white">
                  MARINE LOCAL CONTROL PANEL (YD 305/307) & BAJRANG MAIN ENGINE
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                  Drawing A067B091 & 6453449
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Direct hardware telemetry mappings for Cummins Marine Genset & Propulsion Engine: 10 sensors, 7 safety interlocks, and Schneider Modicon TM241 / HMIGTO3510 BOM specifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Specific Files</span>
              </button>
            )}

            <button
              onClick={handleResetTrips}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reset Safety Latches</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner if Trip Active */}
        {tripStatus && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-mono flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
              <span><strong>EMERGENCY TRIP ACTIVE:</strong> {tripStatus}</span>
            </div>
            <button
              onClick={handleResetTrips}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
            >
              Acknowledge & Reset
            </button>
          </div>
        )}
      </div>

      {/* Subtab Selector */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('INSTRUMENTATION')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'INSTRUMENTATION'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>1. 10 Engine Sensors (Live Telemetry & Part Numbers)</span>
        </button>

        <button
          onClick={() => setActiveTab('INTERLOCKS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'INTERLOCKS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>2. 7 Safety Interlocks ({anyInterlockActive ? 'INTERLOCKED' : 'ALL CLEAR'})</span>
        </button>

        <button
          onClick={() => setActiveTab('BOM')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'BOM'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>3. Schneider TM241 & Accurate BOM (A067B091)</span>
        </button>

        <button
          onClick={() => setActiveTab('WIRING')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'WIRING'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>4. Amphenol MS3102R Connectors & Pinouts</span>
        </button>
      </div>

      {/* 1. INSTRUMENTATION LIST VIEW */}
      {activeTab === 'INSTRUMENTATION' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">
              Sensor readings refreshed live. Part numbers verified from Cummins Bajrang Main Engine sheet.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateOverspeed}
                className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 text-[11px] font-bold transition"
              >
                Test Overspeed (1980 RPM)
              </button>
              <button
                onClick={handleSimulateLowOil}
                className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-[11px] font-bold transition"
              >
                Test Low Oil Trip (0.8 Bar)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sensors.map((s) => (
              <div
                key={s.srNo}
                className={`p-4 rounded-xl border transition-all ${
                  s.isTrip
                    ? 'bg-red-950/50 border-red-500 ring-1 ring-red-500/50'
                    : s.isAlarm
                    ? 'bg-amber-950/40 border-amber-500'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      CH #{s.srNo} • {s.modbus}
                    </span>
                    <h4 className="text-sm font-bold font-mono text-white leading-snug">
                      {s.name}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    s.isTrip
                      ? 'bg-red-500 text-white animate-pulse'
                      : s.isAlarm
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {s.isTrip ? 'TRIPPED' : s.isAlarm ? 'ALARM' : 'NORMAL'}
                  </span>
                </div>

                {/* Primary Metric Gauge */}
                <div className="my-3 flex items-baseline justify-between">
                  <div className="text-2xl font-black font-mono text-white">
                    {s.value} <span className="text-xs text-slate-400 font-normal">{s.unit}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Range: {s.range}
                  </span>
                </div>

                {/* Metadata & Thresholds */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cummins Part:</span>
                    <strong className="text-amber-300">{s.partNo}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Mounting:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{s.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Alarm / Trip:</span>
                    <span className="text-slate-300">
                      {s.alarm ? `Alarm: ${s.alarm} ${s.unit}` : 'Alarm: N/A'} | {s.trip ? `Trip: ${s.trip} ${s.unit}` : 'Trip: N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SAFETY INTERLOCKS VIEW */}
      {activeTab === 'INTERLOCKS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h4 className="text-sm font-bold font-mono text-white mb-2">
              7 SAFETY INTERLOCKS (DRAWING 6453449 & A067B091)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The control logic strictly prevents the engine from starting under any of these 7 critical safety conditions. Tap any interlock to simulate or test field wiring response.
            </p>

            <div className="space-y-2.5">
              {interlocks.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    item.active
                      ? 'bg-red-950/40 border-red-500/70'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleInterlock(item.id)}
                      className={`p-2 rounded-lg border mt-0.5 transition ${
                        item.active 
                          ? 'bg-red-500/20 border-red-500 text-red-400' 
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      }`}
                      title="Toggle simulated interlock state"
                    >
                      {item.active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-white">
                          #{item.id}. {item.name}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                          item.active ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {item.active ? 'PREVENTING START (INTERLOCKED)' : 'CLEAR / READY'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.condition}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                        <span>Tag: <strong className="text-sky-300">{item.tag}</strong></span>
                        <span>Terminal/Pin: <strong className="text-amber-300">{item.pin}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleInterlock(item.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition shrink-0 ${
                      item.active
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.active ? 'Reset Interlock' : 'Test Inhibit'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. ACCURATE INDUSTRIAL CONTROLS BOM VIEW */}
      {activeTab === 'BOM' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold font-mono text-white">
                  DESIGN BOM FOR HMLD PANEL (A067B091)
                </h4>
                <p className="text-xs text-slate-400">
                  Customer: Cummins India Ltd | Accurate Industrial Controls Pvt Ltd
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                Drawing No: AICPL-P&A-2122-WO84-02-CIL-Marine LCP-GA-R1
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">S.No</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Make</th>
                    <th className="py-2.5 px-3">Type / Cat No.</th>
                    <th className="py-2.5 px-3">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bomItems.map((b) => (
                    <tr key={b.no} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400">#{b.no}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{b.desc}</td>
                      <td className="py-2.5 px-3 text-sky-400">{b.make}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">{b.catNo}</td>
                      <td className="py-2.5 px-3 text-slate-300">{b.qty} {b.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. WIRING & AMPHENOL CONNECTORS VIEW */}
      {activeTab === 'WIRING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold font-mono text-white">
            AMPHENOL MS3102R MIL-SPEC CONNECTORS & PINOUT GUIDE (DRAWING 6453449)
          </h4>
          <p className="text-xs text-slate-400">
            Junction Box (Part 5580514) on Engine to Local Control Panel (Part 4348239)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold flex items-center gap-2">
                <Disc className="w-4 h-4" />
                <span>J14 / X14 (MS3102R 24-28S - 24 Pin Sensor Loom)</span>
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                <li>Pin A-B: Coolant Temp Transmitter (4963242)</li>
                <li>Pin C-D: Lub Oil Temp Transmitter (4963242)</li>
                <li>Pin E-F: Lub Oil Press Transmitter (5543059)</li>
                <li>Pin G-H: Sea Water Press Transmitter (5543058)</li>
                <li>Pin M: Low Coolant Level Switch in Expansion Tank (4383931)</li>
                <li>Pin N: Turning Gear Engaged Interlock Switch (4368842)</li>
                <li>Pin U-V: Fuel Shutoff Solenoid Valve</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-sky-400 font-bold flex items-center gap-2">
                <Disc className="w-4 h-4" />
                <span>J12 / X12 & J13 / X13 (Engine Speed & Starter)</span>
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                <li>J12 (MS3102R 14S-6P): Magnetic Pickup Unit (MPU 4912304) to F/I Converter</li>
                <li>J13 (MS3102R 32-8S): Engine Start Command (Starter Solenoid / Air Starter)</li>
                <li>J5 / X5 (MS3102R 28A-51P): Master 51-Pin Engine Harness Loom</li>
                <li>J7 / X7 (MS3102R 28-12PW): Clutch Neutral Interlock (Pin D) & Control Oil</li>
                <li>Remote X9: 21-Core Cable to Yard / Bridge Remote Control Panel (4396642)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
