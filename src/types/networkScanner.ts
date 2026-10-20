/**
 * Types and definitions for Industrial Network Auto-Scanner,
 * mDNS ZeroConf discovery, UDP Broadcast Heartbeat listener,
 * and Driver Package Generator.
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

export interface MdnsRecord {
  serviceName: string;
  serviceType: '_modbus._tcp.local' | '_schneider-epac._udp.local' | '_umas._tcp.local' | string;
  domain: string;
  hostTarget: string;
  port: number;
  txtRecords: {
    vendor?: string;
    model?: string;
    firmware?: string;
    mac?: string;
    cpuState?: string;
    rackSlot?: string;
    rstpRing?: string;
    securityLevel?: string;
    [key: string]: string | undefined;
  };
  resolvedIp: string;
  ttlSeconds: number;
}

export interface BroadcastHeartbeat {
  sourceIp: string;
  port: number; // 1740 (UMAS) or 2222 (EtherNet/IP) or 502
  protocol: 'SCHNEIDER_UMAS_BEACON' | 'ETHERNET_IP_HEARTBEAT' | 'MODBUS_CYCLIC_PING';
  family: string; // e.g. "Schneider Modicon M580 ePAC"
  sequenceNumber: number;
  cpuState: 'RUN' | 'STOP' | 'HALT' | 'ERR';
  scanCycleMs: number;
  rawHexPreamble: string; // e.g. "53 45 48 42 05 80"
  timestamp: number;
  rstpRingStatus: 'RING_CLOSED_HEALTHY' | 'RING_OPEN_DEGRADED' | 'STANDALONE';
  batteryStatus: 'OK' | 'LOW';
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
  discoveryProtocol?: 'ARP_PING' | 'MDNS_ZEROCONF' | 'UDP_BROADCAST_HEARTBEAT' | 'BLUETOOTH_LE' | 'WIFI_DIRECT';
  rssi?: number; // e.g. -52 dBm for BLE/Wi-Fi signal strength
  wirelessBeaconName?: string;
  pairingStatus?: 'PAIRED' | 'AVAILABLE' | 'CONNECTING';
  mdnsDetails?: MdnsRecord;
  heartbeatDetails?: BroadcastHeartbeat;
}

export interface SubnetScanConfig {
  subnetCidr: string; // e.g. "192.168.1.0/24"
  scanSpeed: 'FAST_PING' | 'DEEP_INDUSTRIAL_AUDIT' | 'PASSIVE_LISTEN';
  targetPorts: number[];
  autoPollIntervalSec: number;
  isContinuousPolling: boolean;
}
