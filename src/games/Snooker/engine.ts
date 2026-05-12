const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 10;
const POCKET_RADIUS = 18;
const FRICTION = 0.988;
const MIN_SPEED = 0.08;
const CUSHION_BOUNCE = 0.7;

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  pocketed: boolean;
  value: number;
  isFreeBall: boolean;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export interface FoulInfo {
  type: string;
  points: number;
}

export interface GameState {
  balls: Ball[];
  pockets: Pocket[];
  cueBall: Ball;
  gameState: 'idle' | 'aiming' | 'playing' | 'gameover';
  isCharging: boolean;
  chargePower: number;
  aimAngle: number;
  aimX: number;
  aimY: number;
  pocketedBalls: number[];
  shotCount: number;
  isGameOver: boolean;
  message: string;
  foul: boolean;
  foulInfo: FoulInfo | null;
  ballInHand: boolean;
  breakShot: boolean;
  firstBallHit: Ball | null;
  redBallFoul: boolean;
  points: number;
  opponentPoints: number;
  isBreak: boolean;
  freeBallMode: boolean;
  consecutiveFouls: number;
  totalPoints: number;
}

const BALL_COLORS: Record<number, string> = {
  0: '#ffffff',
  1: '#dc2626',
  2: '#16a34a',
  3: '#f5d442',
  4: '#2563eb',
  5: '#92400e',
  6: '#7c3aed',
  7: '#92400e',
  8: '#111111',
};

const BALL_VALUES: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
};

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function createBall(id: number, x: number, y: number): Ball {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: BALL_COLORS[id] || '#ffffff',
    number: id,
    pocketed: false,
    value: BALL_VALUES[id] || 0,
    isFreeBall: false,
  };
}

export class SnookerEngine {
  private balls: Ball[] = [];
  private pockets: Pocket[] = [];
  private gameState: GameState['gameState'];
  private isCharging: boolean;
  private chargePower: number;
  private aimAngle: number;
  private aimX: number;
  private aimY: number;
  private pocketedBalls: number[];
  private shotCount: number;
  private isGameOver: boolean;
  private message: string;
  private foul: boolean;
  private foulInfo: FoulInfo | null;
  private ballInHand: boolean;
  private breakShot: boolean;
  private firstBallHit: Ball | null;
  private redBallFoul: boolean;
  private points: number;
  private opponentPoints: number;
  private isBreak: boolean;
  private freeBallMode: boolean;
  private consecutiveFouls: number;
  private settleTimer: number;
  private tableLeft: number;
  private tableRight: number;
  private tableTop: number;
  private tableBottom: number;

  constructor() {
    this.tableLeft = BALL_RADIUS + 25;
    this.tableRight = CANVAS_WIDTH - BALL_RADIUS - 25;
    this.tableTop = BALL_RADIUS + 25;
    this.tableBottom = CANVAS_HEIGHT - BALL_RADIUS - 25;

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
    this.message = '';
    this.foul = false;
    this.foulInfo = null;
    this.ballInHand = false;
    this.breakShot = true;
    this.firstBallHit = null;
    this.redBallFoul = false;
    this.points = 0;
    this.opponentPoints = 0;
    this.isBreak = true;
    this.freeBallMode = false;
    this.consecutiveFouls = 0;
    this.settleTimer = 0;

    this.initBalls();
  }

  private createPockets(): Pocket[] {
    const offset = 5;
    return [
      { x: offset, y: offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: offset, radius: POCKET_RADIUS },
      { x: offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH * 0.3, y: offset - 2, radius: POCKET_RADIUS - 2 },
      { x: CANVAS_WIDTH * 0.7, y: offset - 2, radius: POCKET_RADIUS - 2 },
      { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT - offset + 2, radius: POCKET_RADIUS - 2 },
      { x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT - offset + 2, radius: POCKET_RADIUS - 2 },
    ];
  }

