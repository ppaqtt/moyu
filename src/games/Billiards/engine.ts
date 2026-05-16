import { BILLIARDS_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  POCKET_RADIUS,
  FRICTION,
  MIN_SPEED
} = BILLIARDS_CONSTANTS;

// ---- Types ----

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  stripe: boolean;
  number: number;
  pocketed: boolean;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export type GameState = 'idle' | 'aiming' | 'playing' | 'gameover';

export interface BilliardsState {
  balls: Ball[];
  pockets: Pocket[];
  cueBall: Ball;
  gameState: GameState;
  isCharging: boolean;
  chargePower: number;
  aimAngle: number;
  aimX: number;
  aimY: number;
  pocketedBalls: number[];
  shotCount: number;
  isGameOver: boolean;
  isWin: boolean;
  message: string;
  foul: boolean;
  allMoving: boolean;
}

// ---- Ball Colors ----

const BALL_COLORS: Record<number, string> = {
  0: '#ffffff',   // cue ball
  1: '#f5d442',   // yellow
  2: '#2563eb',   // blue
  3: '#dc2626',   // red
  4: '#7c3aed',   // purple
  5: '#f97316',   // orange
  6: '#16a34a',   // green
  7: '#92400e',   // maroon/brown
  8: '#111111',   // black (8-ball)
  9: '#f5d442',   // yellow stripe
  10: '#2563eb',  // blue stripe
  11: '#dc2626',  // red stripe
  12: '#7c3aed',  // purple stripe
  13: '#f97316',  // orange stripe
  14: '#16a34a',  // green stripe
  15: '#92400e',  // maroon/brown stripe
};

// ---- Helper Functions ----

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function createBall(id: number, x: number, y: number): Ball {
  const isStripe = id >= 9;
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: BALL_COLORS[id] || '#ffffff',
    stripe: isStripe,
    number: id,
    pocketed: false
  };
}

// ---- Engine ----

export class BilliardsEngine {
  private balls: Ball[];
  private pockets: Pocket[];
  private gameState: GameState;
  private isCharging: boolean;
  private chargePower: number;
  private aimAngle: number;
  private aimX: number;
  private aimY: number;
  private pocketedBalls: number[];
  private shotCount: number;
  private isGameOver: boolean;
  private isWin: boolean;
  private message: string;
  private foul: boolean;
  private settleTimer: number;

  // Table boundaries (play area with cushions)
  private tableLeft: number;
  private tableRight: number;
  private tableTop: number;
  private tableBottom: number;

  constructor() {
    this.tableLeft = BALL_RADIUS + 20;
    this.tableRight = CANVAS_WIDTH - BALL_RADIUS - 20;
    this.tableTop = BALL_RADIUS + 20;
    this.tableBottom = CANVAS_HEIGHT - BALL_RADIUS - 20;

    this.pockets = this.createPockets();
    this.balls = [];
    this.gameState = 'idle';
    this.isCharging = false;
    this.chargePower = 0;
    this.aimAngle = 0;
    this.aimX = CANVAS_WIDTH / 2;
    this.aimY = CANVAS_HEIGHT / 2;
    this.pocketedBalls = [];
    this.shotCount = 0;
    this.isGameOver = false;
    this.isWin = false;
    this.message = '';
    this.foul = false;
    this.settleTimer = 0;

    this.initBalls();
  }

  // ---- Initialization ----

