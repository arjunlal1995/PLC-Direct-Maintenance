/**
 * Types and models for Modbus TCP Diagnostic Traffic Logging & Debugging.
 */

export type ModbusDirection = 'INCOMING_RX' | 'OUTGOING_TX';

export type ModbusStatusCode = 
  | '0x00' // OK / Success
  | '0x01' // Illegal Function
  | '0x02' // Illegal Data Address
  | '0x03' // Illegal Data Value
  | '0x04' // Slave Device Failure
  | '0x05' // Acknowledge
  | '0x06' // Slave Device Busy
  | '0x08' // Memory Parity Error
  | '0x0A' // Gateway Path Unavailable
  | '0x0B' // Gateway Target Device Failed to Respond
  | '0xFE' // Timeout / No Response
  | '0xFF'; // Frame Check / CRC / TCP RST

export interface ModbusTcpPacket {
  id: string;
  timestamp: number;
  timestampFormatted: string;
  transactionId: number;
  protocolId: number; // Always 0 for Modbus TCP
  unitId: number;
  functionCode: number;
  functionCodeName: string;
  direction: ModbusDirection;
  sourceIp: string;
  destIp: string;
  port: number;
  registerAddress: string;
  startAddress: number;
  quantity: number;
  tagName?: string;
  rawValue: number | number[];
  rawHex: string;
  scaledValue?: string;
  statusCode: ModbusStatusCode;
  statusText: 'SUCCESS' | 'EXCEPTION' | 'TIMEOUT' | 'COMM_ERROR';
  statusMessage: string;
  latencyMs: number;
  mbapLength: number;
  rawFrameHex: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface ModbusDiagnosticStats {
  totalPackets: number;
  successCount: number;
  exceptionCount: number;
  timeoutCount: number;
  commErrorCount: number;
  avgLatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  intermittentIssueDetected: boolean;
  activeAnomalyWarning?: string;
}

export type IntermittentSimulationProfile = 
  | 'NORMAL'            // 99.5% clean traffic, 10-15ms
  | 'LOOSE_CABLE_DROPS' // Intermittent packet timeouts & retries (10% drop rate)
  | 'ADDRESS_EXCEPTION' // Occasional 0x02 Illegal Data Address on polling boundary
  | 'EMI_NOISE_BURSTS'  // Periodic bursts of CRC / TCP reset errors
  | 'SLAVE_BUSY';       // Modbus 0x06 Slave Device Busy responses
