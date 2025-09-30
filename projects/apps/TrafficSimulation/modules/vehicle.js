import { CONFIG } from '../config.js';

const LANE_CHANGE_COOL_DOWN = 2; // seconds

export class Vehicle {
  constructor(approach, turn, type) {
    this.approach = approach;
    this.turn = turn;
    this.type = type;

    this.id = Math.random();
    const { width, height } = CONFIG.canvas;
    const roadWidth = CONFIG.road.width;
    const numLanes = CONFIG.lanes.numLanesPerDirection;
    const laneWidth = roadWidth / (2 * numLanes);

    this.length = type.length;
    this.width = type.width;
    this.maxSpeed = type.maxSpeed;
    this.speed = this.maxSpeed;
    this.acceleration = type.acceleration;
    this.deceleration = type.deceleration;

    this.laneChangeCooldown = 0;
    this.timeSinceLaneChange = 0;

    // Determine initial lane based on turn
    this.targetLane = this.getInitialLane(laneWidth);
    this.lane = this.targetLane;

    // Set initial position and direction
    this.setupInitialPosition(width, height, roadWidth, laneWidth);

    this.isTurning = false;
    this.isStopped = false;
    this.stoppedTime = 0;
  }

  getInitialLane(laneWidth) {
    const numLanes = CONFIG.lanes.numLanesPerDirection;
    if (this.turn === 'left') return 0; // Innermost lane
    if (this.turn === 'right') return numLanes - 1; // Outermost lane
    return Math.floor(Math.random() * numLanes); // Random lane for thru
  }

  setupInitialPosition(width, height, roadWidth, laneWidth) {
    const laneCenter = (this.lane + 0.5) * laneWidth;
    switch (this.approach) {
      case 'N':
        this.x = width / 2 - roadWidth / 2 + laneCenter;
        this.y = -this.length;
        this.vx = 0;
        this.vy = this.speed;
        break;
      case 'S':
        this.x = width / 2 + roadWidth / 2 - laneCenter;
        this.y = height + this.length;
        this.vx = 0;
        this.vy = -this.speed;
        break;
      case 'E':
        this.x = width + this.length;
        this.y = height / 2 + roadWidth / 2 - laneCenter;
        this.vx = -this.speed;
        this.vy = 0;
        break;
      case 'W':
        this.x = -this.length;
        this.y = height / 2 - roadWidth / 2 + laneCenter;
        this.vx = this.speed;
        this.vy = 0;
        break;
    }
  }

  update(dt, vehicles, signal) {
    this.timeSinceLaneChange += dt;

    if (this.timeSinceLaneChange > LANE_CHANGE_COOL_DOWN) {
        this.considerLaneChange(vehicles);
    }
    
    this.move(dt, vehicles, signal);
  }

  considerLaneChange(vehicles) {
    // Simplified: only change if not in the correct lane for a turn
    const correctLane = this.getInitialLane(CONFIG.road.width / (2 * CONFIG.lanes.numLanesPerDirection));
    if (this.lane !== correctLane) {
        const direction = Math.sign(correctLane - this.lane);
        this.changeLane(direction, vehicles);
    }
  }

  changeLane(direction, vehicles) {
    const newLane = this.lane + direction;
    if (newLane < 0 || newLane >= CONFIG.lanes.numLanesPerDirection) return; // Invalid lane

    // Check if the new lane is clear
    const isClear = this.isLaneClear(newLane, vehicles);

    if (isClear) {
        this.lane = newLane;
        this.timeSinceLaneChange = 0;
    }
  }

  isLaneClear(lane, vehicles) {
    // Simplified check: is there a vehicle in the target spot?
    // A more robust check would consider vehicle speeds and distances
    for (const v of vehicles) {
        if (v === this) continue;
        if (v.approach === this.approach && v.lane === lane) {
            const distance = Math.abs((this.vy !== 0 ? this.y - v.y : this.x - v.x));
            if (distance < this.length * 2) { // Safety margin
                return false;
            }
        }
    }
    return true;
  }

  move(dt, vehicles, signal) {
    // Vehicle following and signal stopping logic would go here
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(Math.atan2(this.vy, this.vx) + p.PI / 2);
    p.fill(this.type.color);
    p.rect(-this.width / 2, -this.length / 2, this.width, this.length);
    p.pop();
  }
}
