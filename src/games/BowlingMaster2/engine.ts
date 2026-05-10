// BowlingMaster2 - 3D Style Bowling Game Engine

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  rotation: number;
  spinX: number;
  spinY: number;
  isRolling: boolean;
}

export interface Pin {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  height: number;
  isStanding: boolean;
  vx: number;
  vy: number;
  vz: number;
  rotationX: number;
  rotationZ: number;
  fallenTime: number;
}

export interface LaneMarking {
  x: number;
  y: number;
  type: 'dot' | 'arrow' | 'foul_line';
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
  size: number;
}

export interface BowlingMaster2State {
  ball: Ball;
  pins: Pin[];
  score: number;
  frame: number;
  throwNumber: number;
  phase: 'aiming' | 'charging' | 'rolling' | 'settling' | 'scoring' | 'gameover';
  power: number;
  angle: number;
  spin: number;
  pinsDown: number;
  totalPinsKnocked: number;
  isStrike: boolean;
  isSpare: boolean;
  message: string;
  particles: Particle[];
  cameraAngle: number;
  throwHistory: { frame: number; throw1: number; throw2: number; throw3?: number; score: number }[];
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 700;
const GRAVITY = 0.12;
const FRICTION = 0.992;
const BALL_RADIUS = 16;
const PIN_RADIUS = 9;
const PIN_HEIGHT = 38;
const LANE_LENGTH = 550;
const PIN_SPACING = 32;

const PIN_POSITIONS = [
  { row: 0, offset: 0 },
  { row: 1, offset: -0.5 },
  { row: 1, offset: 0.5 },
  { row: 2, offset: -1 },
  { row: 2, offset: 0 },
  { row: 2, offset: 1 },
  { row: 3, offset: -1.5 },
  { row: 3, offset: -0.5 },
  { row: 3, offset: 0.5 },
  { row: 3, offset: 1.5 },
];

export class BowlingMaster2Engine {
  private ball: Ball;
  private pins: Pin[];
  private score: number;
  private frame: number;
  private throwNumber: number;
  private phase: 'aiming' | 'charging' | 'rolling' | 'settling' | 'scoring' | 'gameover';
  private power: number;
  private angle: number;
  private spin: number;
  private pinsDownThisThrow: number;
  private totalPinsKnocked: number;
  private isStrike: boolean;
  private isSpare: boolean;
  private message: string;
  private particles: Particle[];
  private settleTimer: number;
  private laneStartY: number;
  private laneEndY: number;
  private ballStartY: number;
  private cameraAngle: number;
  private throwHistory: { frame: number; throw1: number; throw2: number; throw3?: number; score: number }[];

  constructor() {
    this.laneStartY = 100;
    this.laneEndY = LANE_LENGTH;
    this.ballStartY = CANVAS_HEIGHT - 100;
    this.ball = this.createBall();
    this.pins = this.createPins();
    this.score = 0;
    this.frame = 1;
    this.throwNumber = 1;
    this.phase = 'aiming';
    this.power = 0;
    this.angle = 0;
    this.spin = 0;
    this.pinsDownThisThrow = 0;
    this.totalPinsKnocked = 0;
    this.isStrike = false;
    this.isSpare = false;
    this.message = '';
    this.particles = [];
    this.settleTimer = 0;
    this.cameraAngle = 0;
    this.throwHistory = [];
  }

  private createBall(): Ball {
    return {
      x: CANVAS_WIDTH / 2,
      y: this.ballStartY,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: BALL_RADIUS,
      rotation: 0,
      spinX: 0,
      spinY: 0,
      isRolling: false,
    };
  }

  private createPins(): Pin[] {
    const startX = CANVAS_WIDTH / 2;
    const startY = this.laneStartY;

    return PIN_POSITIONS.map((pos, i) => ({
      id: i,
      x: startX + pos.offset * PIN_SPACING,
      y: startY + pos.row * PIN_SPACING * 0.866,
      z: 0,
      radius: PIN_RADIUS,
      height: PIN_HEIGHT,
      isStanding: true,
      vx: 0,
      vy: 0,
      vz: 0,
      rotationX: 0,
      rotationZ: 0,
      fallenTime: 0,
    }));
  }

