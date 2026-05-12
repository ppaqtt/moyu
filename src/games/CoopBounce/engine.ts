import { COOP_BOUNCE_CONSTANTS } from '../../utils/constants';

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  id: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  playerId: number;
  direction: number;
}

export interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  active: boolean;
}

export interface CoopBounceState {
  balls: Ball[];
  platform1: Platform;
  platform2: Platform;
  targets: Target[];
  score: { player1: number; player2: number; cooperative: number };
  gameStatus: 'idle' | 'playing' | 'gameover';
  combo: { player1: number; player2: number };
  timeBonus: number;
}

export class CoopBounceEngine {
  private balls: Ball[] = [];
  private platform1: Platform;
  private platform2: Platform;
  private targets: Target[] = [];
  private score: { player1: number; player2: number; cooperative: number } = { player1: 0, player2: 0, cooperative: 0 };
  private gameStatus: 'idle' | 'playing' | 'gameover' = 'idle';
  private combo: { player1: number; player2: number } = { player1: 0, player2: 0 };
  private timeBonus: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private lastBallSpawn: number = 0;
  private ballSpawnInterval: number = 5000;

  constructor() {
    this.canvasWidth = COOP_BOUNCE_CONSTANTS.CANVAS_WIDTH;
    this.canvasHeight = COOP_BOUNCE_CONSTANTS.CANVAS_HEIGHT;
    this.init();
  }

  private init(): void {
    this.balls = [];
    this.platform1 = {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 60,
      width: COOP_BOUNCE_CONSTANTS.PLATFORM_WIDTH,
      height: COOP_BOUNCE_CONSTANTS.PLATFORM_HEIGHT,
      playerId: 1,
      direction: 0
    };
    this.platform2 = {
      x: this.canvasWidth / 2,
      y: 60,
      width: COOP_BOUNCE_CONSTANTS.PLATFORM_WIDTH,
      height: COOP_BOUNCE_CONSTANTS.PLATFORM_HEIGHT,
      playerId: 2,
      direction: 0
    };
    this.targets = this.createTargets();
    this.score = { player1: 0, player2: 0, cooperative: 0 };
    this.gameStatus = 'idle';
    this.combo = { player1: 0, player2: 0 };
    this.timeBonus = 0;
    this.lastBallSpawn = 0;
  }

