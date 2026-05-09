import { PINBALL_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  FLIPPER_LENGTH,
  FLIPPER_WIDTH,
  GRAVITY,
  BUMPER_RADIUS
} = PINBALL_CONSTANTS;

// ---- Types ----

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface Flipper {
  x: number;
  y: number;
  length: number;
  width: number;
  angle: number;        // current rotation angle (radians)
  restAngle: number;    // resting angle
  activeAngle: number;  // angle when activated
  isActive: boolean;
  side: 'left' | 'right';
}

export interface Bumper {
  x: number;
  y: number;
  radius: number;
  color: string;
  hitTimer: number;     // flash effect timer
}

export interface Launcher {
  x: number;
  y: number;
  width: number;
  height: number;
  power: number;        // 0..1 charging power
  isCharging: boolean;
  maxPower: number;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PinballState {
  ball: Ball;
  leftFlipper: Flipper;
  rightFlipper: Flipper;
  launcher: Launcher;
  bumpers: Bumper[];
  walls: Wall[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isLaunching: boolean;  // ball is in launcher, waiting to fire
}

// ---- Colors ----

const BUMPER_COLORS = ['#ff6b9d', '#00d2ff', '#a855f7', '#ffd700', '#39ff14'];

// ---- Helper Functions ----

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Point-to-line-segment distance and closest point
function pointToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): { dist: number; cx: number; cy: number; nx: number; ny: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const d = dist(px, py, x1, y1);
    const nx = d > 0 ? (px - x1) / d : 0;
    const ny = d > 0 ? (py - y1) / d : -1;
    return { dist: d, cx: x1, cy: y1, nx, ny };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);

  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const d = dist(px, py, cx, cy);

  // Normal pointing from segment toward ball
  let nx = d > 0 ? (px - cx) / d : 0;
  let ny = d > 0 ? (py - cy) / d : -1;

  return { dist: d, cx, cy, nx, ny };
}

// ---- Engine ----

export class PinballEngine {
  private ball: Ball;
  private leftFlipper: Flipper;
  private rightFlipper: Flipper;
  private launcher: Launcher;
  private bumpers: Bumper[];
  private walls: Wall[];
  private score: number;
  private lives: number;
  private isGameOver: boolean;
  private isLaunching: boolean;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;

