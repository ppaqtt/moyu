const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 12;
const POCKET_RADIUS = 22;
const FRICTION = 0.985;
const MIN_SPEED = 0.1;
const CUSHION_BOUNCE = 0.75;

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
  group: 'solid' | 'stripe' | 'cue' | 'eight' | null;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
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
  isWin: boolean;
  message: string;
  foul: boolean;
  foulReason: string;
  playerGroup: 'solid' | 'stripe' | null;
  currentPlayerGroup: 'solid' | 'stripe';
  ballInHand: boolean;
  scratchCount: number;
  isBreakShot: boolean;
}

const BALL_COLORS: Record<number, string> = {
  0: '#ffffff',
  1: '#f5d442',
  2: '#2563eb',
  3: '#dc2626',
  4: '#7c3aed',
  5: '#f97316',
  6: '#16a34a',
  7: '#92400e',
  8: '#111111',
  9: '#f5d442',
  10: '#2563eb',
  11: '#dc2626',
  12: '#7c3aed',
  13: '#f97316',
  14: '#16a34a',
  15: '#92400e',
};

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function createBall(id: number, x: number, y: number): Ball {
  const isStripe = id >= 9;
  let group: Ball['group'] = null;
  if (id === 0) group = 'cue';
  else if (id === 8) group = 'eight';
  else if (isStripe) group = 'stripe';
  else group = 'solid';

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
    pocketed: false,
    group,
  };
}

export class EightBallPoolEngine {
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
  private isWin: boolean;
  private message: string;
  private foul: boolean;
  private foulReason: string;
  private playerGroup: 'solid' | 'stripe' | null;
  private currentPlayerGroup: 'solid' | 'stripe';
  private ballInHand: boolean;
  private scratchCount: number;
  private isBreakShot: boolean;
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
    this.isWin = false;
    this.message = '';
    this.foul = false;
    this.foulReason = '';
    this.playerGroup = null;
    this.currentPlayerGroup = 'solid';
    this.ballInHand = false;
    this.scratchCount = 0;
    this.isBreakShot = true;
    this.settleTimer = 0;

    this.initBalls();
  }

  private createPockets(): Pocket[] {
    const offset = 8;
    return [
      { x: offset, y: offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: offset, radius: POCKET_RADIUS },
      { x: offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH - offset, y: CANVAS_HEIGHT - offset, radius: POCKET_RADIUS },
      { x: CANVAS_WIDTH / 2, y: offset - 2, radius: POCKET_RADIUS - 3 },
      { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - offset + 2, radius: POCKET_RADIUS - 3 },
    ];
  }

  private initBalls(): void {
    this.balls = [];

    const cueBall = createBall(0, CANVAS_WIDTH * 0.22, CANVAS_HEIGHT / 2);
    this.balls.push(cueBall);

    const rackX = CANVAS_WIDTH * 0.72;
    const rackY = CANVAS_HEIGHT / 2;
    const spacing = BALL_RADIUS * 2.15;

    const rackOrder = [
      [1],
      [9, 2],
      [3, 8, 10],
      [11, 4, 5, 12],
      [13, 6, 14, 7, 15],
    ];

    for (let row = 0; row < rackOrder.length; row++) {
      const numInRow = rackOrder[row].length;
      for (let col = 0; col < numInRow; col++) {
        const x = rackX + row * spacing * Math.cos(Math.PI / 6);
        const y = rackY + (col - (numInRow - 1) / 2) * spacing;
        const ball = createBall(rackOrder[row][col], x, y);
        this.balls.push(ball);
      }
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
      isWin: this.isWin,
      message: this.message,
      foul: this.foul,
      foulReason: this.foulReason,
      playerGroup: this.playerGroup,
      currentPlayerGroup: this.currentPlayerGroup,
      ballInHand: this.ballInHand,
      scratchCount: this.scratchCount,
      isBreakShot: this.isBreakShot,
    };
  }

  setAim(x: number, y: number): void {
    if (this.gameState !== 'aiming' && this.gameState !== 'playing') return;
    if (this.areBallsMoving()) return;
    if (this.ballInHand && this.isBreakShot) return;

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
    if (!this.ballInHand) return false;

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
    this.foul = false;
    this.foulReason = '';
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
    const speed = power * 0.85;

    cueBall.vx = Math.cos(this.aimAngle) * speed;
    cueBall.vy = Math.sin(this.aimAngle) * speed;

    this.shotCount++;
    this.gameState = 'playing';
    this.message = '';
    this.foul = false;
    this.foulReason = '';
    this.chargePower = 0;
    this.isBreakShot = false;
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
    this.foulReason = '';
    this.playerGroup = null;
    this.currentPlayerGroup = 'solid';
    this.ballInHand = false;
    this.scratchCount = 0;
    this.isBreakShot = true;
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
      if (this.settleTimer > 25) {
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
          break;
        }
      }
    }
  }

  private onBallsSettled(): void {
    const cueBall = this.balls.find(b => b.id === 0)!;
    const eightBall = this.balls.find(b => b.id === 8)!;

    if (cueBall.pocketed) {
      this.foul = true;
      this.foulReason = '母球进袋!';
      this.message = '犯规! 母球进袋';
      this.scratchCount++;
      cueBall.pocketed = false;
      cueBall.x = CANVAS_WIDTH * 0.22;
      cueBall.y = CANVAS_HEIGHT / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;
      this.resolveCueBallOverlap(cueBall);
      this.ballInHand = true;
      this.gameState = 'playing';
      return;
    }

    const pocketedThisShot = this.pocketedBalls.filter(
      id => id !== 0 && !this.pocketedBalls.includes(id)
    );

    let pocketedCorrectBall = false;
    let pocketedWrongBall = false;

    for (const id of pocketedThisShot) {
      const ball = this.balls.find(b => b.id === id);
      if (!ball) continue;

      if (this.playerGroup === null) {
        if (ball.group !== 'eight') {
          this.playerGroup = ball.group as 'solid' | 'stripe';
          this.currentPlayerGroup = this.playerGroup;
          pocketedCorrectBall = true;
        }
      } else if (ball.group === this.playerGroup) {
        pocketedCorrectBall = true;
      } else if (ball.group !== 'eight') {
        pocketedWrongBall = true;
      }
    }

    if (this.playerGroup === null && pocketedThisShot.length === 0) {
      this.currentPlayerGroup = this.currentPlayerGroup === 'solid' ? 'stripe' : 'solid';
    } else if (pocketedCorrectBall && !pocketedWrongBall) {
    } else if (!pocketedCorrectBall || pocketedWrongBall) {
      this.currentPlayerGroup = this.currentPlayerGroup === 'solid' ? 'stripe' : 'solid';
      if (pocketedWrongBall) {
        this.message = '犯规! 打错球组';
        this.foul = true;
      }
    }

    if (eightBall.pocketed) {
      const myBallsPocketed = this.balls.filter(
        b => b.group === this.playerGroup && b.pocketed
      );

      if (this.playerGroup !== null && myBallsPocketed.length === 7 && !this.foul) {
        this.isWin = true;
        this.isGameOver = true;
        this.message = '恭喜获胜!';
        this.gameState = 'gameover';
      } else {
        this.isWin = false;
        this.isGameOver = true;
        this.message = this.foul ? '8号球过早进袋，游戏结束!' : '游戏结束';
        this.gameState = 'gameover';
      }
      return;
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
      if (cueBall.x > CANVAS_WIDTH * 0.35) {
        cueBall.x = CANVAS_WIDTH * 0.12;
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
