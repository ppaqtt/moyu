import { DOGFIGHT_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLANE_SIZE } = DOGFIGHT_CONSTANTS;

export type EnemyPlaneType = 'basic' | 'ace' | 'elite';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
  life: number;
}

export interface EnemyPlane {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  type: EnemyPlaneType;
  shootTimer: number;
  boostTimer: number;
  boosting: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  radius: number;
}

export interface SmokeTrail {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export interface DogfightState {
  player: { x: number; y: number; vx: number; vy: number; angle: number; health: number; boost: number; };
  bullets: Bullet[];
  enemies: EnemyPlane[];
  explosions: Explosion[];
  smokeTrails: SmokeTrail[];
  score: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class DogfightEngine {
  private player: { x: number; y: number; vx: number; vy: number; angle: number; health: number; boost: number; invincibleTime: number; };
  private bullets: Bullet[];
  private enemies: EnemyPlane[];
  private explosions: Explosion[];
  private smokeTrails: SmokeTrail[];
  private score: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastEnemySpawn: number;
  private keys: Set<string>;
  private lastShot: number;
  private turnSpeed: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      health: 100,
      boost: 100,
      invincibleTime: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.smokeTrails = [];
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastEnemySpawn = 0;
    this.keys = new Set();
    this.lastShot = 0;
    this.turnSpeed = 0.05;
  }

