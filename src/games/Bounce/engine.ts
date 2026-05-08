import { BOUNCE_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, BRICK_ROWS, BRICK_COLS } = BOUNCE_CONSTANTS;

export interface Position {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alive: boolean;
}

export interface GameBounceState {
  ball: Ball;
  paddle: Position;
  bricks: Brick[];
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
  isWon: boolean;
  isPaused: boolean;
}

const BRICK_COLORS = [
  '#ff2e63',
  '#ff6b6b',
  '#ffd93d',
  '#6bcb77',
  '#4d96ff'
];

export class GameBounceEngine {
  private ball: Ball;
  private paddle: Position;
  private bricks: Brick[];
  private score: number;
  private level: number;
  private lives: number;
  private isGameOver: boolean;
  private isWon: boolean;
  private isPaused: boolean;
  private paddleWidth: number;
  private paddleHeight: number;
  private brickHeight: number;
  private brickGap: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.paddleWidth = BOUNCE_CONSTANTS.PADDLE_WIDTH;
    this.paddleHeight = BOUNCE_CONSTANTS.PADDLE_HEIGHT;
    this.brickHeight = BOUNCE_CONSTANTS.BRICK_HEIGHT;
    this.brickGap = BOUNCE_CONSTANTS.BRICK_GAP;

    this.ball = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 100,
      dx: BOUNCE_CONSTANTS.BALL_SPEED,
      dy: -BOUNCE_CONSTANTS.BALL_SPEED,
      radius: BOUNCE_CONSTANTS.BALL_RADIUS
    };

    this.paddle = {
      x: (this.canvasWidth - this.paddleWidth) / 2,
      y: this.canvasHeight - 30
    };

    this.bricks = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.isWon = false;
    this.isPaused = false;

    this.initBricks();
  }

  init(): void {
    this.ball = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 100,
      dx: BOUNCE_CONSTANTS.BALL_SPEED,
      dy: -BOUNCE_CONSTANTS.BALL_SPEED,
      radius: BOUNCE_CONSTANTS.BALL_RADIUS
    };

    this.paddle = {
      x: (this.canvasWidth - this.paddleWidth) / 2,
      y: this.canvasHeight - 30
    };

    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isWon = false;
    this.isPaused = false;

    this.initBricks();
  }

  initBricks(): void {
    this.bricks = [];
    const brickWidth = (this.canvasWidth - this.brickGap * (BRICK_COLS + 1)) / BRICK_COLS;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        this.bricks.push({
          x: this.brickGap + col * (brickWidth + this.brickGap),
          y: this.brickGap + row * (this.brickHeight + this.brickGap),
          width: brickWidth,
          height: this.brickHeight,
          color: BRICK_COLORS[row],
          alive: true
        });
      }
    }
  }

  getState(): GameBounceState {
    return {
      ball: { ...this.ball },
      paddle: { ...this.paddle },
      bricks: this.bricks.map(b => ({ ...b })),
      score: this.score,
      level: this.level,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isWon: this.isWon,
      isPaused: this.isPaused
    };
  }

  setPaddlePosition(x: number): void {
    this.paddle.x = Math.max(0, Math.min(x - this.paddleWidth / 2, this.canvasWidth - this.paddleWidth));
  }

  tick(): boolean {
    if (this.isGameOver || this.isPaused || this.isWon) return false;

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.canvasWidth) {
      this.ball.dx = -this.ball.dx;
      this.ball.x = Math.max(this.ball.radius, Math.min(this.ball.x, this.canvasWidth - this.ball.radius));
    }

    if (this.ball.y - this.ball.radius <= 0) {
      this.ball.dy = -this.ball.dy;
      this.ball.y = this.ball.radius;
    }

    if (this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.y - this.ball.radius <= this.paddle.y + this.paddleHeight &&
        this.ball.x >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddleWidth) {
      const hitPoint = (this.ball.x - this.paddle.x) / this.paddleWidth;
      const angle = (hitPoint - 0.5) * Math.PI * 0.7;
      const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);

      this.ball.dx = speed * Math.sin(angle);
      this.ball.dy = -Math.abs(speed * Math.cos(angle));
      this.ball.y = this.paddle.y - this.ball.radius;
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;

      if (this.ball.x + this.ball.radius > brick.x &&
          this.ball.x - this.ball.radius < brick.x + brick.width &&
          this.ball.y + this.ball.radius > brick.y &&
          this.ball.y - this.ball.radius < brick.y + brick.height) {

        brick.alive = false;
        this.score += 10;

        const overlapLeft = this.ball.x + this.ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (this.ball.x - this.ball.radius);
        const overlapTop = this.ball.y + this.ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (this.ball.y - this.ball.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          this.ball.dx = -this.ball.dx;
        } else {
          this.ball.dy = -this.ball.dy;
        }

        break;
      }
    }

    if (this.bricks.every(b => !b.alive)) {
      this.isWon = true;
      return false;
    }

    if (this.ball.y + this.ball.radius > this.canvasHeight) {
      this.lives--;
      if (this.lives <= 0) {
        this.isGameOver = true;
      } else {
        this.ball = {
          x: this.canvasWidth / 2,
          y: this.canvasHeight - 100,
          dx: BOUNCE_CONSTANTS.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
          dy: -BOUNCE_CONSTANTS.BALL_SPEED,
          radius: BOUNCE_CONSTANTS.BALL_RADIUS
        };
      }
    }

    return true;
  }

  nextLevel(): void {
    this.level++;
    this.ball = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 100,
      dx: BOUNCE_CONSTANTS.BALL_SPEED * (1 + this.level * 0.2),
      dy: -BOUNCE_CONSTANTS.BALL_SPEED * (1 + this.level * 0.2),
      radius: BOUNCE_CONSTANTS.BALL_RADIUS
    };
    this.isWon = false;
    this.initBricks();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  reset(): void {
    this.init();
  }
}
