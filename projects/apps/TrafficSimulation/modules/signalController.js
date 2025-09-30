// Basic signal controller with strategy pattern placeholder

export const PhaseState = Object.freeze({ GREEN: 'GREEN', YELLOW: 'YELLOW', ALL_RED: 'ALL_RED' });

export class SignalController {
  constructor(config) {
  // Phases indices (default two-phase): 0 NS thru+perm left, 1 EW thru+perm left
  // When protectedLefts enabled -> sequence: 0 NS Left, 1 NS Thru, 2 EW Left, 3 EW Thru
  // When approachByApproach enabled -> sequence: 0 North, 1 East, 2 South, 3 West (or 4 phases if protected lefts off)
    this.currentPhaseIndex = 0;
    this.state = PhaseState.GREEN;
    this.timer = config.minGreenNS; // seconds
  this.config = { protectedLefts: false, leftMinGreen: 8, leftYellow: 3, maxGreenNS: 90, maxGreenEW: 90, gap: 3, minGap: 1.5, adaptiveLookback: 120, ...config }; // include feature & actuated params
    this.switchRequested = false;
  this.cumulativeGreen = 0; // track elapsed green for current phase
  this.lastDt = 0;
  }
  phaseCount() {
    if (this.config.approachByApproach) return 4; // N, E, S, W
    return this.config.protectedLefts ? 4 : 2;
  }
  isLeftPhase(index=this.currentPhaseIndex) {
    if (!this.config.protectedLefts) return false;
    return index === 0 || index === 2;
  }
  isNSPhase(index=this.currentPhaseIndex) {
    if (this.config.approachByApproach) return index === 0 || index === 2; // north or south
    if (!this.config.protectedLefts) return index === 0; // 0 NS, 1 EW
    return index === 0 || index === 1; // first two are NS (left then thru)
  }
  // Helper: check if current single approach phase serves given approach
  servesApproach(approach, index=this.currentPhaseIndex) {
    if (!this.config.approachByApproach) return false;
    const map = ['N','E','S','W'];
    return map[index % 4] === approach;
  }
  update(dt) {
    this.timer -= dt;
  if (this.state === PhaseState.GREEN) this.cumulativeGreen += dt;
  this.lastDt = dt;
    switch (this.state) {
      case PhaseState.GREEN: {
        let required;
        if (this.config.approachByApproach) {
          required = this.config.minGreenApproach || 10;
        } else if (this.config.protectedLefts) {
          if (this.isLeftPhase()) required = this.config.leftMinGreen; else required = this.isNSPhase() ? this.config.minGreenNS : this.config.minGreenEW;
        } else {
          required = this.currentPhaseIndex === 0 ? this.config.minGreenNS : this.config.minGreenEW;
        }
        // Mode-specific logic
        if (this.config.mode === 'pretimed') {
          if (this.timer <= 0) this.switchRequested = true;
        } else if (this.config.mode === 'actuated') {
          // Use detectors: external code will set this.detectorDemand = {NS:true/false, EW:true/false}
          const nsPhase = this.isNSPhase();
          const maxGreen = nsPhase ? this.config.maxGreenNS : this.config.maxGreenEW;
          // Gap-out condition: if min green served (timer<=0) and no demand on served street for gap seconds
          if (this.timer <= 0) {
            if (!this.detectorDemand) this.detectorDemand = {NS:true, EW:true};
            const demandSide = nsPhase ? 'NS' : 'EW';
            const opposingSide = nsPhase ? 'EW' : 'NS';
            if (!this.detectorDemand[demandSide]) {
              // start or continue gap timer
              this.gapTimer = (this.gapTimer || 0) + dt;
            } else {
              this.gapTimer = 0;
            }
            if (this.gapTimer >= this.config.gap) this.switchRequested = true;
          }
          // Max green check
          if (this.cumulativeGreen >= maxGreen) this.switchRequested = true;
        } else if (this.config.mode === 'adaptive') {
          // Simple adaptive heuristic: if opposing queue larger (detectors provide counts) after min served, switch early
            if (this.timer <= 0) {
              const nsPhase = this.isNSPhase();
              if (this.detectorCounts) {
                const served = nsPhase ? this.detectorCounts.NS : this.detectorCounts.EW;
                const opposing = nsPhase ? this.detectorCounts.EW : this.detectorCounts.NS;
                if (opposing > served * 1.2) this.switchRequested = true;
              }
            }
            // Hard cap at maxGreen also
            const maxGreen = this.isNSPhase()? this.config.maxGreenNS : this.config.maxGreenEW;
            if (this.cumulativeGreen >= maxGreen) this.switchRequested = true;
        }
        if (this.switchRequested && this.timer <= 0) {
          this.state = PhaseState.YELLOW;
          this.timer = this.isLeftPhase() ? (this.config.leftYellow || this.config.yellow) : this.config.yellow;
        }
        break; }
      case PhaseState.YELLOW: {
        if (this.timer <= 0) {
          this.state = PhaseState.ALL_RED;
          this.timer = this.config.allRed;
        }
        break; }
      case PhaseState.ALL_RED: {
        if (this.timer <= 0) {
          // advance phase
            this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phaseCount();
            this.state = PhaseState.GREEN;
            let required;
            if (this.config.approachByApproach) {
              required = this.config.minGreenApproach || 10;
            } else if (this.config.protectedLefts) {
              if (this.isLeftPhase()) required = this.config.leftMinGreen; else required = this.isNSPhase() ? this.config.minGreenNS : this.config.minGreenEW;
            } else {
              required = this.currentPhaseIndex === 0 ? this.config.minGreenNS : this.config.minGreenEW;
            }
            this.timer = required;
            this.switchRequested = false;
            this.cumulativeGreen = 0;
            this.gapTimer = 0;
        }
        break; }
    }
  }
  requestSwitch() {
    if (this.state === PhaseState.GREEN && this.timer <= 0) { this.switchRequested = true; return true; }
    return false;
  }
  reconfigure(config) {
    this.config = { ...this.config, ...config };
    if (this.state === PhaseState.GREEN) {
      let required;
      if (this.config.protectedLefts) {
        if (this.isLeftPhase()) required = this.config.leftMinGreen; else required = this.isNSPhase() ? this.config.minGreenNS : this.config.minGreenEW;
      } else {
        required = this.currentPhaseIndex === 0 ? this.config.minGreenNS : this.config.minGreenEW;
      }
      if (this.timer > required) this.timer = required;
    }
  }
  getPhaseLabel() {
    if (this.state === PhaseState.GREEN) {
      if (this.config.approachByApproach) {
        const map = ['North','East','South','West'];
        return map[this.currentPhaseIndex % 4] + ' Green';
      }
      if (this.config.protectedLefts) {
        if (this.isLeftPhase()) return this.isNSPhase() ? 'N/S Left' : 'E/W Left';
        return this.isNSPhase() ? 'N/S Thru' : 'E/W Thru';
      }
      return this.currentPhaseIndex === 0 ? 'N/S Green' : 'E/W Green';
    }
    if (this.state === PhaseState.YELLOW) {
      if (this.config.protectedLefts) {
        if (this.isLeftPhase()) return this.isNSPhase() ? 'N/S Left Yellow' : 'E/W Left Yellow';
        return this.isNSPhase() ? 'N/S Thru Yellow' : 'E/W Thru Yellow';
      }
      return this.currentPhaseIndex === 0 ? 'N/S Yellow' : 'E/W Yellow';
    }
    return 'All Red';
  }
}