  getState(): BowlingMaster2State {
    return {
      ball: { ...this.ball },
      pins: this.pins.map(p => ({ ...p })),
      score: this.score,
      frame: this.frame,
      throwNumber: this.throwNumber,
      phase: this.phase,
      power: this.power,
      angle: this.angle,
      spin: this.spin,
      pinsDown: this.pinsDownThisThrow,
      totalPinsKnocked: this.totalPinsKnocked,
      isStrike: this.isStrike,
      isSpare: this.isSpare,
      message: this.message,
      particles: this.particles.map(p => ({ ...p })),
      cameraAngle: this.cameraAngle,
      throwHistory: [...this.throwHistory],
    };
  }

  setPower(power: number): void {
    this.power = Math.max(0, Math.min(20, power));
  }

  setAngle(angle: number): void {
    this.angle = Math.max(-1, Math.min(1, angle));
  }

  setSpin(spin: number): void {
    this.spin = Math.max(-1, Math.min(1, spin));
  }

  startCharging(): void {
    if (this.phase !== 'aiming') return;
    this.phase = 'charging';
    this.power = 0;
  }

  throw(): void {
    if (this.phase !== 'charging') return;

    const throwPower = Math.max(5, this.power);
    this.ball.vy = -throwPower * 1.8;
    this.ball.vx = this.angle * 8 + this.spin * 2;
    this.ball.spinX = this.spin * 0.15;
    this.ball.spinY = throwPower * 0.05;
    this.ball.isRolling = true;
    this.phase = 'rolling';
  }

  private createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        z: 0,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        vz: Math.random() * 3,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  private checkBallPinCollision(): void {
    for (const pin of this.pins) {
      if (!pin.isStanding) continue;

      const dx = this.ball.x - pin.x;
      const dy = this.ball.y - pin.y;
      const dz = this.ball.z - pin.z;
      const dist2D = Math.sqrt(dx * dx + dy * dy);
      const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const collisionThreshold = this.ball.radius + pin.radius + 2;

      if (dist3D < collisionThreshold && this.ball.z < pin.height) {
        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        const nx = dx / (dist2D || 1);
        const ny = dy / (dist2D || 1);

        pin.vx = nx * speed * 0.9 + this.spin * ny * 0.5;
        pin.vy = ny * speed * 0.9;
        pin.vz = (Math.random() - 0.5) * 2;
        pin.isStanding = false;

        this.ball.vx *= 0.88;
        this.ball.vy *= 0.92;

        this.createParticles(pin.x, pin.y, '#ffffff', 5);
      }
    }
  }

  private checkPinPinCollision(): void {
    for (let i = 0; i < this.pins.length; i++) {
      for (let j = i + 1; j < this.pins.length; j++) {
        const a = this.pins[i];
        const b = this.pins[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius + b.radius && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (a.radius + b.radius - dist) / 2;

          if (!a.isStanding && b.isStanding) {
            const impactSpeed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            if (impactSpeed > 0.8) {
              b.vx = -nx * impactSpeed * 0.7;
              b.vy = -ny * impactSpeed * 0.7;
              b.vz = Math.random() * 2;
              b.isStanding = false;
              this.createParticles(b.x, b.y, '#ffffff', 3);
            }
          } else if (a.isStanding && !b.isStanding) {
            const impactSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (impactSpeed > 0.8) {
              a.vx = nx * impactSpeed * 0.7;
              a.vy = ny * impactSpeed * 0.7;
              a.vz = Math.random() * 2;
              a.isStanding = false;
              this.createParticles(a.x, a.y, '#ffffff', 3);
            }
          } else if (!a.isStanding && !b.isStanding) {
            a.vx -= nx * overlap * 0.3;
            a.vy -= ny * overlap * 0.3;
            b.vx += nx * overlap * 0.3;
            b.vy += ny * overlap * 0.3;
          }
        }
      }
    }
  }

