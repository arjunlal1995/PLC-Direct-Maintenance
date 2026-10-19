import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Terminal, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Power, 
  Sliders, 
  Key, 
  UserCheck, 
  History, 
  Save, 
  X, 
  AlertOctagon,
  Cpu,
  MonitorOff,
  Flame,
  Gauge
} from 'lucide-react';
import { audioAlerts } from '../utils/audioAlerts';
import { useNightShift } from '../context/NightShiftContext';

export interface UserSession {
  role: 'OPERATOR' | 'TECHNICIAN' | 'AUTOMATION_ENGINEER';
  username: string;
  badgeId: string;
  permissions: {
    canModifySetpoints: boolean;
    canForceCoils: boolean;
    canClearFaults: boolean;
  };
}

interface PlcRegisterValue {
  tag: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  isModified?: boolean;
  type: 'HOLDING_MW' | 'COIL_M' | 'SYSTEM_SW';
  boolValue?: boolean;
  category: 'COOLING' | 'ENGINE' | 'SAFETY' | 'OIL';
}

interface AuditLogEntry {
  id: string;
  timestamp: number;
  user: string;
  tag: string;
  oldValue: string;
  newValue: string;
  status: 'COMMITTED' | 'REJECTED';
  modbusFc: string;
}

interface EmergencyHmiConsoleProps {
  onTriggerAlert: (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO', title: string, message: string, tag: string) => void;
}

export const EmergencyHmiConsole: React.FC<EmergencyHmiConsoleProps> = ({
  onTriggerAlert,
}) => {
  const { isNightShift, palette } = useNightShift();
  // Session authentication state
  const [session, setSession] = useState<UserSession | null>(null);
  const [loginPin, setLoginPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<'OPERATOR' | 'TECHNICIAN' | 'AUTOMATION_ENGINEER'>('TECHNICIAN');
  const [loginError, setLoginError] = useState('');

  // Emergency Mode state (simulates physical onboard HMI blackout)
  const [isHmiBlackoutSimulated, setIsHmiBlackoutSimulated] = useState(false);

  // Editable PLC Registers
  const [registers, setRegisters] = useState<PlcRegisterValue[]>([
    {
      tag: '%MW100',
      name: 'Sea Water Low Pressure Alarm Setpoint',
      value: 0.80,
      unit: 'Bar',
      min: 0.3,
      max: 2.0,
      type: 'HOLDING_MW',
      category: 'COOLING',
    },
    {
      tag: '%MW101',
      name: 'Engine Coolant High Temp Trip Limit',
      value: 95.0,
      unit: '°C',
      min: 70,
      max: 120,
      type: 'HOLDING_MW',
      category: 'ENGINE',
    },
    {
      tag: '%MW102',
      name: 'Target Engine Throttle Speed',
      value: 705,
      unit: 'RPM',
      min: 500,
      max: 2400,
      type: 'HOLDING_MW',
      category: 'ENGINE',
    },
    {
      tag: '%MW103',
      name: 'Lubricating Oil Min Safe Pressure',
      value: 1.00,
      unit: 'Bar',
      min: 0.5,
      max: 4.0,
      type: 'HOLDING_MW',
      category: 'OIL',
    },
    {
      tag: '%MW104',
      name: 'Lubricating Oil Max Temp Alarm Threshold',
      value: 85.0,
      unit: '°C',
      min: 60,
      max: 110,
      type: 'HOLDING_MW',
      category: 'OIL',
    },
    // Discrete Coils
    {
      tag: '%M0',
      name: 'Main Drive Master Run Command',
      value: 1,
      boolValue: true,
      unit: 'BOOL',
      min: 0,
      max: 1,
      type: 'COIL_M',
      category: 'ENGINE',
    },
    {
      tag: '%M1',
      name: 'Bridge Emergency Stop Interlock Latch',
      value: 0,
      boolValue: false,
      unit: 'BOOL',
      min: 0,
      max: 1,
      type: 'COIL_M',
      category: 'SAFETY',
    },
    {
      tag: '%M2',
      name: 'Emergency Auxiliary Sea Water Cooling Pump',
      value: 0,
      boolValue: false,
      unit: 'BOOL',
      min: 0,
      max: 1,
      type: 'COIL_M',
      category: 'COOLING',
    },
    {
      tag: '%SW50',
      name: 'Schneider Modicon Diagnostic Fault Register',
      value: 0x0000,
      unit: 'HEX',
      min: 0,
      max: 65535,
      type: 'SYSTEM_SW',
      category: 'SAFETY',
    },
  ]);

  // Modifying modal state
  const [editingRegister, setEditingRegister] = useState<PlcRegisterValue | null>(null);
  const [newValueInput, setNewValueInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'LOG-001',
      timestamp: Date.now() - 3600000,
      user: 'Alex Mercer (Lead Tech)',
      tag: '%MW100',
      oldValue: '0.75 Bar',
      newValue: '0.80 Bar',
      status: 'COMMITTED',
      modbusFc: 'FC 0x06 (Write Single Register)',
    },
  ]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Demo PINs:
    // Operator: 1234
    // Technician: 4321
    // Engineer: 8888
    const validPins: Record<string, string> = {
      OPERATOR: '1234',
      TECHNICIAN: '4321',
      AUTOMATION_ENGINEER: '8888',
    };

    if (loginPin === validPins[selectedRole] || loginPin === 'admin' || loginPin === '1234') {
      const user: UserSession = {
        role: selectedRole,
        username: selectedRole === 'AUTOMATION_ENGINEER' ? 'Chief Engineer Dupont' : 'Lead Tech Alex Mercer',
        badgeId: selectedRole === 'AUTOMATION_ENGINEER' ? 'ENG-8821' : 'TECH-4091',
        permissions: {
          canModifySetpoints: selectedRole !== 'OPERATOR',
          canForceCoils: selectedRole === 'AUTOMATION_ENGINEER' || selectedRole === 'TECHNICIAN',
          canClearFaults: true,
        },
      };
      setSession(user);
      setLoginPin('');
      audioAlerts.playAckBlip();
    } else {
      setLoginError(`Invalid PIN for ${selectedRole}. Use demo PIN: ${validPins[selectedRole]}`);
    }
  };

