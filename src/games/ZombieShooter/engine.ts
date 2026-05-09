import { ZOMBIE_SHOOTER_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  ZOMBIE_SIZE,
  BULLET_SIZE,
  INITIAL_SPEED,
  BULLET_SPEED,
  ZOMBIE_SPEED
} = ZOMBIE_SHOOTER_CONSTANTS;

export type PowerUpType = 'health' | 'ammo' | 'score';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

export interface Zombie {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'normal' | 'fast' | 'tank';
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  width: number;
  height: number;
  lifetime: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  angle: number;
  invincibleTime: number;
}

export interface ZombieShooterState {
  player: Player;
  bullets: Bullet[];
  zombies: Zombie[];
  powerUps: PowerUp[];
  score: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
  zombiesRemaining: number;
  waveInProgress: boolean;
}

export class ZombieShooterEngine {
  private player: Player;
  private bullets: Bullet[];
  private zombies: Zombie[];
  private powerUps: PowerUp[];
  private score: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private zombiesRemaining: number;
  private waveInProgress: boolean;
  private lastZombieSpawn: number;
  private zombieSpawnInterval: number;
  private mouseX: number;
  private mouseY: number;
  private keys: Set<string>;
  private lastShot: number;
  private shootCooldown: number;

  constructor() {
    this.player = this.createPlayer();
    this.bullets = [];
    this.zombies = [];
    this.powerUps = [];
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.zombiesRemaining = 0;
    this.waveInProgress = false;
    this.lastZombieSpawn = 0;
    this.zombieSpawnInterval = 2000;
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT / 2;
    this.keys = new Set();
    this.lastShot = 0;
    this.shootCooldown = 250;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      speed: INITIAL_SPEED,
      health: 100,
      maxHealth: 100,
      ammo: 30,
      maxAmmo: 30,
      angle: 0,
      invincibleTime: 0
    };
  }

  getState(): ZombieShooterState {
    return {
      player: { ...this.player },
      bullets: this.bullets.map(b => ({ ...b })),
      zombies: this.zombies.map(z => ({ ...z })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      zombiesRemaining: this.zombiesRemaining,
      waveInProgress: this.waveInProgress
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
    this.wave = 1;
    this.zombiesRemaining = 5 + this.wave * 2;
    this.waveInProgress = true;
    this.zombieSpawnInterval = Math.max(500, 2000 - this.wave * 100);
  }

  reset(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.zombies = [];
    this.powerUps = [];
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.zombiesRemaining = 0;
    this.waveInProgress = false;
    this.lastZombieSpawn = 0;
    this.zombieSpawnInterval = 2000;
    this.lastShot = 0;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.player.angle = Math.atan2(
      y - (this.player.y + this.player.height / 2),
      x - (this.player.x + this.player.width / 2)
    );
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastShot < this.shootCooldown) return;
    if (this.player.ammo <= 0) return;

    this.lastShot = now;
    this.player.ammo--;

    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + this.player.height / 2;

    this.bullets.push({
      x: centerX - BULLET_SIZE / 2,
      y: centerY - BULLET_SIZE / 2,
      vx: Math.cos(this.player.angle) * BULLET_SPEED,
      vy: Math.sin(this.player.angle) * BULLET_SPEED,
      width: BULLET_SIZE,
      height: BULLET_SIZE
    });
  }

  private spawnZombie(): void {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    const zombieType = this.getZombieType();
    let width = ZOMBIE_SIZE;
    let height = ZOMBIE_SIZE;
    let health = 1;
    let speed = ZOMBIE_SPEED + this.wave * 0.1;

    switch (zombieType) {
      case 'fast':
        width = ZOMBIE_SIZE * 0.7;
        height = ZOMBIE_SIZE * 0.7;
        speed *= 1.8;
        break;
      case 'tank':
        width = ZOMBIE_SIZE * 1.5;
        height = ZOMBIE_SIZE * 1.5;
        health = 3 + Math.floor(this.wave / 2);
        speed *= 0.6;
        break;
      default:
        break;
    }

    switch (side) {
      case 0:
        x = Math.random() * CANVAS_WIDTH;
        y = -height;
        break;
      case 1:
        x = CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
        break;
      case 2:
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT;
        break;
      default:
        x = -width;
        y = Math.random() * CANVAS_HEIGHT;
        break;
    }

    this.zombies.push({
      x,
      y,
      width,
      height,
      health,
      maxHealth: health,
      speed,
      type: zombieType
    });
  }

  private getZombieType(): 'normal' | 'fast' | 'tank' {
    const rand = Math.random();
    if (this.wave >= 3 && rand < 0.1 + this.wave * 0.02) {
      return 'tank';
    } else if (this.wave >= 2 && rand < 0.25 + this.wave * 0.03) {
      return 'fast';
    }
    return 'normal';
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['health', 'ammo', 'score'];
    const weights = [0.4, 0.35, 0.25];
    const rand = Math.random();
    let cumulative = 0;
    let type: PowerUpType = 'health';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      type,
      width: 30,
      height: 30,
      lifetime: 300
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

  private startNextWave(): void {
    this.wave++;
    this.zombiesRemaining = 5 + this.wave * 3;
    this.waveInProgress = true;
    this.zombieSpawnInterval = Math.max(300, 2000 - this.wave * 150);
    this.player.ammo = Math.min(this.player.ammo + 10, this.player.maxAmmo);
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();

    if (this.player.invincibleTime > 0) {
      this.player.invincibleTime--;
    }

    const moveSpeed = this.player.speed;
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.player.y -= moveSpeed;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.player.y += moveSpeed;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.player.x -= moveSpeed;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.player.x += moveSpeed;
    }

    this.player.x = Math.max(0, Math.min(CANVAS_WIDTH - this.player.width, this.player.x));
    this.player.y = Math.max(0, Math.min(CANVAS_HEIGHT - this.player.height, this.player.y));

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (
        bullet.x < -bullet.width ||
        bullet.x > CANVAS_WIDTH ||
        bullet.y < -bullet.height ||
        bullet.y > CANVAS_HEIGHT
      ) {
        this.bullets.splice(i, 1);
      }
    }

    if (this.waveInProgress && this.zombiesRemaining > 0) {
      if (now - this.lastZombieSpawn > this.zombieSpawnInterval) {
        this.spawnZombie();
        this.zombiesRemaining--;
        this.lastZombieSpawn = now;
      }
    } else if (this.zombiesRemaining <= 0 && this.zombies.length === 0) {
      this.waveInProgress = false;
      setTimeout(() => {
        if (this.isPlaying && !this.isGameOver) {
          this.startNextWave();
        }
      }, 2000);
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerCenterY = this.player.y + this.player.height / 2;
      const zombieCenterX = zombie.x + zombie.width / 2;
      const zombieCenterY = zombie.y + zombie.height / 2;

      const dx = playerCenterX - zombieCenterX;
      const dy = playerCenterY - zombieCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        zombie.x += (dx / dist) * zombie.speed;
        zombie.y += (dy / dist) * zombie.speed;
      }

      if (this.checkCollision(this.player, zombie)) {
        if (this.player.invincibleTime <= 0) {
          this.player.health -= 20;
          this.player.invincibleTime = 60;

          if (this.player.health <= 0) {
            this.isGameOver = true;
          }
        }
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(bullet, zombie)) {
          this.bullets.splice(j, 1);
          zombie.health--;

          if (zombie.health <= 0) {
            let baseScore = 10;
            if (zombie.type === 'fast') baseScore = 15;
            if (zombie.type === 'tank') baseScore = 25;

            this.score += baseScore * this.wave;

            if (Math.random() < 0.2) {
              this.spawnPowerUp(zombie.x + zombie.width / 2, zombie.y + zombie.height / 2);
            }

            this.zombies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.lifetime--;

      if (powerUp.lifetime <= 0) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp)) {
        if (powerUp.type === 'health') {
          this.player.health = Math.min(this.player.health + 30, this.player.maxHealth);
        } else if (powerUp.type === 'ammo') {
          this.player.ammo = Math.min(this.player.ammo + 15, this.player.maxAmmo);
        } else if (powerUp.type === 'score') {
          this.score += 100 * this.wave;
        }
        this.powerUps.splice(i, 1);
      }
    }
  }
}
