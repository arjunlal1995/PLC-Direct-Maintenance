import { Machine, PlcAlert } from '../types';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'MACH-01',
    name: 'Hydraulic Stamping Press #1',
    line: 'Press Line Alpha',
    plcType: 'Siemens S7-1500',
    ipAddress: '192.168.10.12',
    rackSlot: 'Rack 0, Slot 2',
    status: 'OPERATIONAL',
    healthScore: 94,
    lastPing: Date.now(),
    metrics: {
      temp: 64.2,
      pressure: 210,
      vibration: 1.4,
      cycles: 142850
    }
  },
  {
    id: 'MACH-02',
    name: 'Robotic Weld Cell #4',
    line: 'Chassis Assembly',
    plcType: 'Allen-Bradley ControlLogix',
    ipAddress: '192.168.10.25',
    rackSlot: 'Slot 4 (1756-L83E)',
    status: 'OPERATIONAL',
    healthScore: 98,
    lastPing: Date.now(),
    metrics: {
      temp: 42.1,
      pressure: 6.2,
      vibration: 0.8,
      cycles: 389200
    }
  },
  {
    id: 'MACH-03',
    name: '5-Axis CNC Milling Spindle',
    line: 'Precision Machining',
    plcType: 'Omron Sysmac',
    ipAddress: '192.168.10.44',
    rackSlot: 'Node 03 (NX102)',
    status: 'WARNING',
    healthScore: 78,
    lastPing: Date.now(),
    metrics: {
      temp: 86.8, // Elevating temp
      pressure: 45.0,
      vibration: 3.9,
      cycles: 98400
    }
  },
  {
    id: 'MACH-04',
    name: 'High-Speed Conveyor Infeed',
    line: 'Packaging & Sortation',
    plcType: 'Beckhoff TwinCAT',
    ipAddress: '192.168.10.51',
    rackSlot: 'IPC CX5140 (EtherCAT)',
    status: 'OPERATIONAL',
    healthScore: 91,
    lastPing: Date.now(),
    metrics: {
      temp: 48.0,
      pressure: 5.5,
      vibration: 1.1,
      cycles: 641200
    }
  },
  {
    id: 'MACH-05',
    name: 'Cooling Water Circulator Pump B',
    line: 'Central Utilities',
    plcType: 'Schneider Modicon M580',
    ipAddress: '192.168.10.88',
    rackSlot: 'Modicon M580 (Slot 00)',
    status: 'OPERATIONAL',
    healthScore: 89,
    lastPing: Date.now(),
    metrics: {
      temp: 52.3,
      pressure: 14.8,
      vibration: 2.1,
      cycles: 412000
    }
  }
];

export const INITIAL_ALERTS: PlcAlert[] = [
  {
    id: 'ALT-1042',
    machineId: 'MACH-03',
    machineName: '5-Axis CNC Milling Spindle',
    location: 'Bay 3 - Station B',
    plcTag: 'DB102.DBD14_BEARING_TEMP_WARN',
    plcType: 'Omron Sysmac',
    severity: 'HIGH',
    title: 'Spindle Bearing Temp Exceeded 85°C',
    message: 'Temperature sensor PT100 reading 86.8°C. Thermal gradient rising +1.2°C/min. Recommend checking chiller fluid level.',
    timestamp: Date.now() - 140000,
    status: 'ACTIVE',
    telemetry: {
      temperatureC: 86.8,
      vibrationRms: 3.9,
      rpm: 14200,
      errorCode: 'WARN_0x82A1'
    },
    soundAlarm: false
  },
  {
    id: 'ALT-0994',
    machineId: 'MACH-01',
    machineName: 'Hydraulic Stamping Press #1',
    location: 'Bay 1 - Heavy Stamping',
    plcTag: 'DB40.DBD8_OIL_FILTER_DP',
    plcType: 'Siemens S7-1500',
    severity: 'MEDIUM',
    title: 'Hydraulic Return Filter Differential Pressure',
    message: 'Filter differential pressure reached 2.4 bar (threshold 2.5 bar). Scheduled element replacement recommended.',
    timestamp: Date.now() - 1800000,
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Mike Roberts (Shift Lead)',
    acknowledgedAt: Date.now() - 1500000,
    telemetry: {
      pressureBar: 210,
      temperatureC: 64.2
    },
    soundAlarm: false
  }
];