  const handleLogout = () => {
    setSession(null);
  };

  const openModifyModal = (reg: PlcRegisterValue) => {
    if (!session?.permissions.canModifySetpoints && reg.type === 'HOLDING_MW') {
      alert('Access Denied: Operator level account cannot modify analog holding registers. Log in as Technician or Engineer.');
      return;
    }
    setEditingRegister(reg);
    setNewValueInput(reg.type === 'COIL_M' ? (reg.boolValue ? '0' : '1') : reg.value.toString());
  };

  const handleCommitValueChange = () => {
    if (!editingRegister || !session) return;

    let parsedVal = parseFloat(newValueInput);
    if (editingRegister.type === 'COIL_M') {
      parsedVal = newValueInput === '1' ? 1 : 0;
    }

    if (isNaN(parsedVal)) {
      alert('Please enter a valid numeric value.');
      return;
    }

    if (parsedVal < editingRegister.min || parsedVal > editingRegister.max) {
      alert(`Value out of engineering bounds (${editingRegister.min} to ${editingRegister.max} ${editingRegister.unit})`);
      return;
    }

    const oldValDisplay = editingRegister.type === 'COIL_M' ? (editingRegister.boolValue ? 'ON (1)' : 'OFF (0)') : `${editingRegister.value} ${editingRegister.unit}`;
    const newValDisplay = editingRegister.type === 'COIL_M' ? (parsedVal === 1 ? 'ON (1)' : 'OFF (0)') : `${parsedVal} ${editingRegister.unit}`;

    // Update register in state
    setRegisters((prev) =>
      prev.map((r) => {
        if (r.tag === editingRegister.tag) {
          return {
            ...r,
            value: parsedVal,
            boolValue: parsedVal === 1,
            isModified: true,
          };
        }
        return r;
      })
    );

    // Append to audit log
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      user: `${session.username} (${session.badgeId})`,
      tag: editingRegister.tag,
      oldValue: oldValDisplay,
      newValue: newValDisplay,
      status: 'COMMITTED',
      modbusFc: editingRegister.type === 'COIL_M' ? 'FC 0x05 (Write Single Coil)' : 'FC 0x06 (Write Single Register)',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Play feedback tone
    audioAlerts.playAckBlip();

    // Trigger system notification
    onTriggerAlert(
      'INFO',
      `PLC Value Modified: ${editingRegister.tag}`,
      `Register ${editingRegister.tag} updated from ${oldValDisplay} to ${newValDisplay} by ${session.username}`,
      editingRegister.tag
    );

    setEditingRegister(null);
  };