  tick(): void {
    if (this.phase === 'aiming' || this.phase === 'gameover') {
      this.cameraAngle = Math.sin(Date.now() / 1000) * 0.05;
      return;
    }

    if (this.phase === 'charging') {
      this.power = Math.min(this.power + 0.15, 20);
      return;
    }

    if (this.ball.isRolling) {
      this.ball.vy += GRAVITY;
      this.ball.vx += this.ball.spinX;
      this.ball.vx *= FRICTION;
      this.ball.vy *= FRICTION;

      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.rotation += this.ball.vy * 0.1;

      const laneLeft = 80;
      const laneRight = CANVAS_WIDTH - 80;

      if (this.ball.x - this.ball.radius < laneLeft) {
        this.ball.x = laneLeft + this.ball.radius;
        this.ball.vx *= -0.4;
        this.ball.spinX *= -0.5;
      }
      if (this.ball.x + this.ball.radius > laneRight) {
        this.ball.x = laneRight - this.ball.radius;
        this.ball.vx *= -0.4;
        this.ball.spinX *= -0.5;
      }

      this.checkBallPinCollision();
    }

    for (const pin of this.pins) {
      if (pin.isStanding) continue;

      pin.vy += GRAVITY * 0.8;
      pin.vx *= 0.96;
      pin.vy *= 0.96;

      pin.x += pin.vx;
      pin.y += pin.vy;

      pin.rotationX += pin.vx * 0.1;
      pin.rotationZ += pin.vy * 0.1;
      pin.fallenTime++;

      const groundY = this.laneStartY + pin.height;
      if (pin.y + pin.radius > groundY) {
        pin.y = groundY - pin.radius;
        pin.vy *= -0.2;
        pin.vx *= 0.7;
      }
    }

    this.checkPinPinCollision();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.vz -= 0.1;
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    const ballSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);

    if (this.phase === 'rolling') {
      if (this.ball.y < this.laneStartY + 50 || ballSpeed < 0.3) {
        this.phase = 'settling';
        this.settleTimer = 0;
      }
    }

    if (this.phase === 'settling') {
      this.settleTimer++;

      let pinsMoving = false;
      for (const pin of this.pins) {
        if (!pin.isStanding) {
          const pinSpeed = Math.sqrt(pin.vx * pin.vx + pin.vy * pin.vy);
          if (pinSpeed > 0.1) {
            pinsMoving = true;
          }
        }
      }

      if (!pinsMoving && this.settleTimer > 45) {
        this.calculateScore();
        this.phase = 'scoring';
        this.settleTimer = 0;
      }

      if (this.settleTimer > 120) {
        this.calculateScore();
        this.phase = 'scoring';
      }
    }
  }

  private calculateScore(): void {
    const standingPins = this.pins.filter(p => p.isStanding).length;
    const knockedDown = 10 - standingPins;
    const newlyKnocked = knockedDown - this.totalPinsKnocked;

    this.pinsDownThisThrow = newlyKnocked;

    if (this.throwNumber === 1) {
      if (knockedDown === 10) {
        this.isStrike = true;
        this.message = 'STRIKE!';
        this.createParticles(CANVAS_WIDTH / 2, this.laneStartY + 100, '#ffd700', 30);
        this.addToHistory(this.frame, 10, 0);
      } else {
        this.totalPinsKnocked = knockedDown;
        this.addToHistory(this.frame, newlyKnocked, 0);
      }
    } else if (this.throwNumber === 2) {
      if (knockedDown === 10 && this.throwHistory[this.throwHistory.length - 1]?.throw1 !== 10) {
        this.isSpare = true;
        this.message = 'SPARE!';
        this.createParticles(CANVAS_WIDTH / 2, this.laneStartY + 100, '#00ffff', 20);
        this.updateLastHistory(this.frame, this.throwHistory[this.throwHistory.length - 1]?.throw1 || 0, newlyKnocked);
      } else {
        this.totalPinsKnocked = knockedDown;
        this.updateLastHistory(this.frame, this.throwHistory[this.throwHistory.length - 1]?.throw1 || 0, newlyKnocked);
      }
    }

    this.calculateTotalScore();
  }

