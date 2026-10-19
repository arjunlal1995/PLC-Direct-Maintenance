import { ModbusTcpPacket, ModbusDiagnosticStats, IntermittentSimulationProfile, ModbusStatusCode } from '../types/modbusDiagnostic';
import { INITIAL_PLC_REGISTERS } from '../data/plcScenariosData';

let transactionCounter = 1040;

function formatTimestamp(d: Date): string {
  const pad = (n: number, w: number = 2) => n.toString().padStart(w, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}.${ms}`;
}

export function generateModbusTcpPacket(
  profile: IntermittentSimulationProfile = 'NORMAL',
  manualAnomaly?: 'TIMEOUT' | 'EXCEPTION_02' | 'EXCEPTION_04' | 'CRC_ERROR'
): ModbusTcpPacket {
  transactionCounter = (transactionCounter + 1) % 65535;
  const now = new Date();
  const timestamp = now.getTime();
  const timestampFormatted = formatTimestamp(now);
  const txId = transactionCounter;

  // Pick a realistic register reading or poll sequence from INITIAL_PLC_REGISTERS
  const sampleReg = INITIAL_PLC_REGISTERS[Math.floor(Math.random() * INITIAL_PLC_REGISTERS.length)];
  const isCoil = sampleReg.type === 'COIL_M';
  
  // Decide function code
  let fc = isCoil ? 1 : 3; // FC01 Read Coils, FC03 Read Holding Registers
  // Occasionally simulate a write or FC04
  const randomFcRoll = Math.random();
  if (randomFcRoll > 0.90) {
    fc = isCoil ? 5 : 6; // FC05 Write Single Coil, FC06 Write Single Register
  } else if (randomFcRoll > 0.85) {
    fc = 4; // FC04 Read Input Registers
  }

  const fcNameMap: Record<number, string> = {
    1: 'FC01 (Read Coils)',
    2: 'FC02 (Read Discrete Inputs)',
    3: 'FC03 (Read Holding Registers)',
    4: 'FC04 (Read Input Registers)',
    5: 'FC05 (Write Single Coil)',
    6: 'FC06 (Write Single Register)',
    15: 'FC15 (Write Multiple Coils)',
    16: 'FC16 (Write Multiple Registers)',
  };

  const functionCodeName = fcNameMap[fc] || `FC${fc}`;

  // Parse start address number from register tag
  let startAddress = 100;
  if (sampleReg.tag.startsWith('%MW')) {
    startAddress = parseInt(sampleReg.tag.replace('%MW', ''), 10) || 100;
  } else if (sampleReg.tag.startsWith('%M')) {
    startAddress = parseInt(sampleReg.tag.replace('%M', ''), 10) || 0;
  } else if (sampleReg.tag.startsWith('%SW')) {
    startAddress = parseInt(sampleReg.tag.replace('%SW', ''), 10) || 50;
  }

  const quantity = fc === 5 || fc === 6 ? 1 : Math.floor(1 + Math.random() * 4);

  // Compute jittered raw value and scaled display
  const rawInt = sampleReg.rawInt + Math.floor((Math.random() - 0.5) * 6);
  const rawHex = '0x' + (rawInt < 0 ? 0 : rawInt).toString(16).toUpperCase().padStart(4, '0');
  const scaledDisplay = `${sampleReg.scaledValue} ${sampleReg.unit}`;

  // Evaluate status code and anomalies based on profile or manual override
  let statusCode: ModbusStatusCode = '0x00';
  let statusText: ModbusTcpPacket['statusText'] = 'SUCCESS';
  let statusMessage = '200 OK — Valid Modbus TCP PDU received';
  let latencyMs = Math.floor(9 + Math.random() * 8); // Typical 9 - 17ms
  let isAnomaly = false;
  let anomalyReason: string | undefined = undefined;

  // Intermittent anomaly injection
  const roll = Math.random();

  if (manualAnomaly === 'TIMEOUT' || (profile === 'LOOSE_CABLE_DROPS' && roll < 0.16)) {
    statusCode = '0xFE';
    statusText = 'TIMEOUT';
    latencyMs = Math.floor(1950 + Math.random() * 120); // Near 2000ms timeout
    statusMessage = 'PLC Connection Timeout: No Modbus TCP response within 2000ms threshold';
    isAnomaly = true;
    anomalyReason = 'Intermittent Packet Drop / Loose Ethernet Cable (No ACK returned)';
  } else if (manualAnomaly === 'EXCEPTION_02' || (profile === 'ADDRESS_EXCEPTION' && roll < 0.20)) {
    statusCode = '0x02';
    statusText = 'EXCEPTION';
    latencyMs = Math.floor(14 + Math.random() * 10);
    statusMessage = 'Modbus Exception 0x02: Illegal Data Address (Register out of PLC memory boundary)';
    isAnomaly = true;
    anomalyReason = 'Addressing Boundary Violation: Attempted read beyond allocated %MW block';
  } else if (manualAnomaly === 'CRC_ERROR' || (profile === 'EMI_NOISE_BURSTS' && roll < 0.15)) {
    statusCode = '0xFF';
    statusText = 'COMM_ERROR';
    latencyMs = Math.floor(25 + Math.random() * 45);
    statusMessage = 'Frame Check Error: TCP payload corrupted or TCP RST received from PLC';
    isAnomaly = true;
    anomalyReason = 'EMI Induction / Cable Noise Spike causing frame checksum violation';
  } else if (profile === 'SLAVE_BUSY' && roll < 0.18) {
    statusCode = '0x06';
    statusText = 'EXCEPTION';
    latencyMs = Math.floor(55 + Math.random() * 40);
    statusMessage = 'Modbus Exception 0x06: Slave Device Busy (PLC scan cycle overrun)';
    isAnomaly = true;
    anomalyReason = 'PLC CPU Overloaded: Modicon M340/M580 scan cycle task delay';
  } else if (profile === 'LOOSE_CABLE_DROPS' && roll < 0.35) {
    // Intermittent latency spike without full drop
    latencyMs = Math.floor(85 + Math.random() * 140);
    isAnomaly = true;
    anomalyReason = 'Packet Retransmission / High Latency Jitter';
    statusMessage = `200 OK — Retransmitted segment ACKed after ${latencyMs}ms delay`;
  }

  // Construct raw Modbus TCP frame (MBAP + PDU) in hexadecimal string representation
  // MBAP Header:
  // Transaction ID (2 bytes) + Protocol ID (2 bytes, 00 00) + Length (2 bytes) + Unit ID (1 byte)
  const txHex = txId.toString(16).padStart(4, '0').toUpperCase().match(/.{2}/g)?.join(' ') || '00 00';
  const protoHex = '00 00';
  const unitHex = '01';
  let pduHex = '';

  if (statusText === 'TIMEOUT') {
    pduHex = '[NO RESPONSE - TIMEOUT EXPIRED]';
  } else if (statusText === 'EXCEPTION') {
    const errFc = (fc + 0x80).toString(16).toUpperCase();
    const errCode = statusCode.replace('0x', '').toUpperCase();
    pduHex = `${errFc} ${errCode}`;
  } else if (statusText === 'COMM_ERROR') {
    pduHex = 'CORRUPTED_STREAM_BAD_CHECKSUM';
  } else {
    // Standard response: FC (1 byte) + Byte Count (1 byte) + Data (2 * qty bytes)
    const fcHex = fc.toString(16).padStart(2, '0').toUpperCase();
    const byteCount = (quantity * 2).toString(16).padStart(2, '0').toUpperCase();
    const dataHex = (rawInt & 0xffff).toString(16).padStart(4, '0').toUpperCase().match(/.{2}/g)?.join(' ') || '00 00';
    pduHex = `${fcHex} ${byteCount} ${dataHex}`;
  }

  const mbapLength = 1 + (statusText === 'SUCCESS' ? 2 + quantity * 2 : 2);
  const lenHex = mbapLength.toString(16).padStart(4, '0').toUpperCase().match(/.{2}/g)?.join(' ') || '00 06';
  const rawFrameHex = statusText === 'TIMEOUT' 
    ? `${txHex} ${protoHex} ${lenHex} ${unitHex} ${pduHex}`
    : `${txHex} ${protoHex} ${lenHex} ${unitHex} ${pduHex}`;

  return {
    id: `PKT-${txId.toString().padStart(5, '0')}`,
    timestamp,
    timestampFormatted,
    transactionId: txId,
    protocolId: 0,
    unitId: 1,
    functionCode: fc,
    functionCodeName,
    direction: 'INCOMING_RX',
    sourceIp: '192.168.1.10',
    destIp: '192.168.1.50',
    port: 502,
    registerAddress: sampleReg.tag,
    startAddress,
    quantity,
    tagName: sampleReg.name,
    rawValue: rawInt,
    rawHex,
    scaledValue: scaledDisplay,
    statusCode,
    statusText,
    statusMessage,
    latencyMs,
    mbapLength,
    rawFrameHex,
    isAnomaly,
    anomalyReason
  };
}

/**
 * Calculates real-time diagnostic performance metrics over logged packets
 */
export function calculateDiagnosticStats(packets: ModbusTcpPacket[]): ModbusDiagnosticStats {
  if (packets.length === 0) {
    return {
      totalPackets: 0,
      successCount: 0,
      exceptionCount: 0,
      timeoutCount: 0,
      commErrorCount: 0,
      avgLatencyMs: 0,
      jitterMs: 0,
      packetLossPercent: 0,
      intermittentIssueDetected: false,
    };
  }

  const total = packets.length;
  let success = 0;
  let exceptions = 0;
  let timeouts = 0;
  let commErrors = 0;
  let latencySum = 0;

  packets.forEach((p) => {
    if (p.statusText === 'SUCCESS') success++;
    else if (p.statusText === 'EXCEPTION') exceptions++;
    else if (p.statusText === 'TIMEOUT') timeouts++;
    else if (p.statusText === 'COMM_ERROR') commErrors++;
    latencySum += p.latencyMs;
  });

  const avgLatency = Math.round((latencySum / total) * 10) / 10;
  
  // Calculate latency standard deviation (jitter)
  let varianceSum = 0;
  packets.forEach((p) => {
    varianceSum += Math.pow(p.latencyMs - avgLatency, 2);
  });
  const jitter = Math.round(Math.sqrt(varianceSum / total) * 10) / 10;

  const failureCount = exceptions + timeouts + commErrors;
  const packetLossPercent = Math.round((failureCount / total) * 1000) / 10;

  // Intermittent Issue Detection logic:
  // Check the recent 15 packets for clustered failures or latency spikes
  const recentWindow = packets.slice(0, 20);
  const recentFailures = recentWindow.filter((p) => p.statusText !== 'SUCCESS' || p.latencyMs > 80).length;
  const intermittentDetected = recentFailures >= 2;

  let activeAnomalyWarning: string | undefined = undefined;
  if (timeouts > 0 && timeouts >= exceptions) {
    activeAnomalyWarning = `Intermittent Packet Loss (${timeouts} timeouts): Potential loose RJ-45 cable, damaged shield, or PLC port buffer congestion.`;
  } else if (exceptions > 0) {
    activeAnomalyWarning = `Modbus Exception Traffic (${exceptions} errors): Register mapping misalignment or unallocated PLC address accessed.`;
  } else if (commErrors > 0) {
    activeAnomalyWarning = `EMI / Checksum Faults (${commErrors} frame resets): High inductive interference detected near VFD or alternator line.`;
  } else if (jitter > 35) {
    activeAnomalyWarning = `High Network Jitter (±${jitter}ms): Switch port contention or packet buffering delays observed.`;
  }

  return {
    totalPackets: total,
    successCount: success,
    exceptionCount: exceptions,
    timeoutCount: timeouts,
    commErrorCount: commErrors,
    avgLatencyMs: avgLatency,
    jitterMs: jitter,
    packetLossPercent,
    intermittentIssueDetected: intermittentDetected,
    activeAnomalyWarning
  };
}

/**
 * Exports packet log to CSV format
 */
export function exportToCsv(packets: ModbusTcpPacket[]): void {
  const headers = [
    'Packet_ID',
    'Timestamp',
    'Transaction_ID',
    'Protocol_ID',
    'Unit_ID',
    'Function_Code',
    'Function_Name',
    'Direction',
    'Source_IP',
    'Dest_IP',
    'Port',
    'Register_Address',
    'Register_Name',
    'Raw_Hex',
    'Raw_Value',
    'Scaled_Value',
    'Status_Code',
    'Status_Text',
    'Status_Message',
    'Round_Trip_Latency_ms',
    'Anomaly_Flag',
    'Anomaly_Reason',
    'Raw_MBAP_PDU_Frame'
  ];

  const escapeCsv = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = packets.map((p) => [
    escapeCsv(p.id),
    escapeCsv(p.timestampFormatted),
    p.transactionId,
    p.protocolId,
    p.unitId,
    p.functionCode,
    escapeCsv(p.functionCodeName),
    escapeCsv(p.direction),
    escapeCsv(p.sourceIp),
    escapeCsv(p.destIp),
    p.port,
    escapeCsv(p.registerAddress),
    escapeCsv(p.tagName),
    escapeCsv(p.rawHex),
    Array.isArray(p.rawValue) ? escapeCsv(p.rawValue.join(';')) : p.rawValue,
    escapeCsv(p.scaledValue),
    escapeCsv(p.statusCode),
    escapeCsv(p.statusText),
    escapeCsv(p.statusMessage),
    p.latencyMs,
    p.isAnomaly ? 'YES' : 'NO',
    escapeCsv(p.anomalyReason || 'None'),
    escapeCsv(p.rawFrameHex)
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `modbus_tcp_diagnostic_log_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports packet log to JSON format
 */
export function exportToJson(packets: ModbusTcpPacket[]): void {
  const jsonString = JSON.stringify(packets, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `modbus_tcp_traffic_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Initial sample seed packets for instant viewing
 */
export function generateInitialDiagnosticLog(count: number = 25): ModbusTcpPacket[] {
  const list: ModbusTcpPacket[] = [];
  for (let i = 0; i < count; i++) {
    // Introduce 2 intermittent blips in the initial history to illustrate debugging
    let manualAnomaly: 'TIMEOUT' | 'EXCEPTION_02' | 'CRC_ERROR' | undefined = undefined;
    if (i === 6) manualAnomaly = 'TIMEOUT';
    if (i === 14) manualAnomaly = 'EXCEPTION_02';
    list.push(generateModbusTcpPacket('NORMAL', manualAnomaly));
  }
  return list;
}