  private createPockets(): Pocket[] {
    const offset = 5;
    return [
      // Four corners
      { x: offset, y: offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: offset, radius: POCKET_RADIUS },
      { x: offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      // Middle sides
      { x: CANVAS_WIDTH / 2, y: offset - 3, radius: POCKET_RADIUS - 2 },
      { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - offset + 3, radius: POCKET_RADIUS - 2 },
    ];
  }

  private initBalls(): void {
    this.balls = [];

    // Cue ball position (left quarter of table)
    const cueBall = createBall(0, CANVAS_WIDTH * 0.25, CANVAS_HEIGHT / 2);
    this.balls.push(cueBall);

    // Rack position (right side of table)
    const rackX = CANVAS_WIDTH * 0.72;
    const rackY = CANVAS_HEIGHT / 2;
    const spacing = BALL_RADIUS * 2.1;

    // Standard 8-ball rack arrangement (5 rows)
    // Row 0: 1 ball, Row 1: 2 balls, Row 2: 3 balls, Row 3: 4 balls, Row 4: 5 balls
    // 8-ball must be in the center of row 2
    // One solid and one stripe in the bottom corners
    const rackOrder = [
      [1],
      [9, 2],
      [3, 8, 10],
      [11, 4, 5, 12],
      [13, 6, 14, 7, 15]
    ];

    for (let row = 0; row < rackOrder.length; row++) {
      const numInRow = rackOrder[row].length;
      const startX = rackX - row * spacing * Math.cos(Math.PI / 6);
      for (let col = 0; col < numInRow; col++) {
        const startY = rackY + (col - (numInRow - 1) / 2) * spacing;
        const ball = createBall(rackOrder[row][col], startX, startY);
        this.balls.push(ball);
      }
    }
  }

  // ---- Public API ----

  getState(): BilliardsState {
    const cueBall = this.balls.find(b => b.id === 0)!;
    return {
      balls: this.balls.map(b => ({ ...b })),
      pockets: this.pockets.map(p => ({ ...p })),
      cueBall: { ...cueBall },
      gameState: this.gameState,
      isCharging: this.isCharging,
      chargePower: this.chargePower,
      aimAngle: this.aimAngle,
      aimX: this.aimX,
      aimY: this.aimY,
      pocketedBalls: [...this.pocketedBalls],
      shotCount: this.shotCount,
      isGameOver: this.isGameOver,
      isWin: this.isWin,
      message: this.message,
      foul: this.foul,
      allMoving: this.areBallsMoving()
    };
  }

  setAim(x: number, y: number): void {
    if (this.gameState !== 'aiming' && this.gameState !== 'playing') return;
    if (this.areBallsMoving()) return;

    const cueBall = this.balls.find(b => b.id === 0);
    if (!cueBall || cueBall.pocketed) return;

    this.aimX = x;
    this.aimY = y;

    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    this.aimAngle = Math.atan2(dy, dx);
    this.gameState = 'aiming';
  }

  startCharging(): void {
    if (this.isGameOver) return;
    if (this.gameState !== 'aiming' && this.gameState !== 'playing') return;
    if (this.areBallsMoving()) return;

    const cueBall = this.balls.find(b => b.id === 0);
    if (!cueBall || cueBall.pocketed) return;

    this.isCharging = true;
    this.chargePower = 0;
  }

  releaseShot(): void {
    if (!this.isCharging || this.isGameOver) return;

    this.isCharging = false;

    const cueBall = this.balls.find(b => b.id === 0);
    if (!cueBall || cueBall.pocketed) return;

    const power = Math.max(this.chargePower, 2);
    const speed = power * 0.8;

    cueBall.vx = Math.cos(this.aimAngle) * speed;
    cueBall.vy = Math.sin(this.aimAngle) * speed;

    this.shotCount++;
    this.gameState = 'playing';
    this.message = '';
    this.foul = false;
    this.chargePower = 0;
  }

  reset(): void {
    this.initBalls();
    this.gameState = 'idle';
    this.isCharging = false;
    this.chargePower = 0;
    this.aimAngle = 0;
    this.aimX = CANVAS_WIDTH / 2;
    this.aimY = CANVAS_HEIGHT / 2;
    this.pocketedBalls = [];
    this.shotCount = 0;
    this.isGameOver = false;
    this.isWin = false;
    this.message = '';
    this.foul = false;
    this.settleTimer = 0;
  }

  // ---- Game Loop ----

  tick(): boolean {
    if (this.isGameOver) return false;

    // Update charge power
    if (this.isCharging) {
      this.chargePower = Math.min(this.chargePower + 0.2, 18);
    }

    // Physics update
    this.updateBalls();
    this.checkBallCollisions();
    this.checkWallCollisions();
    this.checkPockets();

    // Check if all balls have stopped
    if (this.gameState === 'playing' && !this.areBallsMoving()) {
      this.settleTimer++;
      if (this.settleTimer > 20) {
        this.onBallsSettled();
        this.settleTimer = 0;
      }
    } else {
      this.settleTimer = 0;
    }

    return true;
  }

  // ---- Physics ----

  private areBallsMoving(): boolean {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > MIN_SPEED) return true;
    }
    return false;
  }

  private updateBalls(): void {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;

      // Apply friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Stop if below threshold
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed < MIN_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }

      // Move
      ball.x += ball.vx;
      ball.y += ball.vy;
    }
  }

  private checkBallCollisions(): void {
    for (let i = 0; i < this.balls.length; i++) {
      const a = this.balls[i];
      if (a.pocketed) continue;

      for (let j = i + 1; j < this.balls.length; j++) {
        const b = this.balls[j];
        if (b.pocketed) continue;

        const d = dist(a.x, a.y, b.x, b.y);
        const minDist = a.radius + b.radius;

        if (d < minDist && d > 0) {
          // Normal vector from a to b
          const nx = (b.x - a.x) / d;
          const ny = (b.y - a.y) / d;

          // Separate overlapping balls
          const overlap = minDist - d;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          // Relative velocity
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvn = dvx * nx + dvy * ny;

          // Only resolve if balls are approaching
          if (dvn > 0) {
            // Elastic collision (equal mass)
            a.vx -= dvn * nx;
            a.vy -= dvn * ny;
            b.vx += dvn * nx;
            b.vy += dvn * ny;
          }
        }
      }
    }
  }

  private checkWallCollisions(): void {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;

      // Check if near a pocket - if so, don't bounce off wall
      let nearPocket = false;
      for (const pocket of this.pockets) {
        if (dist(ball.x, ball.y, pocket.x, pocket.y) < pocket.radius + ball.radius) {
          nearPocket = true;
          break;
        }
      }
      if (nearPocket) continue;

      // Left wall
      if (ball.x - ball.radius < this.tableLeft) {
        ball.x = this.tableLeft + ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      // Right wall
      if (ball.x + ball.radius > this.tableRight) {
        ball.x = this.tableRight - ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
      // Top wall
      if (ball.y - ball.radius < this.tableTop) {
        ball.y = this.tableTop + ball.radius;
        ball.vy = -ball.vy * 0.8;
      }
      // Bottom wall
      if (ball.y + ball.radius > this.tableBottom) {
        ball.y = this.tableBottom - ball.radius;
        ball.vy = -ball.vy * 0.8;
      }
    }
  }

  private checkPockets(): void {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;

      for (const pocket of this.pockets) {
        const d = dist(ball.x, ball.y, pocket.x, pocket.y);
        if (d < pocket.radius) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          this.pocketedBalls.push(ball.id);
          break;
        }
      }
    }
  }

  // ---- Game Logic ----

  private onBallsSettled(): void {
    const cueBall = this.balls.find(b => b.id === 0)!;

    // Check if cue ball was pocketed (foul)
    if (cueBall.pocketed) {
      this.foul = true;
      this.message = '犯规! 母球进袋';
      // Reset cue ball
      cueBall.pocketed = false;
      cueBall.x = CANVAS_WIDTH * 0.25;
      cueBall.y = CANVAS_HEIGHT / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;

      // Make sure cue ball doesn't overlap with other balls
      this.resolveCueBallOverlap(cueBall);
    }

    // Check if 8-ball was pocketed
    const eightBall = this.balls.find(b => b.id === 8);
    if (eightBall && eightBall.pocketed) {
      // Count remaining non-8, non-cue balls
      const remainingBalls = this.balls.filter(
        b => b.id !== 0 && b.id !== 8 && !b.pocketed
      );

      if (remainingBalls.length === 0) {
        // All other balls pocketed before 8 - WIN!
        this.isWin = true;
        this.isGameOver = true;
        this.message = '恭喜获胜!';
        this.gameState = 'gameover';
      } else {
        // 8-ball pocketed too early - LOSE!
        this.isWin = false;
        this.isGameOver = true;
        this.message = '8号球过早进袋，游戏结束!';
        this.gameState = 'gameover';
      }
      return;
    }

    // Check if all balls (except cue) are pocketed
    const remainingBalls = this.balls.filter(
      b => b.id !== 0 && !b.pocketed
    );

    if (remainingBalls.length === 0) {
      this.isWin = true;
      this.isGameOver = true;
      this.message = '恭喜获胜!';
      this.gameState = 'gameover';
      return;
    }

    // Ready for next shot
    this.gameState = 'playing';
  }

  private resolveCueBallOverlap(cueBall: Ball): void {
    let attempts = 0;
    while (attempts < 50) {
      let overlapping = false;
      for (const ball of this.balls) {
        if (ball.id === 0 || ball.pocketed) continue;
        const d = dist(cueBall.x, cueBall.y, ball.x, ball.y);
        if (d < cueBall.radius + ball.radius + 2) {
          overlapping = true;
          break;
        }
      }
      if (!overlapping) break;

      // Move cue ball slightly
      cueBall.x += BALL_RADIUS * 2.5;
      if (cueBall.x > CANVAS_WIDTH * 0.4) {
        cueBall.x = CANVAS_WIDTH * 0.15;
        cueBall.y += BALL_RADIUS * 2.5;
        if (cueBall.y > CANVAS_HEIGHT - BALL_RADIUS * 2) {
          cueBall.y = BALL_RADIUS * 2;
        }
      }
      attempts++;
    }
  }
}
