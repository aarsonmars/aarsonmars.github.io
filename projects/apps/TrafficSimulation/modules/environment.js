// Environment (weather + time of day) factors

export const WEATHER_EFFECTS = {
  clear: { speedMultiplier: 1.0, safetyDistanceMultiplier: 1.0, description: 'Normal driving conditions' },
  rain: { speedMultiplier: 0.85, safetyDistanceMultiplier: 1.3, description: 'Reduced visibility, slower speeds, increased following distance' },
  snow: { speedMultiplier: 0.7, safetyDistanceMultiplier: 1.5, description: 'Poor traction, slower speeds, greater following distance' }
};

export const TIME_EFFECTS = {
  day: { speedMultiplier: 1.0, safetyDistanceMultiplier: 1.0, description: 'Normal visibility' },
  night: { speedMultiplier: 0.9, safetyDistanceMultiplier: 1.2, description: 'Reduced visibility requiring greater caution' }
};

export class EnvironmentState {
  constructor() {
    this.weather = 'clear';
    this.dayTime = true; // boolean day/night
    this.timeOfDay = 250; // 0..1000
    this.cycleSpeed = 0.2;
    this.enableCycle = false; // UI toggle controls
  }
  update(dt) {
    if (this.enableCycle) {
      this.timeOfDay = (this.timeOfDay + this.cycleSpeed) % 1000;
      this.dayTime = this.timeOfDay > 0 && this.timeOfDay < 500;
    }
  }
  getSpeedFactor() {
    const w = WEATHER_EFFECTS[this.weather];
    const t = this.dayTime ? TIME_EFFECTS.day : TIME_EFFECTS.night;
    return w.speedMultiplier * t.speedMultiplier;
  }
  getSafetyFactor() {
    const w = WEATHER_EFFECTS[this.weather];
    const t = this.dayTime ? TIME_EFFECTS.day : TIME_EFFECTS.night;
    return Math.max(w.safetyDistanceMultiplier, t.safetyDistanceMultiplier);
  }
}
