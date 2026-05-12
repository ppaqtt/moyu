import { RAIDEN_ENHANCED_CONSTANTS } from '../../utils/raidenEnhancedConstants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  PLAYER_SPEED,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  BOSS_WIDTH,
  BOSS_HEIGHT,
} = RAIDEN_ENHANCED_CONSTANTS;

export type PowerUpType = 'power' | 'speed' | 'shield' | 'bomb' | 'missile';

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: 'normal' | 'spread' | 'laser' | 'missile';
  color: string;
  isPlayer: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'scout' | 'fighter' | 'bomber' | 'elite' | 'boss';
  angle: number;
  shootTimer: number;
  pattern: number;
  moveTimer: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  width: number;
  height: number;
  lifetime: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
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
  width: number;
  height: number;
  speed: number;
  powerLevel: number;
  hasShield: boolean;
  bombs: number;
  invincibleTime: number;
  invincibleFrames: number;
}

export interface RaidenEnhancedState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  particles: Particle[];
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  bossActive: boolean;
  stageProgress: number;
}

export class RaidenEnhancedEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private explosions: Explosion[];
  private particles: Particle[];
  private score: number;
  private level: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private bossActive: boolean;
  private stageProgress: number;
  private keys: Set<string>;
  private lastShot: number;
  private shootInterval: number;
  private lastEnemySpawn: number;
  private enemySpawnInterval: number;
  private lastBossSpawn: number;
  private frameCount: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.bossActive = false;
    this.stageProgress = 0;
    this.keys = new Set();
    this.lastShot = 0;
    this.shootInterval = 100;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 1000;
    this.lastBossSpawn = 0;
    this.frameCount = 0;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED,
      powerLevel: 1,
      hasShield: false,
      bombs: 3,
      invincibleTime: 0,
      invincibleFrames: 0
    };
  }

  getState(): RaidenEnhancedState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      explosions: this.explosions.map(e => ({ ...e })),
      particles: this.particles.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      bossActive: this.bossActive,
      stageProgress: this.stageProgress
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
    this.stageProgress = 0;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.bossActive = false;
    this.stageProgress = 0;
    this.lastShot = 0;
    this.shootInterval = 100;
    this.enemySpawnInterval = 1000;
    this.lastBossSpawn = 0;
    this.frameCount = 0;
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  useBomb(): void {
    if (this.player.bombs <= 0 || !this.isPlaying) return;

    this.player.bombs--;
    this.enemyBullets = [];
    this.createBigExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 300);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.type !== 'boss') {
        this.score += enemy.type === 'elite' ? 50 : enemy.type === 'bomber' ? 30 : 10;
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
        this.enemies.splice(i, 1);
      } else {
        enemy.health -= 5;
      }
    }
  }

  private spawnEnemy(): void {
    const types: ('scout' | 'fighter' | 'bomber' | 'elite')[] = ['scout', 'fighter', 'bomber', 'elite'];
    const weights = [0.4, 0.3, 0.2, 0.1];
    const rand = Math.random();
    let cumulative = 0;
    let type: 'scout' | 'fighter' | 'bomber' | 'elite' = 'scout';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    let width = ENEMY_WIDTH;
    let height = ENEMY_HEIGHT;
    let health = 1;
    const speed = 2 + this.level * 0.3;

    switch (type) {
      case 'scout':
        width = ENEMY_WIDTH * 0.8;
        height = ENEMY_HEIGHT * 0.8;
        break;
      case 'fighter':
        width = ENEMY_WIDTH;
        height = ENEMY_HEIGHT;
        health = 2;
        break;
      case 'bomber':
        width = ENEMY_WIDTH * 1.3;
        height = ENEMY_HEIGHT * 1.3;
        health = 3;
        break;
      case 'elite':
        width = ENEMY_WIDTH * 1.2;
        height = ENEMY_HEIGHT * 1.2;
        health = 5;
        break;
    }

    const x = Math.random() * (CANVAS_WIDTH - width);
    const y = -height;

    this.enemies.push({
      x, y, width, height,
      health,
      maxHealth: health,
      type,
      angle: 0,
      shootTimer: 30 + Math.random() * 60,
      pattern: Math.floor(Math.random() * 3),
      moveTimer: 0
    });
  }

  private spawnBoss(): void {
    const boss: Enemy = {
      x: CANVAS_WIDTH / 2 - BOSS_WIDTH / 2,
      y: -BOSS_HEIGHT,
      width: BOSS_WIDTH,
      height: BOSS_HEIGHT,
      health: 50 + this.level * 10,
      maxHealth: 50 + this.level * 10,
      type: 'boss',
      angle: 0,
      shootTimer: 0,
      pattern: 0,
      moveTimer: 0
    };

    this.enemies.push(boss);
    this.bossActive = true;
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['power', 'speed', 'shield', 'bomb', 'missile'];
    const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
    const rand = Math.random();
    let cumulative = 0;
    let type: PowerUpType = 'power';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      x: x - 12,
      y: y - 12,
      type,
      width: 24,
      height: 24,
      lifetime: 600
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x, y,
      frame: 0,
      maxFrames: 20 + size / 5,
      size
    });
  }

  private createBigExplosion(x: number, y: number, size: number): void {
    for (let i = 0; i < 3; i++) {
      this.explosions.push({
        x: x + (Math.random() - 0.5) * size,
        y: y + (Math.random() - 0.5) * size,
        frame: 0,
        maxFrames: 30,
        size: size * (0.5 + Math.random() * 0.5)
      });
    }
  }

  private createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 2 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 2 + Math.random() * 3,
        color,
        life: 20 + Math.random() * 20,
        maxLife: 40
      });
    }
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

  private firePlayerBullets(): void {
    const now = Date.now();
    if (now - this.lastShot < this.shootInterval) return;
    this.lastShot = now;

    const powerLevel = this.player.powerLevel;
    const baseX = this.player.x + this.player.width / 2;

    switch (powerLevel) {
      case 1:
        this.playerBullets.push({
          x: baseX - BULLET_WIDTH / 2,
          y: this.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          type: 'normal',
          color: '#ffff00',
          isPlayer: true
        });
        break;
      case 2:
        this.playerBullets.push({
          x: baseX - 8,
          y: this.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          type: 'normal',
          color: '#ffff00',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX + 4,
          y: this.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          type: 'normal',
          color: '#ffff00',
          isPlayer: true
        });
        break;
      case 3:
        this.playerBullets.push({
          x: baseX - BULLET_WIDTH / 2,
          y: this.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          type: 'normal',
          color: '#ff00ff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX - 12,
          y: this.player.y + 5,
          width: BULLET_WIDTH * 0.8,
          height: BULLET_HEIGHT * 0.8,
          vx: -1,
          vy: -PLAYER_BULLET_SPEED,
          type: 'spread',
          color: '#ff00ff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX + 8,
          y: this.player.y + 5,
          width: BULLET_WIDTH * 0.8,
          height: BULLET_HEIGHT * 0.8,
          vx: 1,
          vy: -PLAYER_BULLET_SPEED,
          type: 'spread',
          color: '#ff00ff',
          isPlayer: true
        });
        break;
      default:
        this.playerBullets.push({
          x: baseX - BULLET_WIDTH / 2,
          y: this.player.y,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          vx: 0,
          vy: -PLAYER_BULLET_SPEED,
          type: 'normal',
          color: '#00ffff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX - 15,
          y: this.player.y + 5,
          width: BULLET_WIDTH * 0.8,
          height: BULLET_HEIGHT * 0.8,
          vx: -1.5,
          vy: -PLAYER_BULLET_SPEED,
          type: 'spread',
          color: '#00ffff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX + 11,
          y: this.player.y + 5,
          width: BULLET_WIDTH * 0.8,
          height: BULLET_HEIGHT * 0.8,
          vx: 1.5,
          vy: -PLAYER_BULLET_SPEED,
          type: 'spread',
          color: '#00ffff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX - 25,
          y: this.player.y + 10,
          width: BULLET_WIDTH * 0.6,
          height: BULLET_HEIGHT * 0.6,
          vx: -2,
          vy: -PLAYER_BULLET_SPEED * 0.8,
          type: 'spread',
          color: '#00ffff',
          isPlayer: true
        });
        this.playerBullets.push({
          x: baseX + 21,
          y: this.player.y + 10,
          width: BULLET_WIDTH * 0.6,
          height: BULLET_HEIGHT * 0.6,
          vx: 2,
          vy: -PLAYER_BULLET_SPEED * 0.8,
          type: 'spread',
          color: '#00ffff',
          isPlayer: true
        });
        break;
    }
  }

  private fireEnemyBullet(enemy: Enemy): void {
    const baseX = enemy.x + enemy.width / 2;
    const baseY = enemy.y + enemy.height;

    const angle = Math.atan2(this.player.y + this.player.height / 2 - baseY,
                              this.player.x + this.player.width / 2 - baseX);

    this.enemyBullets.push({
      x: baseX - 3,
      y: baseY,
      width: 6,
      height: 10,
      vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
      vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
      type: 'normal',
      color: '#ff4444',
      isPlayer: false
    });
  }

  private fireBossBullets(enemy: Enemy): void {
    const baseX = enemy.x + enemy.width / 2;
    const baseY = enemy.y + enemy.height;

    switch (enemy.pattern) {
      case 0:
        for (let i = -2; i <= 2; i++) {
          const angle = Math.PI / 2 + i * 0.2;
          this.enemyBullets.push({
            x: baseX,
            y: baseY,
            width: 8,
            height: 8,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
            type: 'normal',
            color: '#ff4444',
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
            width: 8,
            height: 8,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.8,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 0.8,
            type: 'normal',
            color: '#ff8800',
            isPlayer: false
          });
        }
        break;
      case 2:
        const spreadCount = 12;
        for (let i = 0; i < spreadCount; i++) {
          const angle = Math.PI / 2 + (i - spreadCount / 2) * 0.1;
          this.enemyBullets.push({
            x: baseX,
            y: baseY,
            width: 6,
            height: 6,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 1.2,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 1.2,
            type: 'normal',
            color: '#ffff00',
            isPlayer: false
          });
        }
        break;
    }
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    this.frameCount++;
    this.stageProgress += 1 / 60;
    this.level = Math.floor(this.stageProgress / 30) + 1;

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
    this.player.y = Math.max(0, Math.min(CANVAS_HEIGHT - this.player.height - 10, this.player.y));

    this.firePlayerBullets();

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -bullet.height || bullet.x < -bullet.width ||
          bullet.x > CANVAS_WIDTH + bullet.width || bullet.y > CANVAS_HEIGHT + bullet.height) {
        this.playerBullets.splice(i, 1);
      }
    }

    const now = Date.now();
    this.enemySpawnInterval = Math.max(300, 1000 - this.level * 70);

    if (!this.bossActive) {
      if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }

      const bossInterval = Math.max(20000, 45000 - this.level * 2000);
      if (this.stageProgress > 20 && now - this.lastBossSpawn > bossInterval) {
        this.spawnBoss();
        this.lastBossSpawn = now;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.angle += 0.02;
      enemy.moveTimer++;

      if (enemy.type === 'boss') {
        if (enemy.y < 50) {
          enemy.y += 1;
        } else {
          enemy.x += Math.sin(this.frameCount * 0.02) * 2;
          enemy.x = Math.max(0, Math.min(CANVAS_WIDTH - enemy.width, enemy.x));
        }

        enemy.shootTimer++;
        if (enemy.shootTimer >= Math.max(20, 60 - this.level * 3)) {
          this.fireBossBullets(enemy);
          enemy.pattern = (enemy.pattern + 1) % 3;
          enemy.shootTimer = 0;
        }
      } else {
        switch (enemy.pattern) {
          case 0:
            enemy.y += 2 + this.level * 0.2;
            break;
          case 1:
            enemy.x += Math.sin(enemy.moveTimer * 0.05) * 2;
            enemy.y += 1.5 + this.level * 0.15;
            break;
          case 2:
            enemy.x += Math.cos(enemy.moveTimer * 0.03) * 1.5;
            enemy.y += 1.5 + this.level * 0.15;
            break;
        }

        enemy.shootTimer++;
        if (enemy.shootTimer >= Math.max(40, 120 - this.level * 5)) {
          this.fireEnemyBullet(enemy);
          enemy.shootTimer = 0;
        }
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

          this.createParticles(bullet.x, bullet.y, '#ffff00', 3);

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'boss' ? 500 : enemy.type === 'elite' ? 50 :
                            enemy.type === 'bomber' ? 30 : enemy.type === 'fighter' ? 20 : 10;
            this.score += baseScore * this.level;

            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
            this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff4444', 10);

            if (enemy.type === 'boss') {
              this.bossActive = false;
              this.lastBossSpawn = now;
              for (let k = 0; k < 5; k++) {
                this.spawnPowerUp(
                  enemy.x + Math.random() * enemy.width,
                  enemy.y + enemy.height / 2
                );
              }
            } else if (Math.random() < 0.12) {
              this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
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

      if (bullet.y < -bullet.height || bullet.x < -bullet.width ||
          bullet.x > CANVAS_WIDTH + bullet.width || bullet.y > CANVAS_HEIGHT + bullet.height) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.player.invincibleFrames <= 0 && !this.player.hasShield) {
        if (this.checkCollision(bullet, this.player)) {
          this.enemyBullets.splice(i, 1);
          this.createParticles(bullet.x, bullet.y, bullet.color, 5);
          this.playerHit();
        }
      }
    }

    if (this.player.invincibleFrames <= 0 && !this.player.hasShield) {
      for (const enemy of this.enemies) {
        if (enemy.type !== 'boss' && this.checkCollision(this.player, enemy)) {
          this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 40);
          this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#00ffff', 10);
          this.enemies = this.enemies.filter(e => e !== enemy);
          this.playerHit();
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2;
      powerUp.lifetime--;

      if (powerUp.lifetime <= 0 || powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp)) {
        switch (powerUp.type) {
          case 'power':
            this.player.powerLevel = Math.min(this.player.powerLevel + 1, 5);
            this.shootInterval = Math.max(50, this.shootInterval - 12);
            break;
          case 'speed':
            this.player.speed += 1;
            break;
          case 'shield':
            this.player.hasShield = true;
            break;
          case 'bomb':
            this.player.bombs = Math.min(this.player.bombs + 1, 5);
            break;
          case 'missile':
            break;
        }
        this.createParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, '#00ff88', 8);
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

  private playerHit(): void {
    this.lives--;
    this.player.invincibleFrames = 120;
    this.player.hasShield = false;

    if (this.lives <= 0) {
      this.isGameOver = true;
    }
  }
}
