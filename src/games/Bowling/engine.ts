import { BOWLING_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LANE_WIDTH,
  BALL_RADIUS,
  PIN_RADIUS,
  TOTAL_FRAMES
} = BOWLING_CONSTANTS;

// ---- Types ----

export interface Pin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  standing: boolean;
  rotation: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  rotation: number;
}

export interface FrameScore {
  rolls: number[];       // pins knocked per roll (max 2, or 3 in frame 10)
  score: number | null;   // cumulative score (null if not yet calculable)
  isStrike: boolean;
  isSpare: boolean;
}

export interface BowlingState {
  ball: Ball;
  pins: Pin[];
  currentFrame: number;    // 0-9
  currentRoll: number;     // 0 or 1 (or 2 in frame 10)
  frames: FrameScore[];
  totalScore: number;
  isGameOver: boolean;
  isRolling: boolean;
  isCharging: boolean;
  chargePower: number;
  aimAngle: number;
  message: string;
  pinsDown: number;        // pins knocked in current roll
  allPinsDown: boolean;    // all pins knocked in current roll (for display)
}

// ---- Helper Functions ----

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---- Engine ----

export class BowlingEngine {
  private ball: Ball;
  private pins: Pin[];
  private currentFrame: number;
  private currentRoll: number;
  private frames: FrameScore[];
  private totalScore: number;
  private isGameOver: boolean;
  private isRolling: boolean;
  private isCharging: boolean;
  private chargePower: number;
  private aimAngle: number;
  private message: string;
  private pinsDown: number;
  private allPinsDown: boolean;
  private settleTimer: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private laneLeft: number;
  private laneRight: number;
  private pinStartY: number;
  private ballStartY: number;

  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.laneLeft = (CANVAS_WIDTH - LANE_WIDTH) / 2;
    this.laneRight = (CANVAS_WIDTH + LANE_WIDTH) / 2;
    this.pinStartY = 80;
    this.ballStartY = CANVAS_HEIGHT - 50;

