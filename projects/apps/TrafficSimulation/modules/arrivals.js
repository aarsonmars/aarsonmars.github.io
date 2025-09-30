// Poisson arrival generator using exponential inter-arrival times
import { pickRandomVehicle } from './vehicleTypes.js';

export class ArrivalStream {
  constructor(approach, vph, rng = Math.random) {
    this.approach = approach; // 'N','S','E','W'
    this.ratePerSec = vph / 3600; // λ
    this.rng = rng;
    this.nextTime = 0; // seconds, schedule when setActive called
    this.active = true;
  }
  schedule(currentTime) {
    if (this.ratePerSec <= 0) {
      this.nextTime = Infinity;
      return;
    }
    // Exponential: -ln(U)/λ
    const u = this.rng();
    const gap = -Math.log(1 - u) / this.ratePerSec; // seconds
    this.nextTime = currentTime + gap;
  }
  updateRate(vph, currentTime) {
    this.ratePerSec = vph / 3600;
    if (this.nextTime === Infinity) this.schedule(currentTime);
  }
  tryGenerate(currentTime, pushVehicle, makeVehicle) {
    if (!this.active) return;
    if (currentTime >= this.nextTime) {
      const vType = pickRandomVehicle(this.rng);
      pushVehicle(makeVehicle(this.approach, vType));
      this.schedule(currentTime);
    }
  }
}
