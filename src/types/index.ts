export interface PlcAlert {
  id: string;
  machineId: string;
  machineName: string;
  location: string;
  plcTag: string;
  plcType: 'Schneider Modicon M580' | 'Schneider Modicon M340' | 'Schneider Modicon M221/M241' | 'Siemens S7-1500' | 'Allen-Bradley ControlLogix' | 'Omron Sysmac' | 'Beckhoff TwinCAT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  message: string;
  timestamp: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  telemetry: {
    temperatureC?: number;
    pressureBar?: number;
    vibrationRms?: number;
    rpm?: number;
    currentAmps?: number;
    errorCode?: string;
    schneiderRegister?: string; // e.g. "%MW100", "%SW50", "%M1"
  };
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  dispatchedTo?: string;
  dispatchedAt?: number;
  soundAlarm: boolean;
  checklistId?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: number;
  completedBy?: string;
  requiresPhotoOrSign?: boolean;
  ppeRequired?: string[];
  toolsRequired?: string[];
  estimatedMinutes?: number;
  criticalStep?: boolean;
}

export interface MaintenanceChecklist {
  id: string;
  alertId?: string;
  alertTitle?: string;
  machineId: string;
  machineName: string;
  plcTag: string;
  procedureCode: string;
  title: string;
  category: 'PREVENTATIVE' | 'CORRECTIVE' | 'SAFETY_INTERLOCK' | 'CALIBRATION' | 'INSPECTION';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: number;
  assignedTechnician: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  items: ChecklistItem[];
  technicianNotes?: string;
  partsUsed?: { partNumber: string; name: string; quantity: number }[];
  completedAt?: number;
}

export interface Machine {
  id: string;
  name: string;
  line: string;
  plcType: PlcAlert['plcType'];
  ipAddress: string;
  rackSlot: string;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  healthScore: number;
  lastPing: number;
  metrics: {
    temp: number;
    pressure: number;
    vibration: number;
    cycles: number;
  };
  schneiderDetails?: {
    model: string;
    firmwareVersion: string;
    macAddress: string;
    usbPortState: 'CONNECTED_USB_B' | 'DISCONNECTED';
    rj45PortState: 'LINK_UP_100M' | 'LINK_DOWN';
    systemWords: {
      sw0_taskTimeMs: number;
      sw49_batteryOk: boolean;
      sw50_errorCode: string;
      mw100_processPressure: number;
      mw102_motorTemp: number;
      m0_runState: boolean;
      m1_estopInterlock: boolean;
    };
  };
}

export interface SchneiderUsbConnectionConfig {
  connectionMode: 'USB_B_TO_TYPE_C' | 'RJ45_TO_TYPE_C';
  usbVendorId: number;
  usbProductId: number;
  baudRate: 9600 | 19200 | 38400 | 57600 | 115200;
  parity: 'NONE' | 'EVEN' | 'ODD';
  dataBits: 8 | 7;
  stopBits: 1 | 2;
  plcIpAddress: string;
  modbusPort: number;
  slaveUnitId: number;
  timeoutMs: number;
  connected: boolean;
  driverType: 'CDC-ACM (Native Modicon USB-B)' | 'FTDI TSXPCX3030' | 'Realtek USB-C Ethernet (Modbus TCP)';
}

export interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
  vibrationEnabled: boolean;
  browserNotificationsEnabled: boolean;
  headsUpPopups: boolean;
  autoEscalateMinutes: number;
  criticalChannelImportance: 'HIGH' | 'MAX';
  warningChannelImportance: 'DEFAULT' | 'HIGH';
  fcmPushMock: boolean;
}

export interface BuildStepLog {
  id: string;
  phase: string;
  message: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  durationMs?: number;
}

export type PlcTelemetryScenario = 'MAIN_ENGINE' | 'ALTERNATOR' | 'GEARBOX' | 'OVERVIEW' | 'THRUSTER' | 'DATA_READER';

export type PlcIoCategory = 'ANALOG_INPUT' | 'ANALOG_OUTPUT' | 'DIGITAL_INPUT' | 'DIGITAL_OUTPUT';

export interface PlcIoCustomization {
  tag: string;
  customName?: string;
  customTagAlias?: string;
  customDescription?: string;
  unit?: string;
  decimals?: number;
  minScale?: number;
  maxScale?: number;
  rawAdcMin?: number;
  rawAdcMax?: number;
  signalType?: '4-20mA' | '0-10V' | 'PT100' | 'THERMOCOUPLE' | '24V_DC' | 'RELAY_NO' | 'PULSE' | 'MODBUS_REG';
  calOffset?: number;
  calGain?: number;
  warnMin?: number;
  warnMax?: number;
  alarmMin?: number;
  alarmMax?: number;
  enableThresholds?: boolean;
  filterSamples?: number;
  deadband?: number;
  invertedLogic?: boolean;
  zeroLabel?: string;
  oneLabel?: string;
  alarmTriggerBit?: 0 | 1 | -1;
  isForced?: boolean;
  forcedValue?: number;
}

export interface PlcRegisterReading {
  tag: string;
  scenario: 'MAIN_ENGINE' | 'ALTERNATOR' | 'GEARBOX' | 'SAFETY';
  name: string;
  rawHex: string;
  rawInt: number;
  scaledValue: number;
  unit: string;
  decimals: number;
  min: number;
  max: number;
  warnMin?: number;
  warnMax?: number;
  alarmMin?: number;
  alarmMax?: number;
  status: 'NORMAL' | 'WARNING' | 'ALARM' | 'TRIPPED';
  type: 'HOLDING_MW' | 'INPUT_IW' | 'COIL_M' | 'SYSTEM_SW';
  ioCategory?: PlcIoCategory;
  channelAddress?: string;
  signalType?: '4-20mA' | '0-10V' | 'PT100' | 'THERMOCOUPLE' | '24V_DC' | 'RELAY_NO' | 'PULSE' | 'MODBUS_REG';
  customization?: PlcIoCustomization;
  lastPolled: number;
  description: string;
}

