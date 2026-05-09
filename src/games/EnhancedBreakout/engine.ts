import { ENHANCED_BREAKOUT_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_RADIUS,
  BALL_SPEED,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_HEIGHT,
  BRICK_GAP,
  POWERUP_CHANCE
} = ENHANCED_BREAKOUT_CONSTANTS;

// ==================== 类型定义 ====================

export type PowerUpType = 'widen' | 'multi' | 'fireball' | 'slow';

export type GameStatus = 'idle' | 'playing' | 'gameover';

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  isFireball: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alive: boolean;
  hits: number;       // 剩余击打次数
  maxHits: number;     // 最大击打次数
  score: number;       // 击碎得分
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  color: string;
  dy: number;
  label: string;
}

export interface ActiveEffect {
  type: PowerUpType;
  remaining: number; // 剩余帧数
}

export interface GameEngineState {
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerups: PowerUp[];
  activeEffects: ActiveEffect[];
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
}

// ==================== 常量 ====================

const BRICK_COLORS: { color: string; score: number; maxHits: number }[] = [
  // 第1行 (最上面) - 最耐打
  { color: '#ff2e63', score: 50, maxHits: 3 },
  // 第2行
  { color: '#ff6b6b', score: 40, maxHits: 3 },
  // 第3行
  { color: '#ff8c42', score: 35, maxHits: 2 },
  // 第4行
  { color: '#ffd93d', score: 30, maxHits: 2 },
  // 第5行
  { color: '#6bcb77', score: 25, maxHits: 2 },
  // 第6行
  { color: '#4d96ff', score: 20, maxHits: 1 },
  // 第7行
  { color: '#a29bfe', score: 15, maxHits: 1 },
  // 第8行 (最下面) - 最脆弱
  { color: '#00cec9', score: 10, maxHits: 1 },
];

const POWERUP_CONFIG: Record<PowerUpType, { color: string; label: string; duration: number }> = {
  widen:     { color: '#6bcb77', label: 'W', duration: 600 },   // 10秒 @ 60fps
  multi:     { color: '#4d96ff', label: 'M', duration: 0 },     // 即时效果
  fireball:  { color: '#ff2e63', label: 'F', duration: 480 },   // 8秒
  slow:      { color: '#ffd93d', label: 'S', duration: 360 },   // 6秒
};

const POWERUP_SIZE = 20;
const POWERUP_FALL_SPEED = 2.5;
const PADDLE_Y = CANVAS_HEIGHT - 40;
const MAX_LIVES = 3;

// ==================== 引擎类 ====================

export class EnhancedBreakoutEngine {
  private balls: Ball[];
  private paddle: Paddle;
  private bricks: Brick[];
  private powerups: PowerUp[];
  private activeEffects: ActiveEffect[];
  private score: number;
  private lives: number;
  private level: number;
  private status: GameStatus;
  private baseBallSpeed: number;