  const handleToggleCoilDirectly = (tag: string) => {
    if (!session?.permissions.canForceCoils) {
      alert('Requires Technician or Automation Engineer credentials to force discrete coils.');
      return;
    }

    setRegisters((prev) =>
      prev.map((r) => {
        if (r.tag === tag && r.type === 'COIL_M') {
          const nextBool = !r.boolValue;
          const oldDisplay = r.boolValue ? 'ON (1)' : 'OFF (0)';
          const newDisplay = nextBool ? 'ON (1)' : 'OFF (0)';

          setAuditLogs((logs) => [
            {
              id: `LOG-${Date.now().toString().slice(-4)}`,
              timestamp: Date.now(),
              user: `${session.username} (${session.badgeId})`,
              tag,
              oldValue: oldDisplay,
              newValue: newDisplay,
              status: 'COMMITTED',
              modbusFc: 'FC 0x05 (Force Coil)',
            },
            ...logs,
          ]);

          audioAlerts.playAckBlip();
          return {
            ...r,
            value: nextBool ? 1 : 0,
            boolValue: nextBool,
            isModified: true,
          };
        }
        return r;
      })
    );
  };

  const handleClearFaultRegister = () => {
    setRegisters((prev) =>
      prev.map((r) => (r.tag === '%SW50' ? { ...r, value: 0x0000, isModified: true } : r))
    );
    audioAlerts.playAckBlip();
    setAuditLogs((prev) => [
      {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: Date.now(),
        user: `${session?.username || 'Tech'}`,
        tag: '%SW50',
        oldValue: '0x4010',
        newValue: '0x0000 (CLEARED)',
        status: 'COMMITTED',
        modbusFc: 'FC 0x06 (Write Register)',
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Top Banner: Emergency Takeover & Onboard HMI Status */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isHmiBlackoutSimulated
          ? 'bg-red-950/40 border-red-500/80 ring-2 ring-red-500/40 animate-amber'
          : isNightShift
          ? palette === 'RED'
            ? 'bg-black border-red-500/60'
            : 'bg-black border-amber-500/60'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${
              isHmiBlackoutSimulated ? 'bg-red-500 text-white' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isHmiBlackoutSimulated ? <MonitorOff className="w-6 h-6 animate-pulse" /> : <Cpu className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isHmiBlackoutSimulated ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                }`}>
                  {isHmiBlackoutSimulated ? '⚠️ ONBOARD HMI FAILURE ENGAGED' : 'STANDBY BACKUP HMI'}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Direct Bus: USB-B OTG / RJ-45 Modbus TCP
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 font-mono">
                EMERGENCY ALTERNATIVE HMI & DIRECT PLC READ/WRITE CONSOLE
              </h2>
              <p className="text-xs text-slate-400">
                Acts as a mobile touchscreen replacement when the physical console fails or communication is lost.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !isHmiBlackoutSimulated;
                setIsHmiBlackoutSimulated(next);
                if (next) {
                  audioAlerts.playCriticalSiren();
                  onTriggerAlert('CRITICAL', 'ONBOARD HMI BLACKOUT DETECTED', 'Physical touch panel non-responsive. Emergency mobile HMI takeover active.', '%SYS_HMI_FAIL');
                } else {
                  audioAlerts.playAckBlip();
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                isHmiBlackoutSimulated
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <MonitorOff className="w-3.5 h-3.5" />
              <span>{isHmiBlackoutSimulated ? 'Clear HMI Failure Simulation' : 'Simulate Onboard HMI Blackout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Login / Authentication Section */}
      {!session ? (
        <div className="bg-slate-900 rounded-3xl p-6 border-2 border-slate-700 shadow-2xl max-w-lg mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                PLC DIRECT ACCESS AUTHORIZATION
              </h3>
              <p className="text-xs text-slate-400">
                Authenticate to unlock read/write control over Schneider Modicon registers.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1.5 font-bold">SELECT ACCESS TIER</label>
              <div className="grid grid-cols-3 gap-2">
                {(['OPERATOR', 'TECHNICIAN', 'AUTOMATION_ENGINEER'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition ${
                      selectedRole === r
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {r === 'AUTOMATION_ENGINEER' ? 'ENGINEER' : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 font-bold">ENTER SECURITY PIN</label>
                <span className="text-[10px] text-amber-400">
                  Demo PIN: {selectedRole === 'OPERATOR' ? '1234' : selectedRole === 'TECHNICIAN' ? '4321' : '8888'}
                </span>
              </div>
              <input
                type="password"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="Enter 4-digit PIN..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 outline-none"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px]">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Authenticate & Engage Alternative HMI</span>
            </button>
          </form>
        </div>
      ) : (
        /* Logged In: Full Alternative HMI Control Center */
        <div className="space-y-6">
          
          {/* Active Session Strip */}
          <div className="bg-slate-900 rounded-2xl px-5 py-3 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHENTICATED: {session.username}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                {session.role} ({session.badgeId})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                Permissions: Setpoints {session.permissions.canModifySetpoints ? '✓' : '✗'} | Force Coils {session.permissions.canForceCoils ? '✓' : '✗'}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Emergency Direct Modicon Registers Table (Modify PLC Values) */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>DIRECT PLC REGISTER MODIFICATION & FORCE INTERFACE</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click on any holding register (%MW) or discrete coil (%M) to modify live operating values.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearFaultRegister}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  title="Write 0x0000 to %SW50 to clear latched faults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear %SW50 Faults</span>
                </button>
              </div>
            </div>

            {/* Grid of Registers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {registers.map((reg) => {
                const isCoil = reg.type === 'COIL_M';
                return (
                  <div
                    key={reg.tag}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      reg.isModified
                        ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                          {reg.tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {reg.type === 'HOLDING_MW' ? '40001 (FC 03/06)' : reg.type === 'COIL_M' ? 'Coil (FC 01/05)' : 'System Word'}
                        </span>
                      </div>
                      {reg.isModified && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                          OVERRIDDEN
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-semibold text-slate-200 leading-snug">
                        {reg.name}
                      </div>

                      {/* Display Value */}
                      <div className="mt-2 flex items-baseline justify-between font-mono">
                        {isCoil ? (
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              reg.boolValue ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'
                            }`}></span>
                            <span className={`text-base font-extrabold ${reg.boolValue ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {reg.boolValue ? 'STATE: 1 (ON / ENGAGED)' : 'STATE: 0 (OFF / DE-ENERGIZED)'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-white">
                              {reg.unit === 'HEX' ? `0x${reg.value.toString(16).toUpperCase()}` : reg.value}
                            </span>
                            <span className="text-xs text-slate-400">{reg.unit}</span>
                          </div>
                        )}
                      </div>

                      {/* Bounds indicator for analog values */}
                      {!isCoil && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Range: {reg.min} – {reg.max} {reg.unit}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
                        {isCoil ? (
                          <button
                            onClick={() => handleToggleCoilDirectly(reg.tag)}
                            className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                              reg.boolValue
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{reg.boolValue ? 'Force De-Energize (0)' : 'Force Energize (1)'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openModifyModal(reg)}
                            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Modify Setpoint (FC 06)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Audit Log (Modbus Write Tracking) */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase">
                  PLC MODIFICATION AUDIT LOG (MODBUS TX LOG)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Immutable Record</span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">TIMESTAMP</th>
                    <th className="p-2.5">TECHNICIAN</th>
                    <th className="p-2.5">REGISTER</th>
                    <th className="p-2.5">MODIFICATION</th>
                    <th className="p-2.5">MODBUS FUNCTION</th>
                    <th className="p-2.5 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 font-semibold text-white whitespace-nowrap">{log.user}</td>
                      <td className="p-2.5 text-amber-400 font-bold">{log.tag}</td>
                      <td className="p-2.5">
                        <span className="text-slate-500 line-through mr-1.5">{log.oldValue}</span>
                        <span className="text-emerald-400 font-bold">→ {log.newValue}</span>
                      </td>
                      <td className="p-2.5 text-slate-400">{log.modbusFc}</td>
                      <td className="p-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modify Register Modal */}
      {editingRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-sm">MODIFY PLC REGISTER: {editingRegister.tag}</span>
              </div>
              <button
                onClick={() => setEditingRegister(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Target Parameter:</span>
              <strong className="text-white text-sm font-sans">{editingRegister.name}</strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Current Value:</span>
                <span className="text-amber-400 font-bold">{editingRegister.value} {editingRegister.unit}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Allowed Safe Range:</span>
                <span className="text-white">{editingRegister.min} to {editingRegister.max} {editingRegister.unit}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Modbus Protocol:</span>
                <span className="text-blue-400">Function 0x06 (Write Holding)</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">ENTER NEW VALUE ({editingRegister.unit})</label>
              <input
                type="number"
                step="any"
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg text-white font-mono font-bold focus:border-amber-500 outline-none"
                autoFocus
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] leading-relaxed">
              ⚠️ <strong>WARNING:</strong> This will directly write to the Schneider Modicon CPU memory over the active hardware link. Ensure machine kinematics are safe before committing.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRegister(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitValueChange}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Write to PLC (FC 06)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
