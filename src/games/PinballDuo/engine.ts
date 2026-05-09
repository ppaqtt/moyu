export const PINBALL_DUO_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 700,
  BALL_RADIUS: 12,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 18,
  GRAVITY: 0.25,
  FRICTION: 0.995,
  BUMPER_RADIUS: 25,
  OBSTACLE_WIDTH: 120,
  OBSTACLE_HEIGHT: 20,
  SCORE_BUMPER_HIT: 50,
  SCORE_PADDLE_HIT: 10,
  SCORE_COMBO_MULTIPLIER: 1.5,
  COMBO_DECAY_TIME: 2000,
  TIME_SCORE_INTERVAL: 1000,
  TIME_SCORE_AMOUNT: 5,
  PADDLE_SPEED: 0.15,
  BALL_MAX_SPEED: 18
};

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  targetAngle: number;
  side: 'left' | 'right';
  isUp: boolean;
}

export interface Bumper {
  x: number;
  y: number;
  radius: number;
  color: string;
  hitTimer: number;
  score: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hitTimer: number;
}

export interface PlayerScore {
  score: number;
  combo: number;
  lastHitTime: number;
  bumperHits: number;
  paddleHits: number;
}

export interface PinballDuoState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  bumpers: Bumper[];
  obstacles: Obstacle[];
  gameStatus: 'idle' | 'playing' | 'gameover';
  scores: { player1: PlayerScore; player2: PlayerScore };
  elapsedTime: number;
  ballLost: boolean;
}

const COLORS = {
  PADDLE1: '#00d2ff',
  PADDLE2: '#ff6b9d',
  BALL: '#ffd700',
  BUMPER_COLORS: ['#a855f7', '#39ff14', '#ff6b9d', '#00d2ff', '#ffd700'],
  OBSTACLE: '#6c5ce7',
  WALL: 'rgba(108, 92, 231, 0.6)',
  BG: '#0f0f1a'
};

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): { dist: number; nx: number; ny: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const d = dist(px, py, x1, y1);
    return d > 0 ? { dist: d, nx: (px - x1) / d, ny: (py - y1) / d } : { dist: 0, nx: 0, ny: -1 };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);

  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const d = dist(px, py, cx, cy);

  return d > 0 ? { dist: d, nx: (px - cx) / d, ny: (py - cy) / d } : { dist: 0, nx: 0, ny: -1 };
}

export class PinballDuoEngine {
  private ball: Ball;
  private paddle1: Paddle;
  private paddle2: Paddle;
  private bumpers: Bumper[];
  private obstacles: Obstacle[];
  private gameStatus: 'idle' | 'playing' | 'gameover';
  private scores: { player1: PlayerScore; player2: PlayerScore };
  private elapsedTime: number;
  private ballLost: boolean;
  private canvasWidth: number;
  private canvasHeight: number;
  private lastTimeUpdate: number;

  constructor() {
    this.canvasWidth = PINBALL_DUO_CONSTANTS.CANVAS_WIDTH;
    this.canvasHeight = PINBALL_DUO_CONSTANTS.CANVAS_HEIGHT;
    this.init();
  }

  init(): void {
    this.ball = this.createBall();
    this.paddle1 = this.createPaddle('left');
    this.paddle2 = this.createPaddle('right');
    this.bumpers = this.createBumpers();
    this.obstacles = this.createObstacles();
    this.gameStatus = 'idle';
    this.scores = {
      player1: { score: 0, combo: 0, lastHitTime: 0, bumperHits: 0, paddleHits: 0 },
      player2: { score: 0, combo: 0, lastHitTime: 0, bumperHits: 0, paddleHits: 0 }
    };
    this.elapsedTime = 0;
    this.ballLost = false;
    this.lastTimeUpdate = Date.now();
  }

  private createBall(): Ball {
    return {
      x: this.canvasWidth / 2,
      y: this.canvasHeight / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: -2,
      radius: PINBALL_DUO_CONSTANTS.BALL_RADIUS,
      active: true
    };
  }

