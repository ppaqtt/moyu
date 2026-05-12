import { TANK_BATTLE_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TANK_SIZE,
  BULLET_SIZE,
  INITIAL_SPEED,
  BULLET_SPEED,
  ENEMY_SPEED
} = TANK_BATTLE_CONSTANTS;

export type PowerUpType = 'life' | 'fastBullet';

export interface Bullet {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  isFast: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  lastShot: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  width: number;
  height: number;
  createdAt: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
}

export interface TankBattleState {
  player: Player;
  playerBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  bricks: Brick[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isVictory: boolean;
  isPlaying: boolean;
  enemiesDestroyed: number;
  totalEnemies: number;
  invincibleTime: number;
}

export class TankBattleEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private explosions: Explosion[];
  private bricks: Brick[];
  private score: number;
  private lives: number;
  private isGameOver: boolean;
  private isVictory: boolean;
  private isPlaying: boolean;
  private enemiesDestroyed: number;
  private totalEnemies: number;
  private keys: Set<string>;
  private lastShot: number;
  private lastEnemySpawn: number;
  private invincibleTime: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPlaying = false;
    this.enemiesDestroyed = 0;
    this.totalEnemies = 10;
    this.keys = new Set();
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.invincibleTime = 0;
    this.initBricks();
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2 - TANK_SIZE / 2,
      y: CANVAS_HEIGHT - TANK_SIZE - 20,
      width: TANK_SIZE,
      height: TANK_SIZE,
      speed: INITIAL_SPEED
    };
  }

  private initBricks(): void {
    this.bricks = [];
    const brickCount = 8;
    const startX = (CANVAS_WIDTH - brickCount * 60) / 2;

    for (let i = 0; i < brickCount; i++) {
      this.bricks.push({
        x: startX + i * 60 + 5,
        y: 80,
        width: 50,
        height: 20,
        health: 2
      });
    }
  }

  getState(): TankBattleState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      explosions: this.explosions.map(e => ({ ...e })),
      bricks: this.bricks.map(b => ({ ...b })),
      score: this.score,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      isPlaying: this.isPlaying,
      enemiesDestroyed: this.enemiesDestroyed,
      totalEnemies: this.totalEnemies,
      invincibleTime: this.invincibleTime
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPlaying = false;
    this.enemiesDestroyed = 0;
    this.totalEnemies = 10;
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.invincibleTime = 0;
    this.initBricks();
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastShot < 300) return;
    this.lastShot = now;

    const bulletX = this.player.x + this.player.width / 2 - BULLET_SIZE / 2;
    const bulletY = this.player.y - BULLET_SIZE / 2;

    this.playerBullets.push({
      x: bulletX,
      y: bulletY,
      speed: BULLET_SPEED,
      width: BULLET_SIZE,
      height: BULLET_SIZE * 1.5,
      isFast: false
    });
  }

  private spawnEnemy(): void {
    if (this.enemies.length >= 3) return;

    const x = Math.random() * (CANVAS_WIDTH - TANK_SIZE);
    this.enemies.push({
      x,
      y: -TANK_SIZE,
      width: TANK_SIZE,
      height: TANK_SIZE,
      health: 1,
      maxHealth: 1,
      speed: ENEMY_SPEED + Math.random() * 0.5,
      lastShot: 0
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['life', 'fastBullet'];
    const type = Math.random() < 0.5 ? 'life' : 'fastBullet';

    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      type,
      width: 30,
      height: 30,
      createdAt: Date.now()
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 20 + size / 5
    });
  }

  private checkCollision(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver || this.isVictory) return;

    const now = Date.now();
    const moveSpeed = this.player.speed;

    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.player.y = Math.max(0, this.player.y - moveSpeed);
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.player.y = Math.min(CANVAS_HEIGHT - this.player.height, this.player.y + moveSpeed);
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.player.x = Math.max(0, this.player.x - moveSpeed);
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.player.x = Math.min(CANVAS_WIDTH - this.player.width, this.player.x + moveSpeed);
    }

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      const speed = bullet.isFast ? bullet.speed * 2 : bullet.speed;
      bullet.y -= speed;
      if (bullet.y < -bullet.height) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(1500, 3000 - this.enemiesDestroyed * 100);
    if (now - this.lastEnemySpawn > spawnRate && this.enemies.length < 3) {
      if (this.enemiesDestroyed < this.totalEnemies) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed * 0.3;

      if (now - enemy.lastShot > 2000) {
        enemy.lastShot = now;
      }

      if (enemy.y > CANVAS_HEIGHT + enemy.height) {
        this.enemies.splice(i, 1);
        continue;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy)) {
          this.playerBullets.splice(j, 1);
          enemy.health--;

          if (enemy.health <= 0) {
            this.score += 100;
            this.enemiesDestroyed++;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);

            if (Math.random() < 0.2) {
              this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }

            this.enemies.splice(i, 1);

            if (this.enemiesDestroyed >= this.totalEnemies) {
              this.isVictory = true;
            }
          }
          break;
        }
      }
    }

    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, brick)) {
          this.playerBullets.splice(j, 1);
          brick.health--;

          if (brick.health <= 0) {
            this.score += 20;
            this.bricks.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];

      if (now - powerUp.createdAt > 10000) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp)) {
        if (powerUp.type === 'life') {
          this.lives = Math.min(this.lives + 1, 5);
        } else if (powerUp.type === 'fastBullet') {
          this.playerBullets.forEach(b => { b.isFast = true; });
          setTimeout(() => {
            this.playerBullets.forEach(b => { b.isFast = false; });
          }, 5000);
        }
        this.score += 50;
        this.powerUps.splice(i, 1);
      }
    }

    for (const enemy of this.enemies) {
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy)) {
        this.lives--;
        this.invincibleTime = 120;
        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 40);

        if (this.lives <= 0) {
          this.isGameOver = true;
        }
        break;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }
  }
}
