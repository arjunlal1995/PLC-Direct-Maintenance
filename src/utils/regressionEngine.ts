/**
 * Mathematical regression engine for industrial PLC telemetry predictive maintenance.
 * Supports:
 * - Ordinary Least Squares (OLS) Linear Regression (y = mx + b)
 * - Polynomial Quadratic Degradation (y = ax^2 + bx + c)
 * - Exponential Creep / Runaway (y = a * e^(bx))
 * - Standard Error of the Estimate & Prediction Confidence Intervals
 * - Failure Threshold Intersection & Remaining Useful Life (RUL) estimation
 */

export interface HistoricalPoint {
  index: number; // 0, 1, 2, ... (hours from start)
  timestamp: number;
  timeLabel: string;
  actualValue: number;
}

export interface PredictionPoint {
  index: number;
  timestamp: number;
  timeLabel: string;
  isHistorical: boolean;
  actualValue?: number;
  regressionValue: number;
  upperCi?: number;
  lowerCi?: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'PREDICTED_CRITICAL';
}

export interface FailurePredictionResult {
  hasFailurePredicted: boolean;
  expectedFailureTimestamp: number | null;
  expectedFailureDateStr: string;
  earliestFailureTimestamp: number | null; // Based on Upper CI bound
  earliestFailureDateStr: string;
  latestFailureTimestamp: number | null; // Based on Lower CI bound
  latestFailureDateStr: string;
  rulHours: number | null;
  rulFormatted: string;
  criticalThreshold: number;
  rSquared: number;
  slopePerHour: number;
  standardError: number;
  modelType: 'LINEAR' | 'QUADRATIC' | 'EXPONENTIAL';
  healthScorePct: number;
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  points: PredictionPoint[];
}

export type RegressionModelType = 'LINEAR' | 'QUADRATIC' | 'EXPONENTIAL';

// Solve 3x3 linear system for quadratic fit using Cramer's rule
function solve3x3(matrix: number[][], vector: number[]): [number, number, number] {
  const [row1, row2, row3] = matrix;
  const detA =
    row1[0] * (row2[1] * row3[2] - row2[2] * row3[1]) -
    row1[1] * (row2[0] * row3[2] - row2[2] * row3[0]) +
    row1[2] * (row2[0] * row3[1] - row2[1] * row3[0]);

  if (Math.abs(detA) < 1e-12) return [0, 0, 0];

  const detA1 =
    vector[0] * (row2[1] * row3[2] - row2[2] * row3[1]) -
    row1[1] * (vector[1] * row3[2] - row2[2] * vector[2]) +
    row1[2] * (vector[1] * row3[1] - row2[1] * vector[2]);

  const detA2 =
    row1[0] * (vector[1] * row3[2] - row2[2] * vector[2]) -
    vector[0] * (row2[0] * row3[2] - row2[2] * row3[0]) +
    row1[2] * (row2[0] * vector[2] - vector[1] * row3[0]);

  const detA3 =
    row1[0] * (row2[1] * vector[2] - vector[1] * row3[1]) -
    row1[1] * (row2[0] * vector[2] - vector[1] * row3[0]) +
    vector[0] * (row2[0] * row3[1] - row2[1] * row3[0]);

  return [detA1 / detA, detA2 / detA, detA3 / detA];
}