  private addToHistory(frame: number, throw1: number, throw2: number): void {
    const lastEntry = this.throwHistory[this.throwHistory.length - 1];
    if (lastEntry && lastEntry.frame === frame) {
      lastEntry.throw2 = throw2;
    } else {
      this.throwHistory.push({ frame, throw1, throw2, score: 0 });
    }
  }

  private updateLastHistory(frame: number, throw1: number, throw2: number): void {
    const lastEntry = this.throwHistory[this.throwHistory.length - 1];
    if (lastEntry && lastEntry.frame === frame) {
      lastEntry.throw2 = throw2;
    } else {
      this.throwHistory.push({ frame, throw1, throw2, score: 0 });
    }
  }

  private calculateTotalScore(): void {
    let total = 0;

    for (let i = 0; i < this.throwHistory.length; i++) {
      const entry = this.throwHistory[i];
      let frameScore = entry.throw1 + (entry.throw2 || 0);

      if (entry.throw1 === 10) {
        const next1 = this.throwHistory[i + 1]?.throw1 || 0;
        const next2 = this.throwHistory[i + 1]?.throw2 ?? (this.throwHistory[i + 2]?.throw1 || 0);
        frameScore += next1 + next2;
      } else if (entry.throw1 + (entry.throw2 || 0) === 10) {
        const next1 = this.throwHistory[i + 1]?.throw1 || 0;
        frameScore += next1;
      }

      entry.score = total + frameScore;
      total += entry.throw1 + (entry.throw2 || 0);

      if (entry.throw1 === 10) {
        const next1 = this.throwHistory[i + 1]?.throw1 || 0;
        const next2 = this.throwHistory[i + 1]?.throw2 ?? (this.throwHistory[i + 2]?.throw1 || 0);
        total += next1 + next2;
        i++;
      } else if (entry.throw1 + (entry.throw2 || 0) === 10) {
        const next1 = this.throwHistory[i + 1]?.throw1 || 0;
        total += next1;
      }
    }

    this.score = total;
  }

  nextThrow(): void {
    if (this.frame >= 10) {
      if (this.throwNumber === 1 && this.pinsDownThisThrow === 10) {
        this.throwNumber = 2;
        this.resetPins();
        this.resetBall();
        this.phase = 'aiming';
        this.isStrike = false;
        return;
      } else if (this.throwNumber === 2) {
        const lastEntry = this.throwHistory[this.throwHistory.length - 1];
        if (lastEntry && (lastEntry.throw1 === 10 || lastEntry.throw1 + lastEntry.throw2 === 10)) {
          this.throwNumber = 3;
          this.resetPins();
          this.resetBall();
          this.phase = 'aiming';
          this.isSpare = false;
          return;
        }
      }
      this.phase = 'gameover';
      return;
    }

    if (this.throwNumber === 1 && this.pinsDownThisThrow === 10) {
      this.frame++;
      this.throwNumber = 1;
      this.resetPins();
      this.totalPinsKnocked = 0;
    } else if (this.throwNumber === 1) {
      this.throwNumber = 2;
      this.resetBall();
    } else {
      this.frame++;
      this.throwNumber = 1;
      this.resetPins();
      this.totalPinsKnocked = 0;
    }

    this.resetBall();
    this.phase = 'aiming';
    this.isStrike = false;
    this.isSpare = false;
    this.message = '';
  }

  private resetBall(): void {
    this.ball = this.createBall();
    this.ball.isRolling = false;
    this.power = 0;
    this.angle = 0;
    this.spin = 0;
  }

  private resetPins(): void {
    this.pins = this.createPins();
  }

  reset(): void {
    this.ball = this.createBall();
    this.pins = this.createPins();
    this.score = 0;
    this.frame = 1;
    this.throwNumber = 1;
    this.phase = 'aiming';
    this.power = 0;
    this.angle = 0;
    this.spin = 0;
    this.pinsDownThisThrow = 0;
    this.totalPinsKnocked = 0;
    this.isStrike = false;
    this.isSpare = false;
    this.message = '';
    this.particles = [];
    this.settleTimer = 0;
    this.throwHistory = [];
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getLaneY() {
    return this.laneStartY;
  }
}