  private createPaddle(side: 'left' | 'right'): Paddle {
    const paddleWidth = PINBALL_DUO_CONSTANTS.PADDLE_WIDTH;
    const paddleHeight = PINBALL_DUO_CONSTANTS.PADDLE_HEIGHT;
    const margin = 60;
    const x = side === 'left' ? margin + paddleWidth / 2 : this.canvasWidth - margin - paddleWidth / 2;
    const y = this.canvasHeight / 2;

    return {
      x,
      y,
      width: paddleWidth,
      height: paddleHeight,
      angle: 0,
      targetAngle: 0,
      side,
      isUp: false
    };
  }

  private createBumpers(): Bumper[] {
    const centerX = this.canvasWidth / 2;
    const positions = [
      { x: centerX, y: 150 },
      { x: centerX - 100, y: 250 },
      { x: centerX + 100, y: 250 },
      { x: centerX - 60, y: 380 },
      { x: centerX + 60, y: 380 },
      { x: centerX, y: 500 }
    ];

    return positions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      radius: PINBALL_DUO_CONSTANTS.BUMPER_RADIUS,
      color: COLORS.BUMPER_COLORS[i % COLORS.BUMPER_COLORS.length],
      hitTimer: 0,
      score: 50 + i * 10
    }));
  }

  private createObstacles(): Obstacle[] {
    const centerX = this.canvasWidth / 2;
    return [
      {
        x: centerX - 80,
        y: 180,
        width: 160,
        height: 15,
        color: COLORS.OBSTACLE,
        hitTimer: 0
      },
      {
        x: centerX - 60,
        y: 320,
        width: 120,
        height: 15,
        color: COLORS.OBSTACLE,
        hitTimer: 0
      },
      {
        x: centerX - 50,
        y: 450,
        width: 100,
        height: 15,
        color: COLORS.OBSTACLE,
        hitTimer: 0
      }
    ];
  }

  getState(): PinballDuoState {
    return {
      ball: { ...this.ball },
      paddle1: { ...this.paddle1 },
      paddle2: { ...this.paddle2 },
      bumpers: this.bumpers.map(b => ({ ...b })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      gameStatus: this.gameStatus,
      scores: {
        player1: { ...this.scores.player1 },
        player2: { ...this.scores.player2 }
      },
      elapsedTime: this.elapsedTime,
      ballLost: this.ballLost
    };
  }

  start(): void {
    if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
      this.init();
      this.gameStatus = 'playing';
      this.lastTimeUpdate = Date.now();
    }
  }

  pause(): void {
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'idle';
    }
  }

  resume(): void {
    if (this.gameStatus === 'idle') {
      this.gameStatus = 'playing';
      this.lastTimeUpdate = Date.now();
    }
  }

  reset(): void {
    this.init();
  }

  setPaddle1Up(isUp: boolean): void {
    this.paddle1.isUp = isUp;
    this.paddle1.targetAngle = isUp ? -Math.PI / 4 : Math.PI / 4;
  }

  setPaddle2Up(isUp: boolean): void {
    this.paddle2.isUp = isUp;
    this.paddle2.targetAngle = isUp ? Math.PI / 4 : -Math.PI / 4;
  }

  private updatePaddle(paddle: Paddle): void {
    const speed = PINBALL_DUO_CONSTANTS.PADDLE_SPEED;
    const diff = paddle.targetAngle - paddle.angle;

    if (Math.abs(diff) < speed) {
      paddle.angle = paddle.targetAngle;
    } else {
      paddle.angle += diff > 0 ? speed : -speed;
    }
  }

  private applyGravity(): void {
    this.ball.vy += PINBALL_DUO_CONSTANTS.GRAVITY;
  }

  private applyFriction(): void {
    this.ball.vx *= PINBALL_DUO_CONSTANTS.FRICTION;
    this.ball.vy *= PINBALL_DUO_CONSTANTS.FRICTION;
  }

  private clampSpeed(): void {
    const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
    const maxSpeed = PINBALL_DUO_CONSTANTS.BALL_MAX_SPEED;

    if (speed > maxSpeed) {
      this.ball.vx = (this.ball.vx / speed) * maxSpeed;
      this.ball.vy = (this.ball.vy / speed) * maxSpeed;
    }
  }

  private moveBall(): void {
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
  }

  private collideWalls(): void {
    const r = this.ball.radius;

    if (this.ball.x - r < 0) {
      this.ball.x = r;
      this.ball.vx = Math.abs(this.ball.vx) * 0.8;
    }
    if (this.ball.x + r > this.canvasWidth) {
      this.ball.x = this.canvasWidth - r;
      this.ball.vx = -Math.abs(this.ball.vx) * 0.8;
    }
    if (this.ball.y - r < 0) {
      this.ball.y = r;
      this.ball.vy = Math.abs(this.ball.vy) * 0.8;
    }
  }

  private collideBumpers(): void {
    const now = Date.now();

    for (const bumper of this.bumpers) {
      const d = dist(this.ball.x, this.ball.y, bumper.x, bumper.y);
      const minDist = this.ball.radius + bumper.radius;

      if (d < minDist && d > 0) {
        const nx = (this.ball.x - bumper.x) / d;
        const ny = (this.ball.y - bumper.y) / d;

        const overlap = minDist - d;
        this.ball.x += nx * overlap;
        this.ball.y += ny * overlap;

        const dot = this.ball.vx * nx + this.ball.vy * ny;
        this.ball.vx -= 2 * dot * nx;
        this.ball.vy -= 2 * dot * ny;

        const boostSpeed = 6;
        this.ball.vx += nx * boostSpeed;
        this.ball.vy += ny * boostSpeed;

        bumper.hitTimer = 15;

        const leftSide = this.ball.x < this.canvasWidth / 2;
        const player = leftSide ? 'player1' : 'player2';
        const comboMultiplier = this.getComboMultiplier(player, now);
        const points = Math.floor(bumper.score * comboMultiplier);

        this.scores[player].score += points;
        this.scores[player].bumperHits++;
        this.scores[player].lastHitTime = now;
        this.scores[player].combo++;
      }
    }
  }

  private collideObstacles(): void {
    const now = Date.now();

    for (const obs of this.obstacles) {
      const closestX = clamp(this.ball.x, obs.x - obs.width / 2, obs.x + obs.width / 2);
      const closestY = clamp(this.ball.y, obs.y - obs.height / 2, obs.y + obs.height / 2);
      const d = dist(this.ball.x, this.ball.y, closestX, closestY);

      if (d < this.ball.radius) {
        const nx = d > 0 ? (this.ball.x - closestX) / d : 0;
        const ny = d > 0 ? (this.ball.y - closestY) / d : -1;

        const overlap = this.ball.radius - d;
        this.ball.x += nx * overlap;
        this.ball.y += ny * overlap;

        const dot = this.ball.vx * nx + this.ball.vy * ny;
        this.ball.vx -= 2 * dot * nx;
        this.ball.vy -= 2 * dot * ny;

        obs.hitTimer = 15;

        const leftSide = this.ball.x < this.canvasWidth / 2;
        const player = leftSide ? 'player1' : 'player2';
        const comboMultiplier = this.getComboMultiplier(player, now);
        const points = Math.floor(50 * comboMultiplier);

        this.scores[player].score += points;
        this.scores[player].bumperHits++;
        this.scores[player].lastHitTime = now;
        this.scores[player].combo++;
      }
    }
  }

  private collidePaddle(paddle: Paddle, playerKey: 'player1' | 'player2'): void {
    const now = Date.now();
    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleRight = paddle.x + paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;
    const paddleBottom = paddle.y + paddle.height / 2;

    if (
      this.ball.x + this.ball.radius > paddleLeft &&
      this.ball.x - this.ball.radius < paddleRight &&
      this.ball.y + this.ball.radius > paddleTop &&
      this.ball.y - this.ball.radius < paddleBottom
    ) {
      const fromTop = this.ball.y < paddle.y;
      const fromBottom = this.ball.y > paddle.y;

      if (fromTop) {
        this.ball.y = paddleTop - this.ball.radius;

        const kickStrength = paddle.isUp ? 10 : 6;
        this.ball.vy = -kickStrength;

        const hitPos = (this.ball.x - paddle.x) / (paddle.width / 2);
        this.ball.vx = hitPos * 8;

        if (paddle.isUp) {
          this.scores[playerKey].score += PINBALL_DUO_CONSTANTS.SCORE_PADDLE_HIT;
          this.scores[playerKey].paddleHits++;
          this.scores[playerKey].lastHitTime = now;
          this.scores[playerKey].combo++;
        }
      } else if (fromBottom) {
        this.ball.y = paddleBottom + this.ball.radius;
        this.ball.vy = Math.abs(this.ball.vy) * 0.5;
      }
    }
  }

  private getComboMultiplier(playerKey: 'player1' | 'player2', now: number): number {
    const player = this.scores[playerKey];
    const timeSinceLastHit = now - player.lastHitTime;

    if (timeSinceLastHit > PINBALL_DUO_CONSTANTS.COMBO_DECAY_TIME) {
      player.combo = 0;
    }

    if (player.combo > 1) {
      return Math.min(1 + (player.combo - 1) * 0.2, PINBALL_DUO_CONSTANTS.SCORE_COMBO_MULTIPLIER);
    }
    return 1;
  }

  private updateTimers(): void {
    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) bumper.hitTimer--;
    }
    for (const obs of this.obstacles) {
      if (obs.hitTimer > 0) obs.hitTimer--;
    }
  }

  private updateTimeScore(): void {
    const now = Date.now();
    const deltaTime = now - this.lastTimeUpdate;

    if (deltaTime >= PINBALL_DUO_CONSTANTS.TIME_SCORE_INTERVAL) {
      const intervals = Math.floor(deltaTime / PINBALL_DUO_CONSTANTS.TIME_SCORE_INTERVAL);
      this.elapsedTime += intervals * PINBALL_DUO_CONSTANTS.TIME_SCORE_INTERVAL;
      this.scores.player1.score += intervals * PINBALL_DUO_CONSTANTS.TIME_SCORE_AMOUNT;
      this.scores.player2.score += intervals * PINBALL_DUO_CONSTANTS.TIME_SCORE_AMOUNT;
      this.lastTimeUpdate = now;
    }
  }

  private checkBallLost(): boolean {
    return this.ball.y - this.ball.radius > this.canvasHeight;
  }

  private respawnBall(): void {
    this.ball = this.createBall();
    this.ballLost = false;
  }

  tick(): void {
    if (this.gameStatus !== 'playing') return;

    const now = Date.now();

    this.updatePaddle(this.paddle1);
    this.updatePaddle(this.paddle2);

    if (this.ballLost) {
      this.respawnBall();
      return;
    }

    if (!this.ball.active) {
      this.ball = this.createBall();
    }

    this.applyGravity();
    this.applyFriction();
    this.clampSpeed();
    this.moveBall();
    this.collideWalls();
    this.collideBumpers();
    this.collideObstacles();
    this.collidePaddle(this.paddle1, 'player1');
    this.collidePaddle(this.paddle2, 'player2');
    this.updateTimers();
    this.updateTimeScore();

    if (this.checkBallLost()) {
      this.ballLost = true;
    }
  }

  getCombinedScore(): number {
    return this.scores.player1.score + this.scores.player2.score;
  }

  getMaxCombo(): number {
    return Math.max(this.scores.player1.combo, this.scores.player2.combo);
  }
}