  constructor() {
    this.balls = [];
    this.paddle = { x: 0, y: PADDLE_Y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    this.bricks = [];
    this.powerups = [];
    this.activeEffects = [];
    this.score = 0;
    this.lives = MAX_LIVES;
    this.level = 1;
    this.status = 'idle';
    this.baseBallSpeed = BALL_SPEED;
    this.resetPaddle();
    this.initBricks();
  }

  // ==================== 初始化 ====================

  private resetPaddle(): void {
    this.paddle.x = (CANVAS_WIDTH - this.paddle.width) / 2;
    this.paddle.y = PADDLE_Y;
  }

  private createBall(x: number, y: number, dx: number, dy: number): Ball {
    return {
      x,
      y,
      dx,
      dy,
      radius: BALL_RADIUS,
      isFireball: false,
    };
  }

  private initBricks(): void {
    this.bricks = [];
    const brickWidth = (CANVAS_WIDTH - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;
    const extraRows = Math.min(this.level - 1, 4); // 最多额外增加4行
    const totalRows = Math.min(BRICK_ROWS + extraRows, 12);
    const startOffset = 50; // 砖块区域起始Y

    for (let row = 0; row < totalRows; row++) {
      const rowConfig = BRICK_COLORS[Math.min(row, BRICK_COLORS.length - 1)];
      // 随关卡提升，砖块耐久度增加
      const extraHits = Math.floor((this.level - 1) / 2);
      const maxHits = Math.min(rowConfig.maxHits + extraHits, 5);

      for (let col = 0; col < BRICK_COLS; col++) {
        this.bricks.push({
          x: BRICK_GAP + col * (brickWidth + BRICK_GAP),
          y: startOffset + row * (BRICK_HEIGHT + BRICK_GAP),
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: rowConfig.color,
          alive: true,
          hits: maxHits,
          maxHits,
          score: rowConfig.score + (this.level - 1) * 5,
        });
      }
    }
  }

  // ==================== 游戏控制 ====================

  start(): void {
    if (this.status !== 'idle') return;
    this.status = 'playing';
    this.launchBall();
  }

  private launchBall(): void {
    const ball = this.createBall(
      this.paddle.x + this.paddle.width / 2,
      PADDLE_Y - BALL_RADIUS - 2,
      this.baseBallSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
      -this.baseBallSpeed
    );
    // 继承火球效果
    if (this.hasEffect('fireball')) {
      ball.isFireball = true;
    }
    this.balls = [ball];
  }

  reset(): void {
    this.balls = [];
    this.paddle = { x: 0, y: PADDLE_Y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    this.powerups = [];
    this.activeEffects = [];
    this.score = 0;
    this.lives = MAX_LIVES;
    this.level = 1;
    this.status = 'idle';
    this.baseBallSpeed = BALL_SPEED;
    this.resetPaddle();
    this.initBricks();
  }

  nextLevel(): void {
    this.level++;
    this.baseBallSpeed = BALL_SPEED + (this.level - 1) * 0.3;
    this.powerups = [];
    this.activeEffects = [];
    this.paddle.width = PADDLE_WIDTH;
    this.resetPaddle();
    this.initBricks();
    this.launchBall();
  }

  // ==================== 输入处理 ====================

  setPaddlePosition(clientX: number, canvasRect: DOMRect): void {
    const x = clientX - canvasRect.left;
    this.paddle.x = Math.max(0, Math.min(x - this.paddle.width / 2, CANVAS_WIDTH - this.paddle.width));
  }

  // ==================== 游戏逻辑 ====================

  tick(): void {
    if (this.status !== 'playing') return;

    this.updateEffects();
    this.updateBalls();
    this.updatePowerups();
    this.checkPowerupCollisions();

    // 检查是否所有砖块被清除
    if (this.bricks.every(b => !b.alive)) {
      this.nextLevel();
    }
  }

  private updateEffects(): void {
    this.activeEffects = this.activeEffects
      .map(e => ({ ...e, remaining: e.remaining - 1 }))
      .filter(e => {
        if (e.remaining <= 0) {
          // 效果结束
          if (e.type === 'widen') {
            this.paddle.width = PADDLE_WIDTH;
          }
          if (e.type === 'fireball') {
            this.balls.forEach(b => { b.isFireball = false; });
          }
          return false;
        }
        return true;
      });
  }

  private updateBalls(): void {
    const currentSpeed = this.hasEffect('slow') ? this.baseBallSpeed * 0.6 : this.baseBallSpeed;

    const ballsToRemove: number[] = [];

    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];

      // 规范化球速
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      if (speed > 0) {
        ball.dx = (ball.dx / speed) * currentSpeed;
        ball.dy = (ball.dy / speed) * currentSpeed;
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      // 左右墙壁碰撞
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx = Math.abs(ball.dx);
      }
      if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.dx = -Math.abs(ball.dx);
      }

      // 顶部墙壁碰撞
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
      }

      // 球拍碰撞
      if (
        ball.dy > 0 &&
        ball.y + ball.radius >= this.paddle.y &&
        ball.y + ball.radius <= this.paddle.y + this.paddle.height + 4 &&
        ball.x >= this.paddle.x - ball.radius &&
        ball.x <= this.paddle.x + this.paddle.width + ball.radius
      ) {
        const hitPoint = (ball.x - this.paddle.x) / this.paddle.width;
        const angle = (hitPoint - 0.5) * Math.PI * 0.7;
        ball.dx = currentSpeed * Math.sin(angle);
        ball.dy = -Math.abs(currentSpeed * Math.cos(angle));
        ball.y = this.paddle.y - ball.radius;
      }

      // 砖块碰撞
      for (const brick of this.bricks) {
        if (!brick.alive) continue;

        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          brick.hits--;
          if (brick.hits <= 0) {
            brick.alive = false;
            this.score += brick.score;
            // 概率掉落道具
            if (Math.random() < POWERUP_CHANCE) {
              this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
          }

          // 火球不反弹
          if (!ball.isFireball) {
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            const minX = Math.min(overlapLeft, overlapRight);
            const minY = Math.min(overlapTop, overlapBottom);
            if (minX < minY) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }
          }

          break; // 每帧每球只处理一个砖块碰撞
        }
      }