  getState(): DogfightState {
    return {
      player: { x: this.player.x, y: this.player.y, vx: this.player.vx, vy: this.player.vy, angle: this.player.angle, health: this.player.health, boost: this.player.boost },
      bullets: this.bullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      smokeTrails: this.smokeTrails.map(s => ({ ...s })),
      score: this.score,
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
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      health: 100,
      boost: 100,
      invincibleTime: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.smokeTrails = [];
    this.score = 0;
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

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    if (now - this.lastShot < 150) return;
    this.lastShot = now;

    const speed = 12;
    this.bullets.push({
      x: this.player.x + Math.cos(this.player.angle) * PLANE_SIZE,
      y: this.player.y + Math.sin(this.player.angle) * PLANE_SIZE,
      vx: Math.cos(this.player.angle) * speed + this.player.vx * 0.3,
      vy: Math.sin(this.player.angle) * speed + this.player.vy * 0.3,
      isEnemy: false,
      life: 60
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({ x, y, frame: 0, maxFrames: 30, radius: size });
  }

  private spawnEnemy(): void {
    const types: EnemyPlaneType[] = ['basic', 'ace', 'elite'];
    const weights = [0.5, 0.35, 0.15];

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
    const side = Math.random() < 0.5 ? 0 : 1;
    const x = side === 0 ? -20 : CANVAS_WIDTH + 20;
    const y = Math.random() * (CANVAS_HEIGHT - 100) + 50;

    let targetX = this.player.x;
    let targetY = this.player.y;
    let angle = Math.atan2(targetY - y, targetX - x);

    this.enemies.push({
      x, y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      angle,
      health: type === 'elite' ? 3 : type === 'ace' ? 2 : 1,
      maxHealth: type === 'elite' ? 3 : type === 'ace' ? 2 : 1,
      type,
      shootTimer: Math.random() * 30,
      boostTimer: 0,
      boosting: false
    });
  }

  private checkCollision(a: { x: number; y: number }, b: { x: number; y: number }, radiusA: number, radiusB: number): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < radiusA + radiusB;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      this.player.angle -= this.turnSpeed;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      this.player.angle += this.turnSpeed;
    }

    const accelerating = this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W');
    const braking = this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S');
    const boosting = this.keys.has('Shift') && this.player.boost > 0;

    if (boosting && accelerating) {
      this.player.boost = Math.max(0, this.player.boost - 1);
      this.player.vx += Math.cos(this.player.angle) * 0.5;
      this.player.vy += Math.sin(this.player.angle) * 0.5;
    } else if (accelerating) {
      this.player.vx += Math.cos(this.player.angle) * 0.2;
      this.player.vy += Math.sin(this.player.angle) * 0.2;
    } else if (braking) {
      this.player.vx *= 0.95;
      this.player.vy *= 0.95;
    }

    if (boosting) {
      this.player.boost = Math.max(0, this.player.boost - 0.5);
    } else {
      this.player.boost = Math.min(100, this.player.boost + 0.1);
    }

    const maxSpeed = boosting ? 12 : 8;
    const speed = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
    if (speed > maxSpeed) {
      this.player.vx = (this.player.vx / speed) * maxSpeed;
      this.player.vy = (this.player.vy / speed) * maxSpeed;
    }

    this.player.vx *= 0.99;
    this.player.vy *= 0.99;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    if (this.player.x < 0) { this.player.x = 0; this.player.vx *= -0.5; }
    if (this.player.x > CANVAS_WIDTH) { this.player.x = CANVAS_WIDTH; this.player.vx *= -0.5; }
    if (this.player.y < 0) { this.player.y = 0; this.player.vy *= -0.5; }
    if (this.player.y > CANVAS_HEIGHT) { this.player.y = CANVAS_HEIGHT; this.player.vy *= -0.5; }

    if (boosting && (accelerating || this.keys.has('ArrowUp') || this.keys.has('w'))) {
      this.smokeTrails.push({
        x: this.player.x - Math.cos(this.player.angle) * PLANE_SIZE * 0.8,
        y: this.player.y - Math.sin(this.player.angle) * PLANE_SIZE * 0.8,
        age: 0,
        maxAge: 20
      });
    }

    if (this.player.invincibleTime > 0) {
      this.player.invincibleTime--;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;

      if (bullet.life <= 0 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20 || bullet.y < -20 || bullet.y > CANVAS_HEIGHT + 20) {
        this.bullets.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - this.lastEnemySpawn > Math.max(500, 2000 - this.wave * 150)) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      let targetX = this.player.x;
      let targetY = this.player.y;
      let targetAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);

      let angleDiff = targetAngle - enemy.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      enemy.angle += angleDiff * 0.03;

      const dist = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);

      if (enemy.type === 'elite' && enemy.boostTimer <= 0 && dist < 200) {
        enemy.boosting = true;
        enemy.boostTimer = 60;
      }
      if (enemy.boostTimer > 0) enemy.boostTimer--;
      if (!enemy.boosting) {
        enemy.vx = Math.cos(enemy.angle) * 4;
        enemy.vy = Math.sin(enemy.angle) * 4;
      } else {
        enemy.vx = Math.cos(enemy.angle) * 8;
        enemy.vy = Math.sin(enemy.angle) * 8;
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.x < -50 || enemy.x > CANVAS_WIDTH + 50 || enemy.y < -50 || enemy.y > CANVAS_HEIGHT + 50) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.shootTimer++;
      const shootInterval = enemy.type === 'elite' ? 20 : enemy.type === 'ace' ? 35 : 50;
      if (enemy.shootTimer > shootInterval && Math.random() < 0.03) {
        const bulletSpeed = enemy.type === 'elite' ? 10 : 7;
        this.bullets.push({
          x: enemy.x + Math.cos(enemy.angle) * PLANE_SIZE * 0.8,
          y: enemy.y + Math.sin(enemy.angle) * PLANE_SIZE * 0.8,
          vx: Math.cos(enemy.angle) * bulletSpeed,
          vy: Math.sin(enemy.angle) * bulletSpeed,
          isEnemy: true,
          life: 40
        });
        enemy.shootTimer = 0;
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (bullet.isEnemy) continue;

        if (this.checkCollision({ x: bullet.x, y: bullet.y }, { x: enemy.x, y: enemy.y }, 5, PLANE_SIZE)) {
          this.bullets.splice(j, 1);
          enemy.health--;
          this.createExplosion(bullet.x, bullet.y, 15);

          if (enemy.health <= 0) {
            this.createExplosion(enemy.x, enemy.y, 40);
            this.score += enemy.type === 'elite' ? 50 : enemy.type === 'ace' ? 30 : 10;
            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (const bullet of this.bullets) {
      if (!bullet.isEnemy) continue;

      if (this.player.invincibleTime <= 0 && this.checkCollision({ x: bullet.x, y: bullet.y }, { x: this.player.x, y: this.player.y }, 5, PLANE_SIZE * 0.7)) {
        this.player.health -= 10;
        this.player.invincibleTime = 30;
        this.createExplosion(bullet.x, bullet.y, 25);
        bullet.life = 0;

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (const enemy of this.enemies) {
      if (this.player.invincibleTime <= 0 && this.checkCollision({ x: this.player.x, y: this.player.y }, { x: enemy.x, y: enemy.y }, PLANE_SIZE * 0.7, PLANE_SIZE)) {
        this.player.health -= 25;
        this.player.invincibleTime = 60;
        this.createExplosion((this.player.x + enemy.x) / 2, (this.player.y + enemy.y) / 2, 50);
        this.enemies = this.enemies.filter(e => e !== enemy);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    for (let i = this.smokeTrails.length - 1; i >= 0; i--) {
      this.smokeTrails[i].age++;
      if (this.smokeTrails[i].age > this.smokeTrails[i].maxAge) {
        this.smokeTrails.splice(i, 1);
      }
    }

    if (this.score > this.wave * 200) {
      this.wave++;
    }
  }
}
