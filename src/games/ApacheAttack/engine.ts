import { APACHE_ATTACK_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, HELI_WIDTH, HELI_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT, TARGET_WIDTH, TARGET_HEIGHT } = APACHE_ATTACK_CONSTANTS;

export type TargetType = 'infantry' | 'tank' | 'building';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isRocket: boolean;
  damage: number;
}

export interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: TargetType;
  shootTimer: number;
  shootInterval: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  radius: number;
}

export interface ApacheAttackState {
  heli: { x: number; y: number; angle: number };
  bullets: Bullet[];
  targets: Target[];
  explosions: Explosion[];
  score: number;
  fuel: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class ApacheAttackEngine {
  private heli: { x: number; y: number; angle: number };
  private bullets: Bullet[];
  private targets: Target[];
  private explosions: Explosion[];
  private score: number;
  private fuel: number;
  private lives: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastTargetSpawn: number;
  private keys: Set<string>;
  private mouseX: number;
  private mouseY: number;
  private lastShot: number;

  constructor() {
    this.heli = {
      x: CANVAS_WIDTH / 2,
      y: 80,
      angle: 0
    };
    this.bullets = [];
    this.targets = [];
    this.explosions = [];
    this.score = 0;
    this.fuel = 100;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastTargetSpawn = 0;
    this.keys = new Set();
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT / 2;
    this.lastShot = 0;
  }

  getState(): ApacheAttackState {
    return {
      heli: { ...this.heli },
      bullets: this.bullets.map(b => ({ ...b })),
      targets: this.targets.map(t => ({ ...t })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      fuel: this.fuel,
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
    this.heli = { x: CANVAS_WIDTH / 2, y: 80, angle: 0 };
    this.bullets = [];
    this.targets = [];
    this.explosions = [];
    this.score = 0;
    this.fuel = 100;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastTargetSpawn = 0;
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
    if (!this.isPlaying || this.isGameOver || this.fuel < 2) return;

    const now = Date.now();
    if (now - this.lastShot < 100) return;
    this.lastShot = now;

    this.fuel = Math.max(0, this.fuel - 2);

    const dx = this.mouseX - this.heli.x;
    const dy = this.mouseY - this.heli.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 15;

    this.bullets.push({
      x: this.heli.x,
      y: this.heli.y + HELI_HEIGHT / 2,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      isRocket: false,
      damage: 1
    });
  }

  shootRocket(): void {
    if (!this.isPlaying || this.isGameOver || this.fuel < 20) return;

    this.fuel = Math.max(0, this.fuel - 20);

    let nearestTarget: Target | null = null;
    let nearestDist = Infinity;

    for (const target of this.targets) {
      const dx = target.x - this.heli.x;
      const dy = target.y - this.heli.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTarget = target;
      }
    }

    const dx = nearestTarget ? nearestTarget.x - this.heli.x : 0;
    const dy = nearestTarget ? nearestTarget.y - this.heli.y : 100;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 10;

    this.bullets.push({
      x: this.heli.x,
      y: this.heli.y + HELI_HEIGHT / 2,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      isRocket: true,
      damage: 5
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({ x, y, frame: 0, maxFrames: 25, radius: size });
  }

  private spawnTarget(): void {
    const types: TargetType[] = ['infantry', 'tank', 'building'];
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
    const width = type === 'building' ? TARGET_WIDTH + 30 : type === 'tank' ? TARGET_WIDTH + 10 : TARGET_WIDTH;
    const height = type === 'building' ? TARGET_HEIGHT + 20 : type === 'tank' ? TARGET_HEIGHT + 5 : TARGET_HEIGHT;

    const x = Math.random() * (CANVAS_WIDTH - width - 100) + 50;
    const y = CANVAS_HEIGHT - height - 10;

    this.targets.push({
      x, y, width, height,
      health: type === 'building' ? 5 : type === 'tank' ? 3 : 1,
      maxHealth: type === 'building' ? 5 : type === 'tank' ? 3 : 1,
      type,
      shootTimer: 0,
      shootInterval: type === 'infantry' ? 90 : type === 'tank' ? 60 : 120
    });
  }

  private checkCollision(a: { x: number; y: number }, b: { x: number; y: number; width?: number; height?: number }, radiusA: number): boolean {
    const dx = a.x - (b.x + (b.width || 0) / 2);
    const dy = a.y - (b.y + (b.height || 0) / 2);
    return Math.sqrt(dx * dx + dy * dy) < radiusA + (b.width || 0) / 2;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const speed = 4;

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      this.heli.x -= speed;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      this.heli.x += speed;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) {
      this.heli.y = Math.max(50, this.heli.y - speed);
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) {
      this.heli.y = Math.min(CANVAS_HEIGHT - 150, this.heli.y + speed);
    }

    this.heli.x = Math.max(HELI_WIDTH / 2, Math.min(CANVAS_WIDTH - HELI_WIDTH / 2, this.heli.x));
    this.heli.y = Math.max(50, Math.min(CANVAS_HEIGHT - 150, this.heli.y));

    const dx = this.mouseX - this.heli.x;
    const dy = this.mouseY - this.heli.y;
    this.heli.angle = Math.atan2(dy, dx);

    this.fuel = Math.min(100, this.fuel + 0.02);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y > CANVAS_HEIGHT + 20 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20 || bullet.y < -20) {
        this.bullets.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - this.lastTargetSpawn > Math.max(1000, 3000 - this.wave * 200)) {
      this.spawnTarget();
      this.lastTargetSpawn = now;
    }

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      target.shootTimer++;

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(
          { x: bullet.x, y: bullet.y },
          { x: target.x, y: target.y, width: target.width, height: target.height },
          bullet.isRocket ? 10 : 5
        )) {
          if (!bullet.isRocket) {
            this.bullets.splice(j, 1);
          }
          target.health -= bullet.damage;

          this.createExplosion(bullet.x, bullet.y, bullet.isRocket ? 50 : 20);

          if (target.health <= 0) {
            this.createExplosion(target.x + target.width / 2, target.y + target.height / 2, 60);
            this.score += target.type === 'building' ? 50 : target.type === 'tank' ? 30 : 10;
            this.targets.splice(i, 1);
            if (bullet.isRocket) this.bullets.splice(j, 1);
          }
          break;
        }
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.score > this.wave * 300) {
      this.wave++;
    }

    if (this.fuel <= 0 && this.lives > 0) {
      this.lives--;
      this.fuel = 100;
      if (this.lives <= 0) {
        this.isGameOver = true;
      }
    }
  }
}
