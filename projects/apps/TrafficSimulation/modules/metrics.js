// Metrics collection utilities

export function makeEmptyApproachMetrics() {
  return { volume: 0, totalDelay: 0, maxQueue: 0, waitTimes: [], avgDelay: 0, los: 'A' };
}

export function createMetrics() {
  return {
    north: makeEmptyApproachMetrics(),
    south: makeEmptyApproachMetrics(),
    east: makeEmptyApproachMetrics(),
    west: makeEmptyApproachMetrics(),
    totalVehicles: 0,
    simulationTime: 0,
    isRunningTimedSim: false,
    timedSimDuration: 300,
    timedSimElapsed: 0,
    overallAvgDelay: 0,
    overallLos: 'A',
    maxQueue: 0
  };
}

export function calculateLOS(delay) {
  if (delay <= 10) return 'A';
  if (delay <= 20) return 'B';
  if (delay <= 35) return 'C';
  if (delay <= 55) return 'D';
  if (delay <= 80) return 'E';
  return 'F';
}
