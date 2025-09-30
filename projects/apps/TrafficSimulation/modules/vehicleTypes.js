// Vehicle type definitions and utility for probability updates

export const vehicleTypes = [
  { type: 'car', width: 15, length: 30, speedMultiplier: 1, probability: 0.65 },
  { type: 'truck', width: 18, length: 45, speedMultiplier: 0.8, probability: 0.15 },
  { type: 'sports_car', width: 14, length: 28, speedMultiplier: 1.3, probability: 0.1 },
  { type: 'emergency', width: 16, length: 35, speedMultiplier: 1.5, probability: 0.02 },
  { type: 'bus', width: 20, length: 50, speedMultiplier: 0.7, probability: 0.08 }
];

// Update probabilities based on mix percentages (object with keys cars,trucks,sportsCars,buses,emergency)
export function applyVehicleMix(vehicleMixPercentages) {
  const total = 100 || (vehicleMixPercentages.cars + vehicleMixPercentages.trucks + vehicleMixPercentages.sportsCars + vehicleMixPercentages.buses + vehicleMixPercentages.emergency);
  vehicleTypes[0].probability = vehicleMixPercentages.cars / total;
  vehicleTypes[1].probability = vehicleMixPercentages.trucks / total;
  vehicleTypes[2].probability = vehicleMixPercentages.sportsCars / total;
  vehicleTypes[3].probability = vehicleMixPercentages.emergency / total;
  vehicleTypes[4].probability = vehicleMixPercentages.buses / total;
}

// Helper to pick a random type given current probability weights
export function pickRandomVehicle(p5RandomFn = Math.random) {
  const r = p5RandomFn();
  let acc = 0;
  for (const vt of vehicleTypes) {
    acc += vt.probability;
    if (r < acc) return vt;
  }
  return vehicleTypes[0];
}
