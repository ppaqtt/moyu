import { WW2AIRWAR_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT, ENEMY_WIDTH, ENEMY_HEIGHT } = WW2AIRWAR_CONSTANTS;

export type EnemyType = 'fighter' | 'bomber' | 'ace';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
  damage: number;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: EnemyType;
  angle: number;
  shootTimer: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fireLevel: number;
  hasShield: boolean;
  missiles: number;
  invincibleTime: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  radius: number;
}

export interface WW2AirwarState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  score: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class WW2AirwarEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private score: number;
  private lives: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastEnemySpawn: number;
  private keys: Set<string>;
  private mouseX: number;
  private mouseY: number;
  private lastShot: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      angle: 0,
      fireLevel: 1,
      hasShield: false,
      missiles: 3,
      invincibleTime: 0
    };
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastEnemySpawn = 0;
    this.keys = new Set();
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT - 100;
    this.lastShot = 0;
  }

  getState(): WW2AirwarState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      lives: this.lives,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      angle: 0,
      fireLevel: 1,
      hasShield: false,
      missiles: 3,
      invincibleTime: 0
    };
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastEnemySpawn = 0;
    this.explosions = [];
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key);
    } else {
      this.keys.delete(key);
    }
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastShot < 150) return;
    this.lastShot = now;

    const baseX = this.player.x;
    const baseY = this.player.y;

    if (this.player.fireLevel === 1) {
      this.playerBullets.push({
        x: baseX, y: baseY - PLAYER_HEIGHT / 2,
        vx: 0, vy: -12, isEnemy: false, damage: 1
      });
    } else if (this.player.fireLevel === 2) {
      this.playerBullets.push({
        x: baseX - 10, y: baseY - PLAYER_HEIGHT / 2,
        vx: -1, vy: -12, isEnemy: false, damage: 1
      });
      this.playerBullets.push({
        x: baseX + 10, y: baseY - PLAYER_HEIGHT / 2,
        vx: 1, vy: -12, isEnemy: false, damage: 1
      });
    } else {
      this.playerBullets.push({
        x: baseX, y: baseY - PLAYER_HEIGHT / 2,
        vx: 0, vy: -14, isEnemy: false, damage: 1
      });
      this.playerBullets.push({
        x: baseX - 12, y: baseY,
        vx: -2, vy: -12, isEnemy: false, damage: 1
      });
      this.playerBullets.push({
        x: baseX + 12, y: baseY,
        vx: 2, vy: -12, isEnemy: false, damage: 1
      });
    }
  }

  useMissile(): void {
    if (!this.isPlaying || this.isGameOver || this.player.missiles <= 0) return;

    this.player.missiles--;

    let nearestEnemy: Enemy | null = null;
    let nearestDist = Infinity;

    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy) {
      nearestEnemy.health -= 5;
      this.createExplosion(nearestEnemy.x, nearestEnemy.y, 60);
      this.score += 50;
    }
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({ x, y, frame: 0, maxFrames: 30, radius: size });
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['fighter', 'bomber', 'ace'];
    const weights = [0.6, 0.25, 0.15];

    let rand = Math.random();
    let typeIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) {
        typeIndex = i;
        break;
      }
      rand -= weights[i];
    }

    const type = types[typeIndex];
    const width = type === 'bomber' ? ENEMY_WIDTH + 15 : type === 'ace' ? ENEMY_WIDTH - 5 : ENEMY_WIDTH;
    const height = type === 'bomber' ? ENEMY_HEIGHT + 10 : ENEMY_HEIGHT;

    const x = Math.random() * (CANVAS_WIDTH - width);
    const y = -height;
    const vx = (Math.random() - 0.5) * 2;
    const vy = 2 + this.wave * 0.2;

    this.enemies.push({
      x, y, vx, vy, width, height,
      health: type === 'bomber' ? 3 : type === 'ace' ? 2 : 1,
      maxHealth: type === 'bomber' ? 3 : type === 'ace' ? 2 : 1,
      type, angle: 0, shootTimer: 0
    });
  }

  private checkCollision(a: { x: number; y: number }, b: { x: number; y: number }, radiusA: number, radiusB: number): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < radiusA + radiusB;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const speed = 5;

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      this.player.vx -= 0.5;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      this.player.vx += 0.5;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) {
      this.player.vy -= 0.5;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) {
      this.player.vy += 0.5;
    }

    const targetAngleX = this.mouseX - this.player.x;
    const targetAngleY = this.mouseY - this.player.y;
    this.player.angle = Math.atan2(targetAngleY, targetAngleX);

    this.player.vx *= 0.95;
    this.player.vy *= 0.95;

    this.player.vx = Math.max(-speed, Math.min(speed, this.player.vx));
    this.player.vy = Math.max(-speed, Math.min(speed, this.player.vy));

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    this.player.x = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, this.player.x));
    this.player.y = Math.max(PLAYER_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PLAYER_HEIGHT / 2, this.player.y));

    if (this.player.invincibleTime > 0) {
      this.player.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -20 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20) {
        this.playerBullets.splice(i, 1);
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y > CANVAS_HEIGHT + 20 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20) {
        this.enemyBullets.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - this.lastEnemySpawn > Math.max(800, 2000 - this.wave * 100)) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.x < 0 || enemy.x > CANVAS_WIDTH - enemy.width) {
        enemy.vx *= -1;
      }
      if (enemy.y > CANVAS_HEIGHT + 50) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.shootTimer++;
      if (enemy.shootTimer > 60 && Math.random() < 0.03) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.enemyBullets.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height,
          vx: (dx / dist) * 5,
          vy: (dy / dist) * 5,
          isEnemy: true,
          damage: 1
        });
        enemy.shootTimer = 0;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(
          { x: bullet.x, y: bullet.y },
          { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 },
          5, enemy.width / 2
        )) {
          this.playerBullets.splice(j, 1);
          enemy.health -= bullet.damage;

          if (enemy.health <= 0) {
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 40);
            this.score += enemy.type === 'bomber' ? 30 : enemy.type === 'ace' ? 20 : 10;

            if (Math.random() < 0.1) {
              this.player.fireLevel = Math.min(this.player.fireLevel + 1, 3);
            }
            if (Math.random() < 0.05) {
              this.player.missiles++;
            }
            if (Math.random() < 0.08) {
              this.player.hasShield = true;
            }

            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (const bullet of this.enemyBullets) {
      if (this.player.invincibleTime <= 0 && this.checkCollision(
        { x: bullet.x, y: bullet.y },
        { x: this.player.x, y: this.player.y },
        5, PLAYER_WIDTH / 2
      )) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.createExplosion(this.player.x, this.player.y, 30);
        } else {
          this.lives--;
          this.player.invincibleTime = 120;
          this.createExplosion(this.player.x, this.player.y, 50);
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        break;
      }
    }

    for (const enemy of this.enemies) {
      if (this.player.invincibleTime <= 0 && this.checkCollision(
        { x: this.player.x, y: this.player.y },
        { x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 },
        PLAYER_WIDTH / 2, enemy.width / 2
      )) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.enemies = this.enemies.filter(e => e !== enemy);
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 40);
        } else {
          this.lives--;
          this.player.invincibleTime = 120;
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 50);
          this.enemies = this.enemies.filter(e => e !== enemy);
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

    if (this.score > this.wave * 500) {
      this.wave++;
    }
  }
}
