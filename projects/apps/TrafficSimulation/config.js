// Central configuration for TrafficSimulation
export const CONFIG = {
  canvas: { width: 600, height: 600 },
  road: { width: 120 },
  lanes: { policy: 'DRIVE_ON_RIGHT', numLanesPerDirection: 2 },
  vehicles: {
    baseSpeed: 2,
    accel: 0.3,
    decel: 0.4,
    maxVehicles: 50,
    car: { width: 15, length: 30 }
  },
  signals: {
    minGreenNS: 30,
    minGreenEW: 30,
    yellow: 3,
  allRed: 2,
  mode: 'pretimed',
  // Enable conflict-free single-approach operation (one approach moves at a time)
  approachByApproach: false,
  minGreenApproach: 15
  },
  volumes: { // Vehicles per hour per approach (for Poisson arrival streams)
    N: 800,
    S: 800,
    E: 800,
    W: 800
  },
  turnSplits: { // Percentages per approach must sum 100
    north: { left: 20, thru: 60, right: 20 },
    south: { left: 10, thru: 80, right: 10 },
    east:  { left: 30, thru: 60, right: 10 },
    west:  { left: 10, thru: 80, right: 10 }
  },
  trafficPatterns: {
    LIGHT: { nsRate: 0.01, ewRate: 0.01, name: 'Light Traffic' },
    BALANCED: { nsRate: 0.03, ewRate: 0.03, name: 'Balanced Traffic' },
    NS_HEAVY: { nsRate: 0.05, ewRate: 0.01, name: 'N/S Heavy' },
    EW_HEAVY: { nsRate: 0.01, ewRate: 0.05, name: 'E/W Heavy' },
    RUSH_HOUR: { nsRate: 0.05, ewRate: 0.05, name: 'Rush Hour' }
  }
};
