import { BULLET_HEAVEN_CONSTANTS } from '../../utils/bulletHeavenConstants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  POWERUP_SIZE,
  INITIAL_SPEED,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
} = BULLET_HEAVEN_CONSTANTS;

export type PowerUpType = 'health' | 'speed' | 'weapon' | 'shield' | 'magnet';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isPlayer: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  size: number;
  health: number;
  maxHealth: number;
  type: 'basic' | 'shooter' | 'spinner' | 'burst';
  angle: number;
  shootTimer: number;
  burstTimer: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  size: number;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Player {
  x: number;
  y: number;
  size: number;
  speed: number;
  weaponLevel: number;
  hasShield: boolean;
  hasMagnet: boolean;
  magnetRange: number;
  invincibleTime: number;
  invincibleFrames: number;
}

export interface BulletHeavenState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  particles: Particle[];
  score: number;
  level: number;
  survivalTime: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

const BULLET_COLORS = [
  '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#ff6b81', '#c8d6e5'
];

export class BulletHeavenEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private particles: Particle[];
  private score: number;
  private level: number;
  private survivalTime: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private keys: Set<string>;
  private lastShot: number;
  private shootInterval: number;
  private lastEnemySpawn: number;
  private enemySpawnInterval: number;
  private frameCount: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.survivalTime = 0;
    this.isGameOver = false;
    this.isPlaying = false;
    this.keys = new Set();
    this.lastShot = 0;
    this.shootInterval = 100;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 1500;
    this.frameCount = 0;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      size: PLAYER_SIZE,
      speed: INITIAL_SPEED,
      weaponLevel: 1,
      hasShield: false,
      hasMagnet: false,
      magnetRange: 80,
      invincibleTime: 0,
      invincibleFrames: 0
    };
  }

  getState(): BulletHeavenState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      particles: this.particles.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      survivalTime: this.survivalTime,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
    this.survivalTime = 0;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.survivalTime = 0;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.enemySpawnInterval = 1500;
    this.frameCount = 0;
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  private spawnEnemy(): void {
    const types: ('basic' | 'shooter' | 'spinner' | 'burst')[] = ['basic', 'shooter', 'spinner', 'burst'];
    const weights = [0.4, 0.25, 0.2, 0.15];
    const rand = Math.random();
    let cumulative = 0;
    let type: 'basic' | 'shooter' | 'spinner' | 'burst' = 'basic';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    const size = 30 + Math.random() * 20;

    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -size; break;
      case 1: x = CANVAS_WIDTH + size; y = Math.random() * CANVAS_HEIGHT / 2; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = -size; break;
      default: x = -size; y = Math.random() * CANVAS_HEIGHT / 2; break;
    }

    this.enemies.push({
      x, y, size,
      health: type === 'basic' ? 1 : type === 'shooter' ? 2 : type === 'spinner' ? 3 : 2,
      maxHealth: type === 'basic' ? 1 : type === 'shooter' ? 2 : type === 'spinner' ? 3 : 2,
      type,
      angle: 0,
      shootTimer: 60 + Math.random() * 60,
      burstTimer: 0
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['health', 'speed', 'weapon', 'shield', 'magnet'];
    const weights = [0.3, 0.2, 0.25, 0.15, 0.1];
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
      x, y,
      type,
      size: POWERUP_SIZE,
      lifetime: 600
    });
  }

  private createParticles(x: number, y: number, color: string, count: number, speed: number = 3): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const vel = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 3 + Math.random() * 4,
        color,
        life: 30 + Math.random() * 20,
        maxLife: 50
      });
    }
  }

  private checkCollision(
    a: { x: number; y: number; size: number },
    b: { x: number; y: number; size: number }
  ): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.size + b.size) / 2;
  }

  private firePlayerBullets(): void {
    const now = Date.now();
    if (now - this.lastShot < this.shootInterval) return;
    this.lastShot = now;

    const weaponLevel = this.player.weaponLevel;

    switch (weaponLevel) {
      case 1:
        this.playerBullets.push({
          x: this.player.x,
          y: this.player.y,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#00ffff',
          isPlayer: true
        });
        break;
      case 2:
        this.playerBullets.push({
          x: this.player.x - 10,
          y: this.player.y,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#00ffff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: this.player.x + 10,
          y: this.player.y,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#00ffff',
          isPlayer: true
        });
        break;
      case 3:
        this.playerBullets.push({
          x: this.player.x,
          y: this.player.y,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#ff00ff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: this.player.x - 15,
          y: this.player.y,
          vx: -1,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#ff00ff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: this.player.x + 15,
          y: this.player.y,
          vx: 1,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#ff00ff',
          isPlayer: true
        });
        break;
      default:
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + (i - 2) * 0.15;
          this.playerBullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * PLAYER_BULLET_SPEED,
            vy: Math.sin(angle) * PLAYER_BULLET_SPEED,
            size: BULLET_SIZE * 0.8,
            color: '#ffff00',
            isPlayer: true
          });
        }
        break;
    }
  }

  private fireEnemyBullet(enemy: Enemy): void {
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];

    this.enemyBullets.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
      vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
      size: BULLET_SIZE,
      color,
      isPlayer: false
    });
  }

  private fireBurstBullets(enemy: Enemy): void {
    const count = 8 + this.level * 2;
    const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + enemy.angle;
      this.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.8,
        vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 0.8,
        size: BULLET_SIZE * 0.7,
        color,
        isPlayer: false
      });
    }
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    this.frameCount++;
    this.survivalTime += 1 / 60;
    this.level = Math.floor(this.survivalTime / 30) + 1;

    const moveSpeed = this.player.speed * (this.keys.has('shift') ? 1.5 : 1);
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

    this.player.x = Math.max(this.player.size / 2, Math.min(CANVAS_WIDTH - this.player.size / 2, this.player.x));
    this.player.y = Math.max(this.player.size / 2, Math.min(CANVAS_HEIGHT - this.player.size / 2, this.player.y));

    this.firePlayerBullets();

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -bullet.size || bullet.x < -bullet.size ||
          bullet.x > CANVAS_WIDTH + bullet.size || bullet.y > CANVAS_HEIGHT + bullet.size) {
        this.playerBullets.splice(i, 1);
      }
    }

    const now = Date.now();
    this.enemySpawnInterval = Math.max(400, 1500 - this.level * 100);
    if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.angle += 0.02;

      switch (enemy.type) {
        case 'basic':
          enemy.y += 1 + this.level * 0.1;
          break;
        case 'shooter':
          enemy.y += 0.5;
          enemy.shootTimer--;
          if (enemy.shootTimer <= 0) {
            this.fireEnemyBullet(enemy);
            enemy.shootTimer = Math.max(30, 90 - this.level * 5);
          }
          break;
        case 'spinner':
          enemy.x += Math.sin(enemy.angle * 2) * 2;
          enemy.y += 0.8;
          enemy.shootTimer--;
          if (enemy.shootTimer <= 0) {
            this.fireEnemyBullet(enemy);
            enemy.shootTimer = Math.max(20, 60 - this.level * 3);
          }
          break;
        case 'burst':
          enemy.y += 0.6;
          enemy.burstTimer++;
          if (enemy.burstTimer >= 120) {
            this.fireBurstBullets(enemy);
            enemy.burstTimer = 0;
          }
          break;
      }

      if (enemy.y > CANVAS_HEIGHT + enemy.size || enemy.x < -enemy.size * 2 || enemy.x > CANVAS_WIDTH + enemy.size * 2) {
        this.enemies.splice(i, 1);
        continue;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(
          { x: bullet.x, y: bullet.y, size: bullet.size },
          { x: enemy.x, y: enemy.y, size: enemy.size }
        )) {
          this.playerBullets.splice(j, 1);
          enemy.health--;

          this.createParticles(bullet.x, bullet.y, bullet.color, 3, 2);

          if (enemy.health <= 0) {
            this.score += enemy.type === 'basic' ? 10 : enemy.type === 'shooter' ? 20 : enemy.type === 'spinner' ? 25 : 30;
            this.createParticles(enemy.x, enemy.y, '#ff6b6b', 10, 4);

            if (Math.random() < 0.15) {
              this.spawnPowerUp(enemy.x, enemy.y);
            }

            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -bullet.size || bullet.x < -bullet.size ||
          bullet.x > CANVAS_WIDTH + bullet.size || bullet.y > CANVAS_HEIGHT + bullet.size) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.checkCollision(
        { x: bullet.x, y: bullet.y, size: bullet.size },
        { x: this.player.x, y: this.player.y, size: this.player.size }
      )) {
        this.enemyBullets.splice(i, 1);
        this.createParticles(bullet.x, bullet.y, bullet.color, 5, 3);

        if (this.player.invincibleFrames <= 0 && !this.player.hasShield) {
          this.isGameOver = true;
        }
      }
    }

    for (const enemy of this.enemies) {
      if (this.checkCollision(
        { x: enemy.x, y: enemy.y, size: enemy.size },
        { x: this.player.x, y: this.player.y, size: this.player.size }
      )) {
        if (this.player.invincibleFrames <= 0 && !this.player.hasShield) {
          this.isGameOver = true;
        }
      }
    }

    if (this.player.hasMagnet) {
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const powerUp = this.powerUps[i];
        const dx = this.player.x - powerUp.x;
        const dy = this.player.y - powerUp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.player.magnetRange) {
          powerUp.x += (dx / dist) * 5;
          powerUp.y += (dy / dist) * 5;
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

      if (this.checkCollision(
        { x: powerUp.x, y: powerUp.y, size: powerUp.size },
        { x: this.player.x, y: this.player.y, size: this.player.size }
      )) {
        switch (powerUp.type) {
          case 'health':
            break;
          case 'speed':
            this.player.speed += 1;
            break;
          case 'weapon':
            this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, 5);
            this.shootInterval = Math.max(50, this.shootInterval - 15);
            break;
          case 'shield':
            this.player.hasShield = true;
            break;
          case 'magnet':
            this.player.hasMagnet = true;
            break;
        }
        this.createParticles(powerUp.x, powerUp.y, '#00ff88', 8, 4);
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.player.invincibleFrames > 0) {
      this.player.invincibleFrames--;
    }
  }
}