      // 球掉出底部
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        ballsToRemove.push(i);
      }
    }

    // 移除掉出的球
    for (let i = ballsToRemove.length - 1; i >= 0; i--) {
      this.balls.splice(ballsToRemove[i], 1);
    }

    // 所有球都掉出
    if (this.balls.length === 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.status = 'gameover';
      } else {
        this.launchBall();
      }
    }
  }

  private updatePowerups(): void {
    this.powerups = this.powerups.filter(p => {
      p.y += POWERUP_FALL_SPEED;

      // 掉出屏幕
      if (p.y > CANVAS_HEIGHT + POWERUP_SIZE) {
        return false;
      }
      return true;
    });
  }

  private checkPowerupCollisions(): void {
    const collected: number[] = [];

    for (let i = 0; i < this.powerups.length; i++) {
      const p = this.powerups[i];

      if (
        p.x + p.width / 2 > this.paddle.x &&
        p.x - p.width / 2 < this.paddle.x + this.paddle.width &&
        p.y + p.height / 2 > this.paddle.y &&
        p.y - p.height / 2 < this.paddle.y + this.paddle.height
      ) {
        this.applyPowerup(p.type);
        collected.push(i);
      }
    }

    for (let i = collected.length - 1; i >= 0; i--) {
      this.powerups.splice(collected[i], 1);
    }
  }

  private spawnPowerup(x: number, y: number): void {
    const types: PowerUpType[] = ['widen', 'multi', 'fireball', 'slow'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_CONFIG[type];

    this.powerups.push({
      x,
      y,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      color: config.color,
      dy: POWERUP_FALL_SPEED,
      label: config.label,
    });
  }

  private applyPowerup(type: PowerUpType): void {
    const config = POWERUP_CONFIG[type];

    switch (type) {
      case 'widen':
        this.paddle.width = PADDLE_WIDTH * 1.6;
        this.addEffect('widen', config.duration);
        break;

      case 'multi':
        // 每个现有球分裂成3个
        const newBalls: Ball[] = [];
        for (const ball of this.balls) {
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const angle1 = Math.atan2(ball.dy, ball.dx) - 0.4;
          const angle2 = Math.atan2(ball.dy, ball.dx) + 0.4;
          newBalls.push(
            this.createBall(ball.x, ball.y, speed * Math.cos(angle1), speed * Math.sin(angle1)),
            this.createBall(ball.x, ball.y, speed * Math.cos(angle2), speed * Math.sin(angle2))
          );
          newBalls[0].isFireball = ball.isFireball;
          newBalls[1].isFireball = ball.isFireball;
        }
        this.balls.push(...newBalls);
        // 限制最大球数
        if (this.balls.length > 12) {
          this.balls = this.balls.slice(0, 12);
        }
        break;

      case 'fireball':
        this.balls.forEach(b => { b.isFireball = true; });
        this.addEffect('fireball', config.duration);
        break;

      case 'slow':
        this.addEffect('slow', config.duration);
        break;
    }
  }

  private addEffect(type: PowerUpType, duration: number): void {
    // 移除同类效果
    this.activeEffects = this.activeEffects.filter(e => e.type !== type);
    this.activeEffects.push({ type, remaining: duration });
  }

  hasEffect(type: PowerUpType): boolean {
    return this.activeEffects.some(e => e.type === type);
  }

  // ==================== 状态获取 ====================

  getState(): GameEngineState {
    return {
      balls: this.balls.map(b => ({ ...b })),
      paddle: { ...this.paddle },
      bricks: this.bricks.map(b => ({ ...b })),
      powerups: this.powerups.map(p => ({ ...p })),
      activeEffects: [...this.activeEffects],
      score: this.score,
      lives: this.lives,
      level: this.level,
      status: this.status,
    };
  }
}
