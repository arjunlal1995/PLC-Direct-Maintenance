export interface TelemetryDataPoint {
  time: string;
  timestamp: number;
  temperatureC: number;
  pressureBar: number;
  vibrationRms: number;
  rpm: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  annotation?: string;
}

export function generate24HourHistory(machineType: string = 'schneider'): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const now = Date.now();
  const oneHour = 3600 * 1000;

  for (let i = 24; i >= 0; i--) {
    const timeVal = new Date(now - i * oneHour);
    const hourLabel = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Base simulation values
    let baseTemp = 58;
    let basePressure = 1.35;
    let baseVib = 1.2;
    let rpm = 705;
    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    let annotation: string | undefined = undefined;

    // Simulate work shift heating & cooling cycles
    const hourOfDay = timeVal.getHours();
    const isPeakShift = hourOfDay >= 8 && hourOfDay <= 17;
    
    if (isPeakShift) {
      baseTemp += 10 + Math.sin(i) * 3;
      basePressure += 0.1;
      baseVib += 0.3;
    } else {
      baseTemp += Math.cos(i) * 2;
    }

    // Simulate the developing fault in the last 4-6 hours (matches our Schneider Sea Water / Bearing Alert)
    if (i <= 5 && i > 1) {
      baseTemp += (6 - i) * 3.5; // Thermal creep up to 82°C
      basePressure -= (6 - i) * 0.15; // Pressure decay from 1.35 -> 0.75 Bar
      baseVib += (6 - i) * 0.4;
      status = 'WARNING';
      if (i === 4) annotation = 'Thermal Creep Initiated';
      if (i === 2) annotation = 'Strainer Differential Pressure High';
    } else if (i <= 1) {
      baseTemp = 86.8;
      basePressure = 0.42; // Critical low pressure!
      baseVib = 3.9;
      status = 'CRITICAL';
      annotation = 'Low Pressure Trip (0.42 Bar)';
    }

    points.push({
      time: hourLabel,
      timestamp: timeVal.getTime(),
      temperatureC: parseFloat(baseTemp.toFixed(1)),
      pressureBar: parseFloat(Math.max(0.2, basePressure).toFixed(2)),
      vibrationRms: parseFloat(baseVib.toFixed(2)),
      rpm: isPeakShift ? (i <= 1 ? 0 : rpm) : 620,
      status,
      annotation,
    });
  }

  return points;
}