    this.ball = this.createBall();
    this.pins = this.createPins();
    this.currentFrame = 0;
    this.currentRoll = 0;
    this.frames = this.createFrames();
    this.totalScore = 0;
    this.isGameOver = false;
    this.isRolling = false;
    this.isCharging = false;
    this.chargePower = 0;
    this.aimAngle = 0;
    this.message = '';
    this.pinsDown = 0;
    this.allPinsDown = false;
    this.settleTimer = 0;
  }

  // ---- Initialization ----

  private createBall(): Ball {
    return {
      x: CANVAS_WIDTH / 2,
      y: this.ballStartY,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      active: false,
      rotation: 0
    };
  }

  private createPins(): Pin[] {
    const pins: Pin[] = [];
    const cx = CANVAS_WIDTH / 2;
    const startY = this.pinStartY;
    const spacing = PIN_RADIUS * 2.8;

    // Triangle layout: row 0 = 1 pin, row 1 = 2 pins, row 2 = 3 pins, row 3 = 4 pins
    const rows = [
      [0],           // 1 pin (front)
      [-0.5, 0.5],   // 2 pins
      [-1, 0, 1],    // 3 pins
      [-1.5, -0.5, 0.5, 1.5]  // 4 pins (back)
    ];

    for (let row = 0; row < rows.length; row++) {
      for (const col of rows[row]) {
        pins.push({
          x: cx + col * spacing,
          y: startY + (3 - row) * spacing, // back row at top, front row at bottom
          vx: 0,
          vy: 0,
          radius: PIN_RADIUS,
          standing: true,
          rotation: 0
        });
      }
    }

    return pins;
  }

  private createFrames(): FrameScore[] {
    const frames: FrameScore[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      frames.push({
        rolls: [],
        score: null,
        isStrike: false,
        isSpare: false
      });
    }
    return frames;
  }

  // ---- Public API ----

  getState(): BowlingState {
    return {
      ball: { ...this.ball },
      pins: this.pins.map(p => ({ ...p })),
      currentFrame: this.currentFrame,
      currentRoll: this.currentRoll,
      frames: this.frames.map(f => ({
        ...f,
        rolls: [...f.rolls]
      })),
      totalScore: this.totalScore,
      isGameOver: this.isGameOver,
      isRolling: this.isRolling,
      isCharging: this.isCharging,
      chargePower: this.chargePower,
      aimAngle: this.aimAngle,
      message: this.message,
      pinsDown: this.pinsDown,
      allPinsDown: this.allPinsDown
    };
  }

  setAimAngle(angle: number): void {
    if (this.isRolling || this.isGameOver) return;
    // Clamp angle to reasonable range (-30 to 30 degrees)
    this.aimAngle = Math.max(-0.52, Math.min(0.52, angle));
  }

  startCharging(): void {
    if (this.isRolling || this.isGameOver) return;
    this.isCharging = true;
    this.chargePower = 0;
  }

  releaseBall(): void {
    if (!this.isCharging || this.isRolling || this.isGameOver) return;
    this.isCharging = false;

    const power = Math.max(this.chargePower, 3);
    const speed = power * 1.2;

    this.ball.vx = Math.sin(this.aimAngle) * speed;
    this.ball.vy = -Math.cos(this.aimAngle) * speed;
    this.ball.active = true;
    this.isRolling = true;
    this.message = '';
    this.chargePower = 0;
  }

  reset(): void {
    this.ball = this.createBall();
    this.pins = this.createPins();
    this.currentFrame = 0;
    this.currentRoll = 0;
    this.frames = this.createFrames();
    this.totalScore = 0;
    this.isGameOver = false;
    this.isRolling = false;
    this.isCharging = false;
    this.chargePower = 0;
    this.aimAngle = 0;
    this.message = '';
    this.pinsDown = 0;
    this.allPinsDown = false;
    this.settleTimer = 0;
  }

  // ---- Game Loop ----

  tick(): boolean {
    if (this.isGameOver) return false;

    // Update charge power
    if (this.isCharging) {
      this.chargePower = Math.min(this.chargePower + 0.25, 15);
    }

    // Update ball rotation
    if (this.ball.active) {
      this.ball.rotation += 0.1;
    }

    // Update pin rotations
    for (const pin of this.pins) {
      if (!pin.standing) {
        pin.rotation += 0.05;
      }
    }

    if (!this.isRolling) return true;

    // Physics update
    this.updateBall();
    this.updatePins();
    this.checkBallPinCollisions();
    this.checkPinPinCollisions();

    // Check if ball is off screen or settled
    const ballOffScreen = this.ball.y + this.ball.radius < -20 ||
                          this.ball.x + this.ball.radius < -20 ||
                          this.ball.x - this.ball.radius > this.canvasWidth + 20;

    const ballStopped = Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1;

    if (ballOffScreen || ballStopped) {
      this.settleTimer++;
      if (this.settleTimer > 30) {
        this.onRollComplete();
        this.settleTimer = 0;
      }
    } else {
      this.settleTimer = 0;
    }

    return true;
  }

  // ---- Physics ----

  private updateBall(): void {
    if (!this.ball.active) return;

    // Apply slight friction
    this.ball.vx *= 0.998;
    this.ball.vy *= 0.998;

    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Lane wall collisions
    if (this.ball.x - this.ball.radius < this.laneLeft) {
      this.ball.x = this.laneLeft + this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.5;
    }
    if (this.ball.x + this.ball.radius > this.laneRight) {
      this.ball.x = this.laneRight - this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.5;
    }

    // Gutter detection - if ball goes too far left/right, it's in the gutter
    const gutterWidth = 20;
    if (this.ball.x - this.ball.radius < this.laneLeft - gutterWidth ||
        this.ball.x + this.ball.radius > this.laneRight + gutterWidth) {
      // Ball is in the gutter, let it continue off screen
    }
  }

  private updatePins(): void {
    for (const pin of this.pins) {
      if (pin.standing) continue;

      // Apply friction to knocked pins
      pin.vx *= 0.95;
      pin.vy *= 0.95;

      // Move knocked pins
      pin.x += pin.vx;
      pin.y += pin.vy;

      // Stop if very slow
      if (Math.abs(pin.vx) < 0.05 && Math.abs(pin.vy) < 0.05) {
        pin.vx = 0;
        pin.vy = 0;
      }
    }
  }

  private checkBallPinCollisions(): void {
    if (!this.ball.active) return;

    for (const pin of this.pins) {
      if (!pin.standing) continue;

      const d = dist(this.ball.x, this.ball.y, pin.x, pin.y);
      const minDist = this.ball.radius + pin.radius;

      if (d < minDist && d > 0) {
        // Normal from pin center to ball
        const nx = (this.ball.x - pin.x) / d;
        const ny = (this.ball.y - pin.y) / d;

        // Push ball out
        const overlap = minDist - d;
        this.ball.x += nx * overlap * 0.3;
        this.ball.y += ny * overlap * 0.3;

        // Knock pin away
        const impactForce = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        pin.vx = -nx * impactForce * 0.7;
        pin.vy = -ny * impactForce * 0.7;
        pin.standing = false;

        // Slow ball slightly
        this.ball.vx *= 0.85;
        this.ball.vy *= 0.85;
      }
    }
  }

  private checkPinPinCollisions(): void {
    for (let i = 0; i < this.pins.length; i++) {
      const pinA = this.pins[i];
      if (pinA.standing && Math.abs(pinA.vx) < 0.1 && Math.abs(pinA.vy) < 0.1) continue;

      for (let j = i + 1; j < this.pins.length; j++) {
        const pinB = this.pins[j];

        const d = dist(pinA.x, pinA.y, pinB.x, pinB.y);
        const minDist = pinA.radius + pinB.radius;

        if (d < minDist && d > 0) {
          const nx = (pinB.x - pinA.x) / d;
          const ny = (pinB.y - pinA.y) / d;

          // Push apart
          const overlap = minDist - d;
          pinA.x -= nx * overlap * 0.5;
          pinA.y -= ny * overlap * 0.5;
          pinB.x += nx * overlap * 0.5;
          pinB.y += ny * overlap * 0.5;

          // Transfer momentum
          const relVx = pinA.vx - pinB.vx;
          const relVy = pinA.vy - pinB.vy;
          const relVn = relVx * nx + relVy * ny;

          if (relVn > 0) {
            pinA.vx -= relVn * nx * 0.5;
            pinA.vy -= relVn * ny * 0.5;
            pinB.vx += relVn * nx * 0.5;
            pinB.vy += relVn * ny * 0.5;

            // Knock standing pin if hit hard enough
            if (pinB.standing && Math.abs(relVn) > 0.5) {
              pinB.standing = false;
            }
            if (pinA.standing && Math.abs(relVn) > 0.5) {
              pinA.standing = false;
            }
          }
        }
      }
    }
  }

  // ---- Scoring ----

  private onRollComplete(): void {
    // Count knocked pins
    const standingBefore = this.pinsDown; // pins already down from previous roll
    let knockedThisRoll = 0;

    for (const pin of this.pins) {
      if (!pin.standing) {
        knockedThisRoll++;
      }
    }

    // Only count newly knocked pins
    const newlyKnocked = knockedThisRoll - standingBefore;
    const totalDown = knockedThisRoll;
    const allDown = totalDown >= 10;

    // Record roll
    const frame = this.frames[this.currentFrame];
    frame.rolls.push(totalDown);

    this.pinsDown = totalDown;
    this.allPinsDown = allDown;

    // Check strike or spare
    if (this.currentFrame < 9) {
      // Frames 1-9
      if (this.currentRoll === 0 && allDown) {
        // Strike!
        frame.isStrike = true;
        this.message = 'STRIKE!';
      } else if (this.currentRoll === 1 && allDown) {
        // Spare!
        frame.isSpare = true;
        this.message = 'SPARE!';
      }

      if (this.currentRoll === 0 && !allDown) {
        // First roll, not a strike - go to second roll
        this.currentRoll = 1;
        this.resetBallOnly();
        this.isRolling = false;
      } else {
        // Frame complete (strike or second roll done)
        this.advanceFrame();
      }
    } else {
      // Frame 10 - special rules
      if (this.currentRoll === 0) {
        if (allDown) {
          frame.isStrike = true;
          this.message = 'STRIKE!';
          // Reset pins for bonus rolls
          this.resetPinsOnly();
          this.currentRoll = 1;
          this.resetBallOnly();
          this.isRolling = false;
        } else {
          this.currentRoll = 1;
          this.resetBallOnly();
          this.isRolling = false;
        }
      } else if (this.currentRoll === 1) {
        if (frame.isStrike) {
          // After a strike in frame 10
          if (allDown) {
            frame.isSpare = true;
            this.message = 'SPARE!';
            this.resetPinsOnly();
          }
          this.currentRoll = 2;
          this.resetBallOnly();
          this.isRolling = false;
        } else if (allDown) {
          // Spare
          frame.isSpare = true;
          this.message = 'SPARE!';
          // Reset pins for bonus roll
          this.resetPinsOnly();
          this.currentRoll = 2;
          this.resetBallOnly();
          this.isRolling = false;
        } else {
          // No spare, game over
          this.calculateScores();
          this.isGameOver = true;
          this.isRolling = false;
        }
      } else {
        // Third roll in frame 10
        this.calculateScores();
        this.isGameOver = true;
        this.isRolling = false;
      }
    }

    // Recalculate scores
    this.calculateScores();
  }

  private advanceFrame(): void {
    this.currentFrame++;
    this.currentRoll = 0;
    this.pinsDown = 0;
    this.allPinsDown = false;

    if (this.currentFrame >= TOTAL_FRAMES) {
      this.calculateScores();
      this.isGameOver = true;
      this.isRolling = false;
    } else {
      this.resetPinsOnly();
      this.resetBallOnly();
      this.isRolling = false;
    }
  }

  private resetBallOnly(): void {
    this.ball = this.createBall();
    this.aimAngle = 0;
  }

  private resetPinsOnly(): void {
    this.pins = this.createPins();
    this.pinsDown = 0;
    this.allPinsDown = false;
  }

  private calculateScores(): void {
    let cumulative = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const frame = this.frames[i];

      if (frame.rolls.length === 0) {
        frame.score = null;
        continue;
      }

      if (i < 9) {
        // Normal frames
        if (frame.isStrike) {
          // Strike: need next 2 rolls
          const nextRolls = this.getNextRolls(i, 2);
          if (nextRolls !== null) {
            cumulative += 10 + nextRolls;
            frame.score = cumulative;
          } else {
            frame.score = null;
          }
        } else if (frame.isSpare) {
          // Spare: need next 1 roll
          const nextRolls = this.getNextRolls(i, 1);
          if (nextRolls !== null) {
            cumulative += 10 + nextRolls;
            frame.score = cumulative;
          } else {
            frame.score = null;
          }
        } else if (frame.rolls.length >= 2) {
          cumulative += frame.rolls[1];
          frame.score = cumulative;
        } else {
          frame.score = null;
        }
      } else {
        // Frame 10: just sum all rolls
        let sum = 0;
        for (const roll of frame.rolls) {
          sum += roll;
        }
        cumulative += sum;
        frame.score = cumulative;
      }
    }

    this.totalScore = cumulative;
  }

  private getNextRolls(frameIndex: number, count: number): number | null {
    const rolls: number[] = [];

    for (let i = frameIndex + 1; i < TOTAL_FRAMES && rolls.length < count; i++) {
      const frame = this.frames[i];
      if (frame.rolls.length === 0) return null;

      for (const roll of frame.rolls) {
        rolls.push(roll);
        if (rolls.length >= count) break;
      }
    }

    return rolls.length >= count ? rolls.reduce((a, b) => a + b, 0) : null;
  }
}