  private initBalls(): void {
    this.balls = [];

    const cueBall = createBall(0, CANVAS_WIDTH * 0.15, CANVAS_HEIGHT / 2);
    this.balls.push(cueBall);

    const redBallStartX = CANVAS_WIDTH * 0.6;
    const redBallStartY = CANVAS_HEIGHT / 2;
    const spacing = BALL_RADIUS * 2.2;

    for (let row = 0; row < 5; row++) {
      const ballsInRow = row + 1;
      for (let col = 0; col < ballsInRow; col++) {
        const x = redBallStartX + row * spacing * Math.cos(Math.PI / 6);
        const y = redBallStartY + (col - (ballsInRow - 1) / 2) * spacing;
        const ball = createBall(1, x, y);
        ball.value = 1;
        this.balls.push(ball);
      }
    }

    const colorsX = CANVAS_WIDTH * 0.82;
    const colorValues = [2, 3, 4, 5, 6, 7];
    const colorYPositions = [
      CANVAS_HEIGHT * 0.25,
      CANVAS_HEIGHT * 0.35,
      CANVAS_HEIGHT / 2,
      CANVAS_HEIGHT * 0.65,
      CANVAS_HEIGHT * 0.75,
      CANVAS_HEIGHT * 0.45,
    ];

    for (let i = 0; i < colorValues.length; i++) {
      const ball = createBall(colorValues[i], colorsX, colorYPositions[i]);
      this.balls.push(ball);
    }
  }

