export const MISSILE_COMMAND_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  MISSILE_SPEED: 3,
  BULLET_SPEED: 15,
  INITIAL_MONEY: 200,
  INITIAL_LIVES: 20,
};

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MISSILE_SPEED,
  BULLET_SPEED,
  INITIAL_MONEY,
  INITIAL_LIVES,
} = MISSILE_COMMAND_CONSTANTS;

export interface Missile {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number;
  speed: number;
  trail: { x: number; y: number }[];
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'city' | 'bunker';
}

export interface MissileCommandState {
  missiles: Missile[];
  bullets: Bullet[];
  explosions: Explosion[];
  buildings: Building[];
  score: number;
  wave: number;
  money: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  ammo: number;
  maxAmmo: number;
}

export class MissileCommandEngine {
  private missiles: Missile[];
  private bullets: Bullet[];
  private explosions: Explosion[];
  private buildings: Building[];
  private score: number;
  private wave: number;
  private money: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private ammo: number;
  private maxAmmo: number;
  private lastMissileSpawn: number;
  private missilesSpawned: number;
  private missilesToSpawn: number;
  private nextId: number;
  private missileLaunchers: { x: number; y: number }[];
  private mouseX: number;
  private mouseY: number;

  constructor() {
    this.missiles = [];
    this.bullets = [];
    this.explosions = [];
    this.buildings = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.lastMissileSpawn = 0;
    this.missilesSpawned = 0;
    this.missilesToSpawn = 0;
    this.nextId = 1;
    this.missileLaunchers = [];
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT - 50;
    this.initBuildings();
  }

  private initBuildings(): void {
    this.buildings = [];
    const buildingWidth = 60;
    const buildingHeight = 40;
    const startX = 50;
    const spacing = 70;
    const rows = 3;

    for (let row = 0; row < rows; row++) {
      const buildingCount = 6 - row;
      const rowStartX = startX + row * spacing / 2;
      for (let i = 0; i < buildingCount; i++) {
        this.buildings.push({
          x: rowStartX + i * spacing,
          y: CANVAS_HEIGHT - 120 - row * 50,
          width: buildingWidth - row * 5,
          height: buildingHeight,
          health: 100 - row * 20,
          maxHealth: 100 - row * 20,
          type: row === 0 ? 'city' : 'bunker',
        });
      }
    }

    for (let i = 0; i < 3; i++) {
      this.missileLaunchers.push({
        x: 150 + i * 150,
        y: CANVAS_HEIGHT - 30,
      });
    }
  }

