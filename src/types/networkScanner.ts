/**
 * Types and definitions for Industrial Network Auto-Scanner and Driver Package Generator.
 */

export type DeviceCategory = 'PLC' | 'HMI' | 'DRIVE_VFD' | 'GATEWAY' | 'IO_ISLAND' | 'ENERGY_METER';

export type DriverArchitectureType = 
  | 'CDC_ACM_USB' 
  | 'MODBUS_TCP_JNI' 
  | 'FTDI_D2XX' 
  | 'SIEMENS_S7_TCP' 
  | 'MOXA_SERIAL_SOCKET' 
  | 'ETHERNET_IP_CIP';

export interface DeviceDriverSpec {
  driverId: string;
  name: string;
  version: string;
  type: DriverArchitectureType;
  packageSize: string;
  downloadFileName: string;
  description: string;
  supportedAndroidVersions: string;
  kernelModule?: string;
  jniLibs: string[];
  baudRate?: number;
  parity?: string;
  defaultPort: number;
  defaultUnitId: number;
  sampleRegisterMap: {
    tag: string;
    description: string;
    scale: string;
  }[];
}

export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: 'Schneider Electric' | 'Siemens AG' | 'Moxa Technologies' | 'ABB Marine' | 'WAGO' | 'Omron Corp';
  model: string;
  hardwareSeries: string;
  category: DeviceCategory;
  protocols: string[];
  openPorts: number[];
  rttMs: number;
  status: 'ONLINE' | 'STANDBY' | 'FAULT';
  firmware: string;
  subsystemLocation: string; // e.g. "Main Engine Control Panel ECR-01"
  lastSeen: number;
  driver: DeviceDriverSpec;
  discoveryMedium?: 'WIRED_ETHERNET' | 'BLUETOOTH_LE' | 'WIFI_DIRECT';
  rssi?: number; // e.g. -52 dBm for BLE/Wi-Fi signal strength
  wirelessBeaconName?: string;
  pairingStatus?: 'PAIRED' | 'AVAILABLE' | 'CONNECTING';
}

export interface SubnetScanConfig {
  subnetCidr: string; // e.g. "192.168.1.0/24"
  scanSpeed: 'FAST_PING' | 'DEEP_INDUSTRIAL_AUDIT' | 'PASSIVE_LISTEN';
  targetPorts: number[];
  autoPollIntervalSec: number;
  isContinuousPolling: boolean;
}
