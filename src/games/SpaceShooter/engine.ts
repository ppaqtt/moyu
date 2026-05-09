import { SPACE_SHOOTER_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
  POWERUP_SIZE,
  INITIAL_SPEED,
  BULLET_SPEED,
  ENEMY_SPEED
} = SPACE_SHOOTER_CONSTANTS;

export type PowerUpType = 'speed' | 'shield' | 'life';

export interface Bullet {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'normal' | 'fast' | 'tank' | 'boss';
  speed: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  width: number;
  height: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hasShield: boolean;
  hasSpeedBoost: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
}

export interface SpaceShooterState {
  player: Player;
  playerBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  invincibleTime: number;
  bossActive: boolean;
}

export class SpaceShooterEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private explosions: Explosion[];
  private score: number;
  private level: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private invincibleTime: number;
  private bossActive: boolean;
  private lastEnemySpawn: number;
  private lastBossSpawn: number;
  private lastShot: number;
  private mouseX: number;
  private mouseY: number;
  private shootInterval: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.bossActive = false;
    this.lastEnemySpawn = 0;
    this.lastBossSpawn = 0;
    this.lastShot = 0;
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT - 100;
    this.shootInterval = 150;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 20,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      speed: INITIAL_SPEED,
      hasShield: false,
      hasSpeedBoost: false
    };
  }

  getState(): SpaceShooterState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      level: this.level,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      invincibleTime: this.invincibleTime,
      bossActive: this.bossActive
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
    this.level = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.bossActive = false;
    this.lastEnemySpawn = 0;
    this.lastBossSpawn = 0;
    this.lastShot = 0;
    this.shootInterval = 150;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastShot < this.shootInterval) return;
    this.lastShot = now;

    const bulletX = this.player.x + this.player.width / 2 - BULLET_SIZE / 2;
    const bulletY = this.player.y;

    this.playerBullets.push({
      x: bulletX,
      y: bulletY,
      speed: BULLET_SPEED,
      width: BULLET_SIZE,
      height: BULLET_SIZE * 1.5
    });
  }

  private spawnEnemy(): void {
    const rand = Math.random();
    let type: 'normal' | 'fast' | 'tank';
    let width = ENEMY_SIZE;
    let height = ENEMY_SIZE;
    let health = 1;
    let speed = ENEMY_SPEED + this.level * 0.2;

    if (rand < 0.6) {
      type = 'normal';
    } else if (rand < 0.85) {
      type = 'fast';
      width = ENEMY_SIZE * 0.8;
      height = ENEMY_SIZE * 0.8;
      speed *= 1.5;
    } else {
      type = 'tank';
      width = ENEMY_SIZE * 1.3;
      height = ENEMY_SIZE * 1.3;
      health = 3;
    }

    this.enemies.push({
      x: Math.random() * (CANVAS_WIDTH - width),
      y: -height,
      width,
      height,
      health,
      maxHealth: health,
      type,
      speed
    });
  }

  private spawnBoss(): void {
    const bossWidth = 120;
    const bossHeight = 80;
    this.enemies.push({
      x: CANVAS_WIDTH / 2 - bossWidth / 2,
      y: -bossHeight,
      width: bossWidth,
      height: bossHeight,
      health: 20 + this.level * 5,
      maxHealth: 20 + this.level * 5,
      type: 'boss',
      speed: 1.5
    });
    this.bossActive = true;
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['speed', 'shield', 'life'];
    const weights = [0.4, 0.35, 0.25];
    const rand = Math.random();
    let cumulative = 0;
    let type: PowerUpType = 'speed';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      x: x - POWERUP_SIZE / 2,
      y: y - POWERUP_SIZE / 2,
      type,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE
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
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();

    const playerSpeed = this.player.hasSpeedBoost ? this.player.speed * 1.5 : this.player.speed;
    const targetX = this.mouseX - this.player.width / 2;
    const targetY = this.mouseY - this.player.height / 2;

    const dx = targetX - this.player.x;
    const dy = targetY - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const moveX = (dx / dist) * playerSpeed;
      const moveY = (dy / dist) * playerSpeed;
      this.player.x += Math.abs(dx) > playerSpeed ? moveX : dx;
      this.player.y += Math.abs(dy) > playerSpeed ? moveY : dy;
    }

    this.player.x = Math.max(0, Math.min(CANVAS_WIDTH - this.player.width, this.player.x));
    this.player.y = Math.max(CANVAS_HEIGHT / 2, Math.min(CANVAS_HEIGHT - this.player.height - 10, this.player.y));

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.y -= bullet.speed;
      if (bullet.y < -bullet.height) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(500, 1500 - this.level * 100);
    if (now - this.lastEnemySpawn > spawnRate) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    const bossInterval = Math.max(15000, 30000 - this.level * 2000);
    if (!this.bossActive && this.enemies.filter(e => e.type === 'boss').length === 0 &&
        now - this.lastBossSpawn > bossInterval) {
      this.spawnBoss();
      this.lastBossSpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;

      if (enemy.type === 'boss') {
        if (enemy.y > 50) {
          enemy.y = 50;
        }
        if (now % 1000 < 20) {
          enemy.x += Math.sin(now / 500) * 2;
        }
        enemy.x = Math.max(0, Math.min(CANVAS_WIDTH - enemy.width, enemy.x));
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
            const baseScore = enemy.type === 'boss' ? 500 : enemy.type === 'tank' ? 30 : enemy.type === 'fast' ? 15 : 10;
            this.score += baseScore * this.level;

            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);

            if (enemy.type === 'boss') {
              this.bossActive = false;
              for (let k = 0; k < 3; k++) {
                this.spawnPowerUp(
                  enemy.x + Math.random() * enemy.width,
                  enemy.y + enemy.height / 2
                );
              }
            } else if (Math.random() < 0.15) {
              this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }

            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2;

      if (powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp)) {
        if (powerUp.type === 'speed') {
          this.player.hasSpeedBoost = true;
          setTimeout(() => { this.player.hasSpeedBoost = false; }, 8000);
        } else if (powerUp.type === 'shield') {
          this.player.hasShield = true;
        } else if (powerUp.type === 'life') {
          this.lives = Math.min(this.lives + 1, 5);
        }
        this.powerUps.splice(i, 1);
      }
    }

    for (const enemy of this.enemies) {
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy)) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.enemies = this.enemies.filter(e => e !== enemy);
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
        } else {
          this.lives--;
          this.invincibleTime = 120;
          this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 40);
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
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

    this.level = Math.floor(this.score / 1000) + 1;
    this.shootInterval = Math.max(80, 150 - this.level * 5);
  }
}