    this.ball = this.createBall();
    this.leftFlipper = this.createFlipper('left');
    this.rightFlipper = this.createFlipper('right');
    this.launcher = this.createLauncher();
    this.bumpers = this.createBumpers();
    this.walls = this.createWalls();
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isLaunching = true;
  }

  // ---- Initialization ----

  private createBall(): Ball {
    return {
      x: this.canvasWidth - 20,
      y: this.canvasHeight - 60,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      active: false
    };
  }

  private createFlipper(side: 'left' | 'right'): Flipper {
    const y = this.canvasHeight - 80;
    const isLeft = side === 'left';

    return {
      x: isLeft ? 100 : this.canvasWidth - 100,
      y: y,
      length: FLIPPER_LENGTH,
      width: FLIPPER_WIDTH,
      angle: isLeft ? 0.4 : Math.PI - 0.4,       // rest angle
      restAngle: isLeft ? 0.4 : Math.PI - 0.4,
      activeAngle: isLeft ? -0.5 : Math.PI + 0.5,   // activated angle
      isActive: false,
      side
    };
  }

  private createLauncher(): Launcher {
    return {
      x: this.canvasWidth - 25,
      y: this.canvasHeight - 200,
      width: 20,
      height: 150,
      power: 0,
      isCharging: false,
      maxPower: 18
    };
  }

  private createBumpers(): Bumper[] {
    const cx = this.canvasWidth / 2;
    return [
      { x: cx, y: 180, radius: BUMPER_RADIUS, color: BUMPER_COLORS[0], hitTimer: 0 },
      { x: cx - 70, y: 260, radius: BUMPER_RADIUS, color: BUMPER_COLORS[1], hitTimer: 0 },
      { x: cx + 70, y: 260, radius: BUMPER_RADIUS, color: BUMPER_COLORS[2], hitTimer: 0 },
      { x: cx - 40, y: 370, radius: BUMPER_RADIUS - 3, color: BUMPER_COLORS[3], hitTimer: 0 },
      { x: cx + 40, y: 370, radius: BUMPER_RADIUS - 3, color: BUMPER_COLORS[4], hitTimer: 0 },
      { x: cx, y: 480, radius: BUMPER_RADIUS - 5, color: BUMPER_COLORS[0], hitTimer: 0 },
    ];
  }

  private createWalls(): Wall[] {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    // Launcher lane separator
    const laneX = w - 40;

    return [
      // Left wall
      { x1: 10, y1: 0, x2: 10, y2: h },
      // Right wall (above launcher lane)
      { x1: w - 10, y1: 0, x2: w - 10, y2: h - 200 },
      // Launcher lane left wall
      { x1: laneX, y1: h - 200, x2: laneX, y2: h },
      // Launcher lane right wall
      { x1: w - 10, y1: h - 200, x2: w - 10, y2: h },
      // Top wall
      { x1: 10, y1: 10, x2: w - 10, y2: 10 },
      // Top-left diagonal guide
      { x1: 10, y1: 100, x2: 60, y2: 50 },
      // Top-right diagonal guide
      { x1: w - 60, y1: 50, x2: w - 10, y2: 100 },
      // Left lower guide toward flipper
      { x1: 10, y1: h - 200, x2: 60, y2: h - 80 },
      // Right lower guide toward flipper
      { x1: w - 60, y1: h - 80, x2: w - 40, y2: h - 200 },
    ];
  }

  // ---- Public API ----

  getState(): PinballState {
    return {
      ball: { ...this.ball },
      leftFlipper: { ...this.leftFlipper },
      rightFlipper: { ...this.rightFlipper },
      launcher: { ...this.launcher },
      bumpers: this.bumpers.map(b => ({ ...b })),
      walls: this.walls.map(w => ({ ...w })),
      score: this.score,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isLaunching: this.isLaunching
    };
  }

  activateLeftFlipper(): void {
    this.leftFlipper.isActive = true;
  }

  deactivateLeftFlipper(): void {
    this.leftFlipper.isActive = false;
  }

  activateRightFlipper(): void {
    this.rightFlipper.isActive = true;
  }

  deactivateRightFlipper(): void {
    this.rightFlipper.isActive = false;
  }

  startChargingLauncher(): void {
    if (!this.isLaunching || this.isGameOver) return;
    this.launcher.isCharging = true;
    this.launcher.power = 0;
  }

  releaseLauncher(): void {
    if (!this.isLaunching || !this.launcher.isCharging || this.isGameOver) return;
    this.launcher.isCharging = false;

    const power = Math.max(this.launcher.power, 5);
    this.ball.vy = -power;
    this.ball.vx = -0.5; // slight left push to enter play area
    this.ball.active = true;
    this.isLaunching = false;
    this.launcher.power = 0;
  }

  reset(): void {
    this.ball = this.createBall();
    this.leftFlipper = this.createFlipper('left');
    this.rightFlipper = this.createFlipper('right');
    this.launcher = this.createLauncher();
    this.bumpers = this.createBumpers();
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isLaunching = true;
  }

  // ---- Game Loop ----

  tick(): boolean {
    if (this.isGameOver) return false;

    // Update launcher charge
    if (this.launcher.isCharging) {
      this.launcher.power = Math.min(this.launcher.power + 0.3, this.launcher.maxPower);
    }

    // Update flipper angles (smooth rotation)
    this.updateFlipper(this.leftFlipper);
    this.updateFlipper(this.rightFlipper);

    // Update bumper hit timers
    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) {
        bumper.hitTimer -= 1;
      }
    }

    // If ball is not active (waiting to launch), position it in launcher
    if (this.isLaunching) {
      this.ball.x = this.launcher.x;
      this.ball.y = this.launcher.y + this.launcher.height - 20;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.active = false;
      return true;
    }

    if (!this.ball.active) return false;

    // Apply gravity
    this.ball.vy += GRAVITY;

    // Apply slight friction
    this.ball.vx *= 0.999;
    this.ball.vy *= 0.999;

    // Cap velocity
    const maxSpeed = 20;
    const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
    if (speed > maxSpeed) {
      this.ball.vx = (this.ball.vx / speed) * maxSpeed;
      this.ball.vy = (this.ball.vy / speed) * maxSpeed;
    }

    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Collision with walls
    this.collideWalls();

    // Collision with bumpers
    this.collideBumpers();

    // Collision with flippers
    this.collideFlipper(this.leftFlipper);
    this.collideFlipper(this.rightFlipper);

    // Check if ball fell out the bottom
    if (this.ball.y - this.ball.radius > this.canvasHeight) {
      this.lives--;
      if (this.lives <= 0) {
        this.isGameOver = true;
        this.ball.active = false;
      } else {
        // Reset ball to launcher
        this.ball = this.createBall();
        this.isLaunching = true;
      }
    }

    return true;
  }

  // ---- Flipper Update ----

  private updateFlipper(flipper: Flipper): void {
    const targetAngle = flipper.isActive ? flipper.activeAngle : flipper.restAngle;
    const diff = targetAngle - flipper.angle;
    const speed = 0.25;

    if (Math.abs(diff) < speed) {
      flipper.angle = targetAngle;
    } else {
      flipper.angle += diff > 0 ? speed : -speed;
    }
  }

  // ---- Wall Collision ----

  private collideWalls(): void {
    for (const wall of this.walls) {
      const result = pointToSegment(
        this.ball.x, this.ball.y,
        wall.x1, wall.y1, wall.x2, wall.y2
      );

      if (result.dist < this.ball.radius) {
        // Push ball out
        const overlap = this.ball.radius - result.dist;
        this.ball.x += result.nx * overlap;
        this.ball.y += result.ny * overlap;

        // Reflect velocity
        const dot = this.ball.vx * result.nx + this.ball.vy * result.ny;
        this.ball.vx -= 2 * dot * result.nx;
        this.ball.vy -= 2 * dot * result.ny;

        // Damping
        this.ball.vx *= 0.85;
        this.ball.vy *= 0.85;
      }
    }
  }

  // ---- Bumper Collision ----

  private collideBumpers(): void {
    for (const bumper of this.bumpers) {
      const d = dist(this.ball.x, this.ball.y, bumper.x, bumper.y);
      const minDist = this.ball.radius + bumper.radius;

      if (d < minDist && d > 0) {
        // Normal from bumper center to ball
        const nx = (this.ball.x - bumper.x) / d;
        const ny = (this.ball.y - bumper.y) / d;

        // Push ball out
        const overlap = minDist - d;
        this.ball.x += nx * overlap;
        this.ball.y += ny * overlap;

        // Reflect and boost
        const dot = this.ball.vx * nx + this.ball.vy * ny;
        this.ball.vx -= 2 * dot * nx;
        this.ball.vy -= 2 * dot * ny;

        // Bumper boost
        const boostSpeed = 5;
        this.ball.vx += nx * boostSpeed;
        this.ball.vy += ny * boostSpeed;

        // Score
        this.score += 100;
        bumper.hitTimer = 15;
      }
    }
  }

  // ---- Flipper Collision ----

  private collideFlipper(flipper: Flipper): void {
    // Flipper tip position
    const tipX = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const tipY = flipper.y + Math.sin(flipper.angle) * flipper.length;

    // Check distance from ball to flipper line segment
    const result = pointToSegment(
      this.ball.x, this.ball.y,
      flipper.x, flipper.y,
      tipX, tipY
    );

    const collisionDist = this.ball.radius + flipper.width / 2;

    if (result.dist < collisionDist) {
      // Push ball out
      const overlap = collisionDist - result.dist;
      this.ball.x += result.nx * overlap;
      this.ball.y += result.ny * overlap;

      // Reflect velocity
      const dot = this.ball.vx * result.nx + this.ball.vy * result.ny;
      this.ball.vx -= 2 * dot * result.nx;
      this.ball.vy -= 2 * dot * result.ny;

      // If flipper is active, give extra upward kick
      if (flipper.isActive) {
        const kickStrength = 8;
        this.ball.vy -= kickStrength;

        // Add horizontal component based on which side
        if (flipper.side === 'left') {
          this.ball.vx += 3;
        } else {
          this.ball.vx -= 3;
        }

        this.score += 10;
      }

      // Damping
      this.ball.vx *= 0.9;
      this.ball.vy *= 0.9;
    }
  }
}
