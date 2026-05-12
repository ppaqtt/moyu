import { COOP_BREAKOUT_CONSTANTS } from '../../utils/constants';

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
  playerId: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  hits: number;
  maxHits: number;
  active: boolean;
}

export interface CoopBreakoutState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  bricks: Brick[];
  score: { player1: number; player2: number; cooperative: number };
  gameStatus: 'idle' | 'playing' | 'gameover' | 'victory';
  lives: number;
  level: number;
  combo: number;
}

export class CoopBreakoutEngine {
  private ball: Ball;
  private paddle1: Paddle;
  private paddle2: Paddle;
  private bricks: Brick[] = [];
  private score: { player1: number; player2: number; cooperative: number } = { player1: 0, player2: 0, cooperative: 0 };
  private gameStatus: 'idle' | 'playing' | 'gameover' | 'victory' = 'idle';
  private lives: number = 3;
  private level: number = 1;
  private combo: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor() {
    this.canvasWidth = COOP_BREAKOUT_CONSTANTS.CANVAS_WIDTH;
    this.canvasHeight = COOP_BREAKOUT_CONSTANTS.CANVAS_HEIGHT;
    this.init();
  }

  private init(): void {
    this.ball = this.createBall();
    this.paddle1 = this.createPaddle(1);
    this.paddle2 = this.createPaddle(2);
    this.bricks = this.createBricks();
    this.score = { player1: 0, player2: 0, cooperative: 0 };
    this.gameStatus = 'idle';
    this.lives = 3;
    this.combo = 0;
  }

  private createBall(): Ball {
    return {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 150,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: -4,
      radius: COOP_BREAKOUT_CONSTANTS.BALL_RADIUS,
      active: true
    };
  }

  private createPaddle(playerId: number): Paddle {
    return {
      x: playerId === 1 ? 100 : this.canvasWidth - 100,
      y: this.canvasHeight - 50,
      width: COOP_BREAKOUT_CONSTANTS.PADDLE_WIDTH,
      height: COOP_BREAKOUT_CONSTANTS.PADDLE_HEIGHT,
      playerId
    };
  }

  private createBricks(): Brick[] {
    const bricks: Brick[] = [];
    const rows = 6;
    const cols = 10;
    const brickWidth = (this.canvasWidth - 40) / cols;
    const brickHeight = 25;
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        bricks.push({
          x: 20 + col * brickWidth,
          y: 60 + row * (brickHeight + 5),
          width: brickWidth - 3,
          height: brickHeight,
          color: colors[row % colors.length],
          points: (rows - row) * 10,
          hits: 1,
          maxHits: row < 2 ? 2 : 1,
          active: true
        });
      }
    }
    return bricks;
  }

  public start(): void {
    if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
      this.init();
      this.gameStatus = 'playing';
    }
  }

  public pause(): void {
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'idle';
    }
  }

  public reset(): void {
    this.init();
  }

  public movePaddle1Left(): void {
    this.paddle1.x = Math.max(this.paddle1.width / 2, this.paddle1.x - 15);
  }

  public movePaddle1Right(): void {
    this.paddle1.x = Math.min(this.canvasWidth / 2 - this.paddle1.width / 2, this.paddle1.x + 15);
  }

  public movePaddle2Left(): void {
    this.paddle2.x = Math.max(this.canvasWidth / 2 + this.paddle2.width / 2, this.paddle2.x - 15);
  }

  public movePaddle2Right(): void {
    this.paddle2.x = Math.min(this.canvasWidth - this.paddle2.width / 2, this.paddle2.x + 15);
  }

  private moveBall(): void {
    if (!this.ball.active) return;

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = Math.abs(this.ball.vx);
    }
    if (this.ball.x + this.ball.radius > this.canvasWidth) {
      this.ball.x = this.canvasWidth - this.ball.radius;
      this.ball.vx = -Math.abs(this.ball.vx);
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
    }
  }

  private collidePaddles(): void {
    const paddles = [this.paddle1, this.paddle2];
    
    for (const paddle of paddles) {
      if (
        this.ball.x + this.ball.radius > paddle.x - paddle.width / 2 &&
        this.ball.x - this.ball.radius < paddle.x + paddle.width / 2 &&
        this.ball.y + this.ball.radius > paddle.y - paddle.height / 2 &&
        this.ball.y - this.ball.radius < paddle.y + paddle.height / 2 &&
        this.ball.vy > 0
      ) {
        const hitPos = (this.ball.x - paddle.x) / (paddle.width / 2);
        this.ball.vx = hitPos * 5;
        this.ball.vy = -Math.abs(this.ball.vy);
        this.ball.y = paddle.y - paddle.height / 2 - this.ball.radius;

        const points = 10;
        if (paddle.playerId === 1) {
          this.score.player1 += points;
        } else {
          this.score.player2 += points;
        }
        this.score.cooperative += points;
        this.combo++;
      }
    }
  }

  private collideBricks(): void {
    for (const brick of this.bricks) {
      if (!brick.active) continue;

      if (
        this.ball.x + this.ball.radius > brick.x &&
        this.ball.x - this.ball.radius < brick.x + brick.width &&
        this.ball.y + this.ball.radius > brick.y &&
        this.ball.y - this.ball.radius < brick.y + brick.height
      ) {
        brick.hits--;
        if (brick.hits <= 0) {
          brick.active = false;
          const comboBonus = Math.min(this.combo, 5);
          const points = brick.points * (1 + comboBonus * 0.1);
          
          const leftSide = this.ball.x < this.canvasWidth / 2;
          if (leftSide) {
            this.score.player1 += Math.floor(points);
          } else {
            this.score.player2 += Math.floor(points);
          }
          this.score.cooperative += Math.floor(points);
        }

        const overlapLeft = this.ball.x + this.ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (this.ball.x - this.ball.radius);
        const overlapTop = this.ball.y + this.ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (this.ball.y - this.ball.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          this.ball.vx = -this.ball.vx;
        } else {
          this.ball.vy = -this.ball.vy;
        }

        this.combo = 0;
        break;
      }
    }
  }

  private checkBallLost(): boolean {
    return this.ball.y + this.ball.radius > this.canvasHeight;
  }

  private respawnBall(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameStatus = 'gameover';
    } else {
      this.ball = this.createBall();
    }
  }

  private checkVictory(): boolean {
    return this.bricks.every(brick => !brick.active);
  }

  public tick(): void {
    if (this.gameStatus !== 'playing') return;

    this.moveBall();
    this.collidePaddles();
    this.collideBricks();

    if (this.checkBallLost()) {
      this.respawnBall();
    }

    if (this.checkVictory()) {
      this.gameStatus = 'victory';
    }
  }

  public getState(): CoopBreakoutState {
    return {
      ball: { ...this.ball },
      paddle1: { ...this.paddle1 },
      paddle2: { ...this.paddle2 },
      bricks: this.bricks.map(b => ({ ...b })),
      score: { ...this.score },
      gameStatus: this.gameStatus,
      lives: this.lives,
      level: this.level,
      combo: this.combo
    };
  }

  public getScore(): { player1: number; player2: number; cooperative: number } {
    return this.score;
  }

  public getGameStatus(): string {
    return this.gameStatus;
  }
}
