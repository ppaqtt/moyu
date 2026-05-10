import { FLAK_TOWER_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_X, TOWER_Y, TOWER_RADIUS } = FLAK_TOWER_CONSTANTS;

export type EnemyType = 'bomber' | 'fighter' | 'missile';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'flak' | ' tracer';
  life: number;
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
  targetX: number;
  targetY: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  radius: number;
}

export interface FlakTowerState {
  tower: { x: number; y: number; angle: number; };
  bullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  score: number;
  ammo: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class FlakTowerEngine {
  private tower: { x: number; y: number; angle: number; };
  private bullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private score: number;
  private ammo: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastEnemySpawn: number;
  private lastShot: number;
  private mouseX: number;
  private mouseY: number;
  private keys: Set<string>;

  constructor() {
    this.tower = { x: TOWER_X, y: TOWER_Y, angle: 0 };
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.score = 0;
    this.ammo = 100;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastEnemySpawn = 0;
    this.lastShot = 0;
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT / 2;
    this.keys = new Set();
  }

  getState(): FlakTowerState {
    return {
      tower: { ...this.tower },
      bullets: this.bullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      ammo: this.ammo,
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
    this.tower = { x: TOWER_X, y: TOWER_Y, angle: 0 };
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.score = 0;
    this.ammo = 100;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastEnemySpawn = 0;
    this.lastShot = 0;
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
    if (!this.isPlaying || this.isGameOver || this.ammo < 1) return;

    const now = Date.now();
    if (now - this.lastShot < 80) return;
    this.lastShot = now;

    this.ammo = Math.max(0, this.ammo - 1);

    const spread = (Math.random() - 0.5) * 0.1;
    const speed = 18;

    this.bullets.push({
      x: this.tower.x + Math.cos(this.tower.angle) * 50,
      y: this.tower.y + Math.sin(this.tower.angle) * 50,
      vx: Math.cos(this.tower.angle + spread) * speed,
      vy: Math.sin(this.tower.angle + spread) * speed,
      type: Math.random() < 0.3 ? 'tracer' : 'flak',
      life: 60
    });
  }

  reload(): void {
    if (!this.isPlaying || this.isGameOver) return;
    this.ammo = Math.min(200, this.ammo + 5);
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({ x, y, frame: 0, maxFrames: 25, radius: size });
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['bomber', 'fighter', 'missile'];
    const weights = [0.35, 0.45, 0.2];

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
    const width = type === 'bomber' ? 50 : type === 'fighter' ? 30 : 20;
    const height = type === 'bomber' ? 30 : type === 'fighter' ? 20 : 10;

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number, vx: number, vy: number;

    switch (side) {
      case 0:
        x = Math.random() * CANVAS_WIDTH;
        y = -50;
        vx = (Math.random() - 0.5) * 2;
        vy = 2 + this.wave * 0.3;
        break;
      case 1:
        x = CANVAS_WIDTH + 50;
        y = Math.random() * CANVAS_HEIGHT;
        vx = -(2 + this.wave * 0.3);
        vy = (Math.random() - 0.5) * 2;
        break;
      case 2:
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT + 50;
        vx = (Math.random() - 0.5) * 2;
        vy = -(2 + this.wave * 0.3);
        break;
      default:
        x = -50;
        y = Math.random() * CANVAS_HEIGHT;
        vx = 2 + this.wave * 0.3;
        vy = (Math.random() - 0.5) * 2;
    }

    const targetX = this.tower.x + (Math.random() - 0.5) * 100;
    const targetY = this.tower.y + (Math.random() - 0.5) * 100;

    this.enemies.push({
      x, y, vx, vy, width, height,
      health: type === 'bomber' ? 5 : type === 'fighter' ? 2 : 1,
      maxHealth: type === 'bomber' ? 5 : type === 'fighter' ? 2 : 1,
      type, angle: Math.atan2(vy, vx),
      targetX, targetY
    });
  }

  private checkCollision(a: { x: number; y: number }, b: { x: number; y: number; width?: number; height?: number }, radiusA: number): boolean {
    const dx = a.x - (b.x + (b.width || 0) / 2);
    const dy = a.y - (b.y + (b.height || 0) / 2);
    return Math.sqrt(dx * dx + dy * dy) < radiusA + (b.width || 0) / 2;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const dx = this.mouseX - this.tower.x;
    const dy = this.mouseY - this.tower.y;
    let targetAngle = Math.atan2(dy, dx);

    let angleDiff = targetAngle - this.tower.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.tower.angle += angleDiff * 0.15;

    if (this.keys.has('r') || this.keys.has('R')) {
      this.reload();
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
    if (now - this.lastEnemySpawn > Math.max(800, 2500 - this.wave * 150)) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      let dx = enemy.targetX - enemy.x;
      let dy = enemy.targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20 || Math.random() < 0.005) {
        enemy.targetX = this.tower.x + (Math.random() - 0.5) * 200;
        enemy.targetY = this.tower.y + (Math.random() - 0.5) * 200;
      }

      dx = enemy.targetX - enemy.x;
      dy = enemy.targetY - enemy.y;
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - enemy.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      enemy.angle += angleDiff * 0.05;

      const speed = enemy.type === 'missile' ? 5 : enemy.type === 'fighter' ? 3 : 2;
      enemy.vx = Math.cos(enemy.angle) * speed;
      enemy.vy = Math.sin(enemy.angle) * speed;

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];

        if (this.checkCollision(
          { x: bullet.x, y: bullet.y },
          { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height },
          bullet.type === 'tracer' ? 8 : 5
        )) {
          enemy.health--;

          if (bullet.type === 'flak') {
            this.bullets.splice(j, 1);
          }

          this.createExplosion(bullet.x, bullet.y, 20);

          if (enemy.health <= 0) {
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 40);
            this.score += enemy.type === 'bomber' ? 30 : enemy.type === 'fighter' ? 15 : 10;
            this.enemies.splice(i, 1);
          }
          break;
        }
      }

      const distToTower = Math.sqrt((enemy.x - this.tower.x) ** 2 + (enemy.y - this.tower.y) ** 2);
      if (distToTower < TOWER_RADIUS) {
        this.isGameOver = true;
        this.createExplosion(this.tower.x, this.tower.y, 80);
      }

      if (enemy.x < -100 || enemy.x > CANVAS_WIDTH + 100 || enemy.y < -100 || enemy.y > CANVAS_HEIGHT + 100) {
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.score > this.wave * 200) {
      this.wave++;
      this.ammo = Math.min(200, this.ammo + 30);
    }
  }
}