  private createBall(): Ball {
    return {
      x: Math.random() * (this.canvasWidth - 100) + 50,
      y: this.canvasHeight / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2),
      radius: COOP_BOUNCE_CONSTANTS.BALL_RADIUS,
      active: true,
      id: Date.now()
    };
  }

  private createTargets(): Target[] {
    const targets: Target[] = [];
    const rows = 3;
    const cols = 5;
    const targetWidth = 80;
    const targetHeight = 20;
    const startX = (this.canvasWidth - cols * (targetWidth + 15)) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        targets.push({
          x: startX + col * (targetWidth + 15),
          y: this.canvasHeight / 2 - 50 + row * (targetHeight + 10),
          width: targetWidth,
          height: targetHeight,
          points: (rows - row) * 20,
          active: true
        });
      }
    }
    return targets;
  }

  public start(): void {
    if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
      this.init();
      this.gameStatus = 'playing';
      this.balls.push(this.createBall());
      this.lastBallSpawn = Date.now();
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

  public setPlatform1Direction(direction: number): void {
    this.platform1.direction = direction;
  }

  public setPlatform2Direction(direction: number): void {
    this.platform2.direction = direction;
  }

  private movePlatforms(): void {
    const speed = 8;

    this.platform1.x += this.platform1.direction * speed;
    this.platform1.x = Math.max(
      this.platform1.width / 2,
      Math.min(this.canvasWidth - this.platform1.width / 2, this.platform1.x)
    );

    this.platform2.x += this.platform2.direction * speed;
    this.platform2.x = Math.max(
      this.platform2.width / 2,
      Math.min(this.canvasWidth - this.platform2.width / 2, this.platform2.x)
    );
  }

  private moveBalls(): void {
    for (const ball of this.balls) {
      if (!ball.active) continue;

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvasWidth) {
        ball.vx = -ball.vx;
        ball.x = ball.x - ball.radius < 0 ? ball.radius : this.canvasWidth - ball.radius;
      }

      if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.canvasHeight) {
        ball.vy = -ball.vy;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : this.canvasHeight - ball.radius;
        ball.active = false;
      }
    }

    this.balls = this.balls.filter(b => b.active);
  }

  private checkPlatformCollision(ball: Ball, platform: Platform, playerId: 1 | 2): void {
    if (
      ball.x + ball.radius > platform.x - platform.width / 2 &&
      ball.x - ball.radius < platform.x + platform.width / 2 &&
      ball.y + ball.radius > platform.y - platform.height / 2 &&
      ball.y - ball.radius < platform.y + platform.height / 2
    ) {
      const hitPos = (ball.x - platform.x) / (platform.width / 2);
      ball.vx = hitPos * 5;
      ball.vy = playerId === 1 ? -Math.abs(ball.vy) : Math.abs(ball.vy);

      if (playerId === 1) {
        ball.y = platform.y - platform.height / 2 - ball.radius;
      } else {
        ball.y = platform.y + platform.height / 2 + ball.radius;
      }

      const combo = playerId === 1 ? this.combo.player1 : this.combo.player2;
      const points = 5 + Math.min(combo, 10) * 2;

      if (playerId === 1) {
        this.score.player1 += points;
        this.combo.player1++;
      } else {
        this.score.player2 += points;
        this.combo.player2++;
      }
      this.score.cooperative += points;
    }
  }

  private checkTargetCollision(ball: Ball): void {
    for (const target of this.targets) {
      if (!target.active) continue;

      if (
        ball.x + ball.radius > target.x &&
        ball.x - ball.radius < target.x + target.width &&
        ball.y + ball.radius > target.y &&
        ball.y - ball.radius < target.y + target.height
      ) {
        target.active = false;

        const comboBonus = Math.floor(Math.random() * 5) + 1;
        const points = target.points * comboBonus;

        if (ball.vy > 0) {
          this.score.player1 += points;
          this.combo.player1++;
        } else {
          this.score.player2 += points;
          this.combo.player2++;
        }
        this.score.cooperative += points;

        ball.vy = -ball.vy;
        break;
      }
    }
  }

  private checkVictory(): boolean {
    return this.targets.every(t => !t.active);
  }

  private spawnNewBall(): void {
    if (this.balls.length === 0) {
      const now = Date.now();
      if (now - this.lastBallSpawn > this.ballSpawnInterval) {
        this.balls.push(this.createBall());
        this.lastBallSpawn = now;
      }
    }
  }

  public tick(): void {
    if (this.gameStatus !== 'playing') return;

    this.movePlatforms();
    this.moveBalls();

    for (const ball of this.balls) {
      if (!ball.active) continue;
      this.checkPlatformCollision(ball, this.platform1, 1);
      this.checkPlatformCollision(ball, this.platform2, 2);
      this.checkTargetCollision(ball);
    }

    this.spawnNewBall();

    if (this.checkVictory()) {
      this.timeBonus = 500;
      this.gameStatus = 'gameover';
    }

    if (this.balls.length === 0 && Date.now() - this.lastBallSpawn > 10000) {
      this.balls.push(this.createBall());
      this.lastBallSpawn = Date.now();
    }
  }

  public getState(): CoopBounceState {
    return {
      balls: this.balls.map(b => ({ ...b })),
      platform1: { ...this.platform1 },
      platform2: { ...this.platform2 },
      targets: this.targets.map(t => ({ ...t })),
      score: { ...this.score },
      gameStatus: this.gameStatus,
      combo: { ...this.combo },
      timeBonus: this.timeBonus
    };
  }

  public getScore(): { player1: number; player2: number; cooperative: number } {
    return this.score;
  }

  public getGameStatus(): string {
    return this.gameStatus;
  }
}
