export interface Player {
  x: number;
  y: number;
  health: number;
  angle: number;
  velocityX: number;
  velocityY: number;
  isShooting: boolean;
  shootCooldown: number;
}

export interface Bullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  owner: 'player1' | 'player2';
}

export interface Game1v1State {
  player1: Player;
  player2: Player;
  bullets: Bullet[];
  scores: { player1: number; player2: number };
  roundWinner: 'player1' | 'player2' | null;
  isRoundOver: boolean;
  isGameStarted: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;
const BULLET_SPEED = 10;
const BULLET_SIZE = 8;
const GRAVITY = 0.3;
const MOVE_SPEED = 5;
const JUMP_FORCE = -12;
const SHOOT_COOLDOWN = 500;

export class Game1v1Engine {
  private player1: Player;
  private player2: Player;
  private bullets: Bullet[];
  private scores: { player1: number; player2: number };
  private roundWinner: 'player1' | 'player2' | null;
  private isRoundOver: boolean;
  private isGameStarted: boolean;
  private groundY: number;

  constructor() {
    this.player1 = {
      x: 100,
      y: 300,
      health: 100,
      angle: -30,
      velocityX: 0,
      velocityY: 0,
      isShooting: false,
      shootCooldown: 0
    };
    this.player2 = {
      x: 700,
      y: 300,
      health: 100,
      angle: 210,
      velocityX: 0,
      velocityY: 0,
      isShooting: false,
      shootCooldown: 0
    };
    this.bullets = [];
    this.scores = { player1: 0, player2: 0 };
    this.roundWinner = null;
    this.isRoundOver = false;
    this.isGameStarted = false;
    this.groundY = CANVAS_HEIGHT - 60;
  }

  getState(): Game1v1State {
    return {
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      bullets: this.bullets.map(b => ({ ...b })),
      scores: { ...this.scores },
      roundWinner: this.roundWinner,
      isRoundOver: this.isRoundOver,
      isGameStarted: this.isGameStarted
    };
  }

  start(): void {
    this.isGameStarted = true;
  }

  player1MoveLeft(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player1.velocityX = -MOVE_SPEED;
  }

  player1MoveRight(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player1.velocityX = MOVE_SPEED;
  }

  player1Jump(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    if (this.player1.y >= this.groundY - PLAYER_SIZE) {
      this.player1.velocityY = JUMP_FORCE;
    }
  }

  player1AimUp(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player1.angle = Math.max(-80, this.player1.angle - 2);
  }

  player1AimDown(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player1.angle = Math.min(0, this.player1.angle + 2);
  }

  player1Shoot(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    if (Date.now() - this.player1.shootCooldown < SHOOT_COOLDOWN) return;

    const rad = (this.player1.angle * Math.PI) / 180;
    this.bullets.push({
      x: this.player1.x + Math.cos(rad) * 30,
      y: this.player1.y - 20 + Math.sin(rad) * 30,
      velocityX: Math.cos(rad) * BULLET_SPEED,
      velocityY: Math.sin(rad) * BULLET_SPEED,
      owner: 'player1'
    });
    this.player1.shootCooldown = Date.now();
  }

  player2MoveLeft(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player2.velocityX = -MOVE_SPEED;
  }

  player2MoveRight(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player2.velocityX = MOVE_SPEED;
  }

  player2Jump(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    if (this.player2.y >= this.groundY - PLAYER_SIZE) {
      this.player2.velocityY = JUMP_FORCE;
    }
  }

  player2AimUp(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player2.angle = Math.min(80, this.player2.angle + 2);
  }

  player2AimDown(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    this.player2.angle = Math.max(180, this.player2.angle - 2);
  }

  player2Shoot(): void {
    if (!this.isGameStarted || this.isRoundOver) return;
    if (Date.now() - this.player2.shootCooldown < SHOOT_COOLDOWN) return;

    const rad = (this.player2.angle * Math.PI) / 180;
    this.bullets.push({
      x: this.player2.x + Math.cos(rad) * 30,
      y: this.player2.y - 20 + Math.sin(rad) * 30,
      velocityX: Math.cos(rad) * BULLET_SPEED,
      velocityY: Math.sin(rad) * BULLET_SPEED,
      owner: 'player2'
    });
    this.player2.shootCooldown = Date.now();
  }

  tick(): void {
    if (!this.isGameStarted || this.isRoundOver) return;

    [this.player1, this.player2].forEach(player => {
      player.x += player.velocityX;
      player.velocityX *= 0.8;
      player.velocityY += GRAVITY;
      player.y += player.velocityY;

      if (player.y > this.groundY - PLAYER_SIZE) {
        player.y = this.groundY - PLAYER_SIZE;
        player.velocityY = 0;
      }

      player.x = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, player.x));
    });

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.velocityX;
      bullet.velocityY += GRAVITY * 0.3;
      bullet.y += bullet.velocityY;

      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
        continue;
      }

      const target = bullet.owner === 'player1' ? this.player2 : this.player1;
      const dx = bullet.x - target.x;
      const dy = bullet.y - (target.y - PLAYER_SIZE / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PLAYER_SIZE / 2 + BULLET_SIZE) {
        target.health -= 25;
        this.bullets.splice(i, 1);

        if (target.health <= 0) {
          this.isRoundOver = true;
          if (bullet.owner === 'player1') {
            this.roundWinner = 'player1';
            this.scores.player1++;
          } else {
            this.roundWinner = 'player2';
            this.scores.player2++;
          }
        }
      }
    }
  }

  nextRound(): void {
    this.player1 = {
      x: 100,
      y: 300,
      health: 100,
      angle: -30,
      velocityX: 0,
      velocityY: 0,
      isShooting: false,
      shootCooldown: 0
    };
    this.player2 = {
      x: 700,
      y: 300,
      health: 100,
      angle: 210,
      velocityX: 0,
      velocityY: 0,
      isShooting: false,
      shootCooldown: 0
    };
    this.bullets = [];
    this.roundWinner = null;
    this.isRoundOver = false;
  }

  reset(): void {
    this.nextRound();
    this.scores = { player1: 0, player2: 0 };
    this.isGameStarted = false;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