export function computePredictiveRegression(
  historicalPoints: HistoricalPoint[],
  criticalThreshold: number,
  isDecay: boolean, // true if failure occurs when value drops below threshold (e.g. pressure), false if value rises above (e.g. temp, vibration)
  forecastHorizonHours: number = 24,
  modelType: RegressionModelType = 'LINEAR',
  confidenceLevel: 0.90 | 0.95 | 0.99 = 0.95,
  simulateIntervention: boolean = false
): FailurePredictionResult {
  const n = historicalPoints.length;
  if (n < 3) {
    throw new Error('At least 3 historical points are required for regression');
  }

  const xs = historicalPoints.map((p) => p.index);
  const ys = historicalPoints.map((p) => p.actualValue);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  const sumX2 = xs.reduce((a, b) => a + b * b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumDiffX2 = xs.reduce((acc, x) => acc + Math.pow(x - meanX, 2), 0);

  // Linear fit coefficients y = m * x + b
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Quadratic fit coefficients y = a * x^2 + b * x + c
  let quadA = 0;
  let quadB = slope;
  let quadC = intercept;

  if (modelType === 'QUADRATIC') {
    const sumX3 = xs.reduce((a, b) => a + Math.pow(b, 3), 0);
    const sumX4 = xs.reduce((a, b) => a + Math.pow(b, 4), 0);
    const sumX2Y = xs.reduce((acc, x, i) => acc + x * x * ys[i], 0);

    const matrix = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4],
    ];
    const vector = [sumY, sumXY, sumX2Y];
    const [c, b, a] = solve3x3(matrix, vector);
    quadA = a;
    quadB = b;
    quadC = c;
  }

  // Model predictor function
  const predictAt = (x: number): number => {
    if (simulateIntervention && x >= n - 1) {
      // Simulate corrective action: gradual recovery toward nominal operating level
      const baseline = historicalPoints[0].actualValue;
      const hoursSinceIntervention = x - (n - 1);
      const currentLevel = predictAtRaw(n - 1);
      return currentLevel + (baseline - currentLevel) * (1 - Math.exp(-hoursSinceIntervention / 8));
    }
    return predictAtRaw(x);
  };

  const predictAtRaw = (x: number): number => {
    if (modelType === 'QUADRATIC') {
      return quadA * x * x + quadB * x + quadC;
    }
    if (modelType === 'EXPONENTIAL') {
      // Fit ln(y) = ln(a) + b*x if all ys > 0
      const safeYs = ys.map((y) => Math.max(0.01, y));
      const lnYs = safeYs.map((y) => Math.log(y));
      const sumLnY = lnYs.reduce((a, b) => a + b, 0);
      const sumXLnY = xs.reduce((acc, x, i) => acc + x * lnYs[i], 0);
      const expB = (n * sumXLnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX);
      const expA = Math.exp((sumLnY - expB * sumX) / n);
      return expA * Math.exp(expB * x);
    }
    // Default Linear
    return slope * x + intercept;
  };

  // Residuals and R-squared calculation
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = predictAt(xs[i]);
    ssRes += Math.pow(ys[i] - yHat, 2);
    ssTot += Math.pow(ys[i] - meanY, 2);
  }
  const rSquared = ssTot > 0 ? Math.max(0, Math.min(0.999, 1 - ssRes / ssTot)) : 0.95;

  // Degrees of freedom & Standard Error
  const df = Math.max(1, n - 2);
  const standardError = Math.sqrt(ssRes / df);

  // Critical t-value for confidence interval
  const tCritMap = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  const tCrit = tCritMap[confidenceLevel];

  // Calculate prediction interval for point x:
  // SE_pred = SE * sqrt(1 + 1/n + (x - meanX)^2 / sumDiffX2)
  const getCiHalfWidth = (x: number): number => {
    const leverage = sumDiffX2 > 0 ? Math.pow(x - meanX, 2) / sumDiffX2 : 0;
    const sePred = standardError * Math.sqrt(1 + 1 / n + leverage);
    return Math.max(standardError * 0.5, tCrit * sePred);
  };

  // Generate combined data array (historical + future prediction points)
  const lastHistorical = historicalPoints[n - 1];
  const hourDurationMs = 3600 * 1000;
  const points: PredictionPoint[] = [];

  // Historical points
  for (let i = 0; i < n; i++) {
    const p = historicalPoints[i];
    const fitted = predictAt(p.index);
    const ciHalf = getCiHalfWidth(p.index);

    let status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'PREDICTED_CRITICAL' = 'SAFE';
    if (isDecay ? p.actualValue <= criticalThreshold : p.actualValue >= criticalThreshold) {
      status = 'CRITICAL';
    } else if (
      isDecay
        ? p.actualValue <= criticalThreshold * 1.25
        : p.actualValue >= criticalThreshold * 0.85
    ) {
      status = 'WARNING';
    }

    points.push({
      index: p.index,
      timestamp: p.timestamp,
      timeLabel: p.timeLabel,
      isHistorical: true,
      actualValue: parseFloat(p.actualValue.toFixed(2)),
      regressionValue: parseFloat(fitted.toFixed(2)),
      upperCi: parseFloat((fitted + ciHalf).toFixed(2)),
      lowerCi: parseFloat(Math.max(0, fitted - ciHalf).toFixed(2)),
      status,
    });
  }

  // Future prediction points
  for (let step = 1; step <= forecastHorizonHours; step++) {
    const futureIndex = n - 1 + step;
    const futureTimestamp = lastHistorical.timestamp + step * hourDurationMs;
    const dateObj = new Date(futureTimestamp);
    const timeLabel = `+${step}h (${dateObj.getHours().toString().padStart(2, '0')}:00)`;

    const fitted = predictAt(futureIndex);
    const ciHalf = getCiHalfWidth(futureIndex);
    const upper = fitted + ciHalf;
    const lower = Math.max(0, fitted - ciHalf);

    let status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'PREDICTED_CRITICAL' = 'SAFE';
    if (isDecay ? fitted <= criticalThreshold : fitted >= criticalThreshold) {
      status = 'PREDICTED_CRITICAL';
    } else if (
      isDecay
        ? fitted <= criticalThreshold * 1.25
        : fitted >= criticalThreshold * 0.85
    ) {
      status = 'WARNING';
    }

    points.push({
      index: futureIndex,
      timestamp: futureTimestamp,
      timeLabel,
      isHistorical: false,
      regressionValue: parseFloat(fitted.toFixed(2)),
      upperCi: parseFloat(upper.toFixed(2)),
      lowerCi: parseFloat(lower.toFixed(2)),
      status,
    });
  }

  // Find Failure Dates (Threshold Intersections)
  // 1. Expected failure (regressionValue crosses threshold)
  // 2. Earliest failure (Upper CI crosses threshold for increase, Lower CI crosses threshold for decay)
  // 3. Latest failure (Lower CI crosses threshold for increase, Upper CI crosses threshold for decay)
  let expectedIndex: number | null = null;
  let earliestIndex: number | null = null;
  let latestIndex: number | null = null;

  for (let i = n - 1; i < points.length; i++) {
    const pt = points[i];
    const isFailExpected = isDecay
      ? pt.regressionValue <= criticalThreshold
      : pt.regressionValue >= criticalThreshold;
    if (isFailExpected && expectedIndex === null) {
      expectedIndex = pt.index;
    }

    // Earliest failure uses the conservative bound
    const worstCaseValue = isDecay ? (pt.lowerCi ?? pt.regressionValue) : (pt.upperCi ?? pt.regressionValue);
    const isFailEarliest = isDecay
      ? worstCaseValue <= criticalThreshold
      : worstCaseValue >= criticalThreshold;
    if (isFailEarliest && earliestIndex === null) {
      earliestIndex = pt.index;
    }

    // Latest failure uses the optimistic bound
    const bestCaseValue = isDecay ? (pt.upperCi ?? pt.regressionValue) : (pt.lowerCi ?? pt.regressionValue);
    const isFailLatest = isDecay
      ? bestCaseValue <= criticalThreshold
      : bestCaseValue >= criticalThreshold;
    if (isFailLatest && latestIndex === null) {
      latestIndex = pt.index;
    }
  }

  const computeTimestampFromIndex = (idx: number | null): number | null => {
    if (idx === null) return null;
    const stepsFromLast = idx - (n - 1);
    return lastHistorical.timestamp + stepsFromLast * hourDurationMs;
  };

  const formatDateStr = (ts: number | null): string => {
    if (!ts) return 'Safe (> Horizon)';
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const expTs = computeTimestampFromIndex(expectedIndex);
  const earTs = computeTimestampFromIndex(earliestIndex);
  const latTs = computeTimestampFromIndex(latestIndex);

  const rulHours = expTs ? Math.max(0, Math.round((expTs - lastHistorical.timestamp) / hourDurationMs)) : null;
  const rulFormatted =
    rulHours !== null
      ? rulHours < 24
        ? `${rulHours} Hours (${(rulHours * 60).toFixed(0)} min)`
        : `${(rulHours / 24).toFixed(1)} Days (${rulHours} hrs)`
      : `> ${forecastHorizonHours} Hours (Stable)`;

  // Health Score (100% = Nominal, 0% = Imminent failure)
  let healthScorePct = 100;
  if (rulHours !== null) {
    if (rulHours <= 6) healthScorePct = 15;
    else if (rulHours <= 18) healthScorePct = 35;
    else if (rulHours <= 36) healthScorePct = 60;
    else healthScorePct = 82;
  } else {
    healthScorePct = 94;
  }

  let riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (rulHours !== null && rulHours <= 12) riskLevel = 'CRITICAL';
  else if (rulHours !== null && rulHours <= 28) riskLevel = 'HIGH';
  else if (rulHours !== null && rulHours <= 60) riskLevel = 'ELEVATED';

  return {
    hasFailurePredicted: expectedIndex !== null,
    expectedFailureTimestamp: expTs,
    expectedFailureDateStr: formatDateStr(expTs),
    earliestFailureTimestamp: earTs,
    earliestFailureDateStr: formatDateStr(earTs),
    latestFailureTimestamp: latTs,
    latestFailureDateStr: formatDateStr(latTs),
    rulHours,
    rulFormatted,
    criticalThreshold,
    rSquared: parseFloat(rSquared.toFixed(3)),
    slopePerHour: parseFloat(slope.toFixed(3)),
    standardError: parseFloat(standardError.toFixed(2)),
    modelType,
    healthScorePct,
    riskLevel,
    points,
  };
}