  getState(): GameState {
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
      message: this.message,
      foul: this.foul,
      foulInfo: this.foulInfo,
      ballInHand: this.ballInHand,
      breakShot: this.breakShot,
      firstBallHit: this.firstBallHit,
      redBallFoul: this.redBallFoul,
      points: this.points,
      opponentPoints: this.opponentPoints,
      isBreak: this.isBreak,
      freeBallMode: this.freeBallMode,
      consecutiveFouls: this.consecutiveFouls,
      totalPoints: this.points + this.opponentPoints,
    };
  }

  setAim(x: number, y: number): void {
    if (this.gameState !== 'aiming' && this.gameState !== 'playing') return;
    if (this.areBallsMoving()) return;
    if (this.ballInHand && !this.freeBallMode) return;

    const cueBall = this.balls.find(b => b.id === 0);
    if (!cueBall || cueBall.pocketed) return;

    this.aimX = x;
    this.aimY = y;

    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    this.aimAngle = Math.atan2(dy, dx);
    this.gameState = 'aiming';
  }

  placeCueBall(x: number, y: number): boolean {
    if (!this.ballInHand && !this.freeBallMode) return false;

    const cueBall = this.balls.find(b => b.id === 0);
    if (!cueBall) return false;

    for (const ball of this.balls) {
      if (ball.id === 0 || ball.pocketed) continue;
      const d = dist(x, y, ball.x, ball.y);
      if (d < BALL_RADIUS * 2 + 5) return false;
    }

    if (x < this.tableLeft || x > this.tableRight || y < this.tableTop || y > this.tableBottom) {
      return false;
    }

    cueBall.pocketed = false;
    cueBall.x = x;
    cueBall.y = y;
    cueBall.vx = 0;
    cueBall.vy = 0;
    this.ballInHand = false;
    this.freeBallMode = false;
    this.foul = false;
    this.foulInfo = null;
    this.gameState = 'aiming';
    return true;
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
    this.foulInfo = null;
    this.chargePower = 0;
    this.breakShot = false;
    this.firstBallHit = null;
    this.redBallFoul = false;
    this.isBreak = false;
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
    this.message = '';
    this.foul = false;
    this.foulInfo = null;
    this.ballInHand = false;
    this.breakShot = true;
    this.firstBallHit = null;
    this.redBallFoul = false;
    this.points = 0;
    this.opponentPoints = 0;
    this.isBreak = true;
    this.freeBallMode = false;
    this.consecutiveFouls = 0;
    this.settleTimer = 0;
  }

  tick(): boolean {
    if (this.isGameOver) return false;

    if (this.isCharging) {
      this.chargePower = Math.min(this.chargePower + 0.25, 20);
    }

    this.updateBalls();
    this.checkBallCollisions();
    this.checkWallCollisions();
    this.checkPockets();

    if (this.gameState === 'playing' && !this.areBallsMoving()) {
      this.settleTimer++;
      if (this.settleTimer > 30) {
        this.onBallsSettled();
        this.settleTimer = 0;
      }
    } else {
      this.settleTimer = 0;
    }

    return true;
  }

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

      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed < MIN_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
      }

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
          if (a.id === 0 && this.firstBallHit === null && b.id !== 0) {
            this.firstBallHit = { ...b };
          } else if (b.id === 0 && this.firstBallHit === null && a.id !== 0) {
            this.firstBallHit = { ...a };
          }

          const nx = (b.x - a.x) / d;
          const ny = (b.y - a.y) / d;

          const overlap = minDist - d;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvn = dvx * nx + dvy * ny;

          if (dvn > 0) {
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

      let nearPocket = false;
      for (const pocket of this.pockets) {
        if (dist(ball.x, ball.y, pocket.x, pocket.y) < pocket.radius + ball.radius) {
          nearPocket = true;
          break;
        }
      }
      if (nearPocket) continue;

      if (ball.x - ball.radius < this.tableLeft) {
        ball.x = this.tableLeft + ball.radius;
        ball.vx = -ball.vx * CUSHION_BOUNCE;
      }
      if (ball.x + ball.radius > this.tableRight) {
        ball.x = this.tableRight - ball.radius;
        ball.vx = -ball.vx * CUSHION_BOUNCE;
      }
      if (ball.y - ball.radius < this.tableTop) {
        ball.y = this.tableTop + ball.radius;
        ball.vy = -ball.vy * CUSHION_BOUNCE;
      }
      if (ball.y + ball.radius > this.tableBottom) {
        ball.y = this.tableBottom - ball.radius;
        ball.vy = -ball.vy * CUSHION_BOUNCE;
      }
    }
  }

  private checkPockets(): void {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;

      for (const pocket of this.pockets) {
        const d = dist(ball.x, ball.y, pocket.x, pocket.y);
        if (d < pocket.radius - ball.radius * 0.3) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          if (!this.pocketedBalls.includes(ball.id)) {
            this.pocketedBalls.push(ball.id);
          }

          if (ball.id !== 0) {
            this.points += ball.value;
          }
          break;
        }
      }
    }
  }

  private onBallsSettled(): void {
    const cueBall = this.balls.find(b => b.id === 0)!;

    let isFoul = false;
    let foulPoints = 4;
    let foulReason = '犯规';

    if (cueBall.pocketed) {
      isFoul = true;
      foulPoints = 4;
      foulReason = '母球进袋!';
      this.opponentPoints += foulPoints;
      cueBall.pocketed = false;
      cueBall.x = CANVAS_WIDTH * 0.15;
      cueBall.y = CANVAS_HEIGHT / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;
      this.resolveCueBallOverlap(cueBall);
      this.ballInHand = true;
    }

    if (!isFoul && this.firstBallHit !== null) {
      if (this.firstBallHit.id === 0) {
        isFoul = true;
        foulPoints = 4;
        foulReason = '未击中球!';
        this.opponentPoints += foulPoints;
      } else if (this.firstBallHit.id === 1) {
        const redRemaining = this.balls.filter(b => b.id === 1 && !b.pocketed).length;
        if (redRemaining > 0 && this.firstBallHit.id !== 1) {
          isFoul = true;
          foulPoints = 4;
          foulReason = '未先击红球!';
          this.opponentPoints += foulPoints;
        }
      } else if (this.firstBallHit.value > 0 && this.firstBallHit.id !== 1) {
        const redRemaining = this.balls.filter(b => b.id === 1 && !b.pocketed).length;
        if (redRemaining > 0) {
          isFoul = true;
          foulPoints = 4;
          foulReason = '未先击红球!';
          this.opponentPoints += foulPoints;
        }
      }
    }

    if (!isFoul && this.firstBallHit === null) {
      isFoul = true;
      foulPoints = 4;
      foulReason = '未击中任何球!';
      this.opponentPoints += foulPoints;
    }

    const redRemaining = this.balls.filter(b => b.id === 1 && !b.pocketed).length;

    if (redRemaining === 0 && !isFoul) {
      const colorsRemaining = this.balls.filter(
        b => b.id !== 0 && b.id !== 1 && !b.pocketed
      );
      if (colorsRemaining.length === 0) {
        this.isGameOver = true;
        this.message = '比赛结束!';
        this.gameState = 'gameover';
        return;
      }
    }

    if (isFoul) {
      this.foul = true;
      this.foulInfo = { type: foulReason, points: foulPoints };
      this.message = `犯规: ${foulReason} (+${foulPoints}分给对方)`;
      this.consecutiveFouls++;
      this.ballInHand = true;
    } else {
      this.consecutiveFouls = 0;
    }

    if (this.consecutiveFouls >= 2) {
      this.opponentPoints += 6;
      this.message += ' 连续犯规! (+6分)';
      this.consecutiveFouls = 0;
    }

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

      cueBall.x += BALL_RADIUS * 2.5;
      if (cueBall.x > CANVAS_WIDTH * 0.3) {
        cueBall.x = CANVAS_WIDTH * 0.08;
        cueBall.y += BALL_RADIUS * 2.5;
        if (cueBall.y > CANVAS_HEIGHT - BALL_RADIUS * 2) {
          cueBall.y = BALL_RADIUS * 2;
        }
      }
      attempts++;
    }
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
