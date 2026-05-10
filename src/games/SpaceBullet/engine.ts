import { SPACE_BULLET_CONSTANTS } from '../../utils/spaceBulletConstants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
  POWERUP_SIZE,
  PLAYER_SPEED,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
} = SPACE_BULLET_CONSTANTS;

export type PowerUpType = 'laser' | 'spread' | 'shield' | 'homing' | 'rapid';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: 'normal' | 'laser' | 'spread' | 'homing';
  angle: number;
  isPlayer: boolean;
  target?: Enemy | null;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  health: number;
  maxHealth: number;
  type: 'fighter' | 'cruiser' | 'bomber' | 'elite' | 'motherShip';
  angle: number;
  shootTimer: number;
  pattern: number;
  bulletPatterns: Bullet[][];
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  size: number;
  lifetime: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
  color: string;
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
  weaponType: PowerUpType;
  weaponLevel: number;
  hasShield: boolean;
  shieldHealth: number;
  invincibleTime: number;
  invincibleFrames: number;
}

export interface SpaceBulletState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  stars: Star[];
  explosions: Explosion[];
  particles: Particle[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

const BULLET_COLORS = [
  '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#ff6b81', '#00d2d3'
];

const ENEMY_COLORS: Record<string, string> = {
  fighter: '#ff6348',
  cruiser: '#ffa502',
  bomber: '#9b59b6',
  elite: '#e74c3c',
  motherShip: '#c0392b'
};

export class SpaceBulletEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private stars: Star[];
  private explosions: Explosion[];
  private particles: Particle[];
  private score: number;
  private level: number;
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
    this.stars = this.createStars();
    this.explosions = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.keys = new Set();
    this.lastShot = 0;
    this.shootInterval = 120;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 800;
    this.frameCount = 0;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      weaponType: 'laser',
      weaponLevel: 1,
      hasShield: false,
      shieldHealth: 0,
      invincibleTime: 0,
      invincibleFrames: 0
    };
  }

  private createStars(): Star[] {
    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 0.5 + Math.random() * 2,
        speed: 1 + Math.random() * 3,
        brightness: 0.3 + Math.random() * 0.7
      });
    }
    return stars;
  }

  getState(): SpaceBulletState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      stars: this.stars.map(s => ({ ...s })),
      explosions: this.explosions.map(e => ({ ...e })),
      particles: this.particles.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
    this.level = 1;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.stars = this.createStars();
    this.explosions = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.shootInterval = 120;
    this.enemySpawnInterval = 800;
    this.lastEnemySpawn = 0;
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
    const types: ('fighter' | 'cruiser' | 'bomber' | 'elite')[] = ['fighter', 'cruiser', 'bomber', 'elite'];
    const weights = [0.45, 0.25, 0.2, 0.1];
    const rand = Math.random();
    let cumulative = 0;
    let type: 'fighter' | 'cruiser' | 'bomber' | 'elite' = 'fighter';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    let size = ENEMY_SIZE;
    let health = 1;

    switch (type) {
      case 'fighter':
        size = ENEMY_SIZE * 0.8;
        health = 1;
        break;
      case 'cruiser':
        size = ENEMY_SIZE * 1.2;
        health = 3;
        break;
      case 'bomber':
        size = ENEMY_SIZE * 1.4;
        health = 2;
        break;
      case 'elite':
        size = ENEMY_SIZE * 1.1;
        health = 5;
        break;
    }

    const x = Math.random() * (CANVAS_WIDTH - size * 2) + size;
    const y = -size;

    this.enemies.push({
      x, y,
      vx: 0,
      vy: 1.5 + this.level * 0.15,
      size,
      health,
      maxHealth: health,
      type,
      angle: 0,
      shootTimer: 30 + Math.random() * 60,
      pattern: Math.floor(Math.random() * 3),
      bulletPatterns: []
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['laser', 'spread', 'shield', 'homing', 'rapid'];
    const weights = [0.25, 0.2, 0.2, 0.15, 0.2];
    const rand = Math.random();
    let cumulative = 0;
    let type: PowerUpType = 'laser';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      x: x - POWERUP_SIZE / 2,
      y,
      type,
      size: POWERUP_SIZE,
      lifetime: 500
    });
  }

  private createExplosion(x: number, y: number, size: number, color: string): void {
    this.explosions.push({
      x, y,
      frame: 0,
      maxFrames: 25,
      size,
      color
    });
  }

  private createParticles(x: number, y: number, color: string, count: number, speed: number = 3): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 2 + Math.random() * 3,
        color,
        life: 25 + Math.random() * 15,
        maxLife: 40
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
    const interval = this.player.weaponType === 'rapid' ? this.shootInterval * 0.5 : this.shootInterval;
    if (now - this.lastShot < interval) return;
    this.lastShot = now;

    const baseX = this.player.x;
    const baseY = this.player.y - this.player.size / 2;
    const color = this.player.weaponType === 'laser' ? '#00ffff' :
                  this.player.weaponType === 'spread' ? '#ff00ff' :
                  this.player.weaponType === 'homing' ? '#ffff00' : '#ff6b6b';

    switch (this.player.weaponType) {
      case 'laser':
        for (let i = 0; i < this.player.weaponLevel; i++) {
          const offset = (i - (this.player.weaponLevel - 1) / 2) * 12;
          this.playerBullets.push({
            x: baseX + offset,
            y: baseY,
            vx: 0,
            vy: -PLAYER_BULLET_SPEED,
            size: BULLET_SIZE,
            color,
            type: 'laser',
            angle: -Math.PI / 2,
            isPlayer: true
          });
        }
        break;
      case 'spread':
        const spreadCount = 3 + this.player.weaponLevel;
        const spreadAngle = Math.PI / 6;
        for (let i = 0; i < spreadCount; i++) {
          const angle = -Math.PI / 2 - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
          this.playerBullets.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * PLAYER_BULLET_SPEED,
            vy: Math.sin(angle) * PLAYER_BULLET_SPEED,
            size: BULLET_SIZE * 0.8,
            color,
            type: 'spread',
            angle,
            isPlayer: true
          });
        }
        break;
      case 'homing':
        for (let i = 0; i < this.player.weaponLevel; i++) {
          const bullet = {
            x: baseX + (i - 0.5) * 15,
            y: baseY,
            vx: 0,
            vy: -PLAYER_BULLET_SPEED * 0.7,
            size: BULLET_SIZE * 1.2,
            color: '#ffff00',
            type: 'homing' as const,
            angle: -Math.PI / 2,
            isPlayer: true,
            target: null as Enemy | null
          };
          if (this.enemies.length > 0) {
            bullet.target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
          }
          this.playerBullets.push(bullet);
        }
        break;
      default:
        this.playerBullets.push({
          x: baseX,
          y: baseY,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          size: BULLET_SIZE,
          color: '#ff6b6b',
          type: 'normal',
          angle: -Math.PI / 2,
          isPlayer: true
        });
        break;
    }
  }

  private fireEnemyBullet(enemy: Enemy): void {
    const baseX = enemy.x;
    const baseY = enemy.y + enemy.size / 2;
    const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];

    const angle = Math.atan2(this.player.y - baseY, this.player.x - baseX);
    const speed = ENEMY_BULLET_SPEED + this.level * 0.2;

    this.enemyBullets.push({
      x: baseX,
      y: baseY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: BULLET_SIZE * 0.8,
      color,
      type: 'normal',
      angle,
      isPlayer: false
    });
  }

  private fireBossBullets(enemy: Enemy): void {
    const baseX = enemy.x;
    const baseY = enemy.y + enemy.size / 2;
    const count = 5 + this.level;

    switch (enemy.pattern) {
      case 0:
        for (let i = 0; i < count; i++) {
          const angle = Math.PI / 2 + (i - count / 2) * 0.15;
          this.enemyBullets.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
            size: BULLET_SIZE,
            color: '#ff4444',
            type: 'normal',
            angle,
            isPlayer: false
          });
        }
        break;
      case 1:
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + enemy.angle;
          this.enemyBullets.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.7,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 0.7,
            size: BULLET_SIZE * 0.9,
            color: '#ff8800',
            type: 'normal',
            angle,
            isPlayer: false
          });
        }
        break;
      case 2:
        for (let i = 0; i < count * 2; i++) {
          const angle = Math.PI / 2 + Math.sin(i * 0.3) * Math.PI / 3;
          this.enemyBullets.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 1.2,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 1.2,
            size: BULLET_SIZE * 0.7,
            color: '#ffff00',
            type: 'normal',
            angle,
            isPlayer: false
          });
        }
        break;
    }
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    this.frameCount++;
    this.level = Math.floor(this.score / 500) + 1;

    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    }

    const moveSpeed = this.player.speed;
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.player.x -= moveSpeed;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.player.x += moveSpeed;
    }
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.player.y -= moveSpeed;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.player.y += moveSpeed;
    }

    this.player.x = Math.max(this.player.size / 2, Math.min(CANVAS_WIDTH - this.player.size / 2, this.player.x));
    this.player.y = Math.max(this.player.size / 2, Math.min(CANVAS_HEIGHT - this.player.size / 2, this.player.y));

    this.firePlayerBullets();

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];

      if (bullet.type === 'homing' && bullet.target && this.enemies.includes(bullet.target)) {
        const targetAngle = Math.atan2(bullet.target.y - bullet.y, bullet.target.x - bullet.x);
        const currentAngle = bullet.angle;
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        bullet.angle += angleDiff * 0.1;
        bullet.vx = Math.cos(bullet.angle) * PLAYER_BULLET_SPEED;
        bullet.vy = Math.sin(bullet.angle) * PLAYER_BULLET_SPEED;
      }

      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -bullet.size || bullet.x < -bullet.size ||
          bullet.x > CANVAS_WIDTH + bullet.size || bullet.y > CANVAS_HEIGHT + bullet.size) {
        this.playerBullets.splice(i, 1);
      }
    }

    const now = Date.now();
    this.enemySpawnInterval = Math.max(200, 800 - this.level * 50);
    if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.angle += 0.02;

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.type === 'fighter') {
        enemy.shootTimer--;
        if (enemy.shootTimer <= 0) {
          this.fireEnemyBullet(enemy);
          enemy.shootTimer = Math.max(30, 80 - this.level * 3);
        }
      } else {
        enemy.shootTimer--;
        if (enemy.shootTimer <= 0) {
          this.fireBossBullets(enemy);
          enemy.pattern = (enemy.pattern + 1) % 3;
          enemy.shootTimer = Math.max(40, 100 - this.level * 4);
        }
      }

      if (enemy.y > CANVAS_HEIGHT + enemy.size) {
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

          this.createParticles(bullet.x, bullet.y, ENEMY_COLORS[enemy.type], 4, 2);

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'motherShip' ? 500 : enemy.type === 'elite' ? 50 :
                            enemy.type === 'bomber' ? 30 : enemy.type === 'cruiser' ? 25 : 10;
            this.score += baseScore * this.level;

            this.createExplosion(enemy.x, enemy.y, enemy.size, ENEMY_COLORS[enemy.type]);
            this.createParticles(enemy.x, enemy.y, ENEMY_COLORS[enemy.type], 12, 5);

            if (Math.random() < 0.15 + this.level * 0.02) {
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

      if (this.player.invincibleFrames <= 0) {
        if (this.player.hasShield) {
          if (this.checkCollision(
            { x: bullet.x, y: bullet.y, size: bullet.size },
            { x: this.player.x, y: this.player.y, size: this.player.size * 1.5 }
          )) {
            this.enemyBullets.splice(i, 1);
            this.player.shieldHealth--;
            if (this.player.shieldHealth <= 0) {
              this.player.hasShield = false;
            }
            this.createParticles(bullet.x, bullet.y, '#00d2ff', 5, 3);
          }
        } else {
          if (this.checkCollision(
            { x: bullet.x, y: bullet.y, size: bullet.size },
            { x: this.player.x, y: this.player.y, size: this.player.size }
          )) {
            this.enemyBullets.splice(i, 1);
            this.createParticles(bullet.x, bullet.y, '#ff4444', 8, 4);
            this.isGameOver = true;
          }
        }
      }
    }

    for (const enemy of this.enemies) {
      if (this.player.invincibleFrames <= 0 && !this.player.hasShield) {
        if (this.checkCollision(
          { x: enemy.x, y: enemy.y, size: enemy.size },
          { x: this.player.x, y: this.player.y, size: this.player.size }
        )) {
          this.createExplosion(this.player.x, this.player.y, this.player.size, '#00ffff');
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 1.5;
      powerUp.lifetime--;

      if (powerUp.lifetime <= 0 || powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(
        { x: powerUp.x + powerUp.size / 2, y: powerUp.y + powerUp.size / 2, size: powerUp.size },
        { x: this.player.x, y: this.player.y, size: this.player.size }
      )) {
        switch (powerUp.type) {
          case 'laser':
            this.player.weaponType = 'laser';
            this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, 5);
            break;
          case 'spread':
            this.player.weaponType = 'spread';
            this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, 5);
            break;
          case 'shield':
            this.player.hasShield = true;
            this.player.shieldHealth = 3;
            break;
          case 'homing':
            this.player.weaponType = 'homing';
            this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, 3);
            break;
          case 'rapid':
            this.player.weaponType = 'rapid';
            this.shootInterval = Math.max(50, this.shootInterval - 20);
            break;
        }
        this.createParticles(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2, '#00ff88', 10, 4);
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
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