  getState(): MissileCommandState {
    return {
      missiles: this.missiles.map(m => ({
        ...m,
        trail: [...m.trail],
      })),
      bullets: this.bullets.map(b => ({ ...b })),
      explosions: this.explosions.map(e => ({ ...e })),
      buildings: this.buildings.map(b => ({ ...b })),
      score: this.score,
      wave: this.wave,
      money: this.money,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getMissileLaunchers() {
    return [...this.missileLaunchers];
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.missiles = [];
    this.bullets = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.lastMissileSpawn = 0;
    this.missilesSpawned = 0;
    this.missilesToSpawn = 0;
    this.initBuildings();
  }

  startWave(): void {
    this.wave++;
    this.missilesSpawned = 0;
    this.missilesToSpawn = 5 + this.wave * 3;
    this.lastMissileSpawn = Date.now();
    this.ammo = Math.min(this.maxAmmo, this.ammo + 10 + this.wave * 2);
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  shoot(targetX: number, targetY: number): boolean {
    if (!this.isPlaying || this.isGameOver) return false;
    if (this.ammo <= 0) return false;

    const launcher = this.findClosestLauncher(targetX, targetY);
    if (!launcher) return false;

    const dx = targetX - launcher.x;
    const dy = targetY - launcher.y;
    const dist = Math.hypot(dx, dy);
    const speed = BULLET_SPEED;

    this.bullets.push({
      id: this.nextId++,
      x: launcher.x,
      y: launcher.y,
      targetX,
      targetY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
    });

    this.ammo--;
    return true;
  }

  private findClosestLauncher(x: number, y: number): { x: number; y: number } | null {
    let closest: { x: number; y: number } | null = null;
    let closestDist = Infinity;
    for (const launcher of this.missileLaunchers) {
      const dist = Math.hypot(launcher.x - x, launcher.y - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = launcher;
      }
    }
    return closest;
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 15 + size / 5,
      size,
    });
  }

  private spawnMissile(): void {
    const targetIndex = Math.floor(Math.random() * this.buildings.length);
    const target = this.buildings[targetIndex];
    if (!target) return;

    const targetX = target.x + target.width / 2;
    const targetY = target.y;

    const startSide = Math.random() < 0.5;
    const startX = startSide ? -50 : CANVAS_WIDTH + 50;
    const startY = Math.random() * CANVAS_HEIGHT * 0.4;

    const speed = MISSILE_SPEED + this.wave * 0.2;

    this.missiles.push({
      id: this.nextId++,
      startX,
      startY,
      targetX,
      targetY,
      x: startX,
      y: startY,
      progress: 0,
      speed,
      trail: [],
    });
    this.missilesSpawned++;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();

    if (this.wave === 0 || (this.missilesSpawned >= this.missilesToSpawn && this.missiles.length === 0)) {
      if (now - this.lastMissileSpawn > 3000) {
        this.startWave();
      }
    } else if (this.missilesSpawned < this.missilesToSpawn) {
      const spawnInterval = Math.max(1000, 3000 - this.wave * 200);
      if (now - this.lastMissileSpawn > spawnInterval) {
        this.spawnMissile();
        this.lastMissileSpawn = now;
      }
    }

    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      
      missile.trail.push({ x: missile.x, y: missile.y });
      if (missile.trail.length > 20) {
        missile.trail.shift();
      }

      const dx = missile.targetX - missile.x;
      const dy = missile.targetY - missile.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0) {
        missile.x += (dx / dist) * missile.speed;
        missile.y += (dy / dist) * missile.speed;
      }

      missile.progress = 1 - (dist / Math.hypot(missile.targetX - missile.startX, missile.targetY - missile.startY));

      if (dist < 10) {
        this.createExplosion(missile.targetX, missile.targetY, 50);

        for (let j = this.buildings.length - 1; j >= 0; j--) {
          const building = this.buildings[j];
          if (Math.abs(building.x + building.width / 2 - missile.targetX) < building.width / 2 + 30 &&
              missile.targetY >= building.y - 20) {
            building.health -= 50;
            if (building.health <= 0) {
              this.buildings.splice(j, 1);
              this.lives--;
            }
          }
        }

        this.missiles.splice(i, 1);
        if (this.lives <= 0) {
          this.isGameOver = true;
        }
        continue;
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        const distToMissile = Math.hypot(missile.x - bullet.x, missile.y - bullet.y);
        
        if (distToMissile < 20) {
          this.createExplosion(missile.x, missile.y, 40);
          this.score += 25;
          this.missiles.splice(i, 1);
          this.bullets.splice(j, 1);

          const destroyedCount = this.missiles.filter(m => m.targetX === missile.targetX && m.targetY === missile.targetY).length;
          if (destroyedCount === 0) {
            let targetBuilding = this.buildings.find(b => 
              Math.abs(b.x + b.width / 2 - missile.targetX) < b.width / 2 + 30
            );
            if (targetBuilding) {
              this.money += 15;
            }
          }
          break;
        }
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
        continue;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    const activeTargets = new Set(this.missiles.map(m => `${m.targetX},${m.targetY}`));
    let buildingsAtRisk = 0;
    for (const target of activeTargets) {
      const [x, y] = target.split(',').map(Number);
      if (this.buildings.some(b => Math.abs(b.x + b.width / 2 - x) < b.width / 2 + 30)) {
        buildingsAtRisk++;
      }
    }
    this.lives = this.buildings.length;
  }
}
