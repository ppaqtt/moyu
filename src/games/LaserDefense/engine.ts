export const LASER_DEFENSE_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  TURRET_SIZE: 40,
  BULLET_SIZE: 8,
  ENEMY_SIZE: 30,
  INITIAL_MONEY: 200,
  INITIAL_LIVES: 20,
};

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TURRET_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
  INITIAL_MONEY,
  INITIAL_LIVES,
} = LASER_DEFENSE_CONSTANTS;

export type EnemyType = 'basic' | 'fast' | 'tank';
export type TurretType = 'laser' | 'plasma' | 'freezer';

export interface Position {
  x: number;
  y: number;
}

export interface Turret extends Position {
  id: number;
  type: TurretType;
  angle: number;
  cooldown: number;
  maxCooldown: number;
  damage: number;
  range: number;
  level: number;
}

export interface Bullet extends Position {
  id: number;
  vx: number;
  vy: number;
  damage: number;
  type: TurretType;
  life: number;
}

export interface Enemy extends Position {
  id: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  pathIndex: number;
  pathProgress: number;
}

export interface PathPoint extends Position {}

export interface LaserDefenseState {
  turrets: Turret[];
  enemies: Enemy[];
  bullets: Bullet[];
  score: number;
  wave: number;
  money: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  isWaveActive: boolean;
}

export class LaserDefenseEngine {
  private turrets: Turret[];
  private enemies: Enemy[];
  private bullets: Bullet[];
  private score: number;
  private wave: number;
  private money: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private isWaveActive: boolean;
  private lastEnemySpawn: number;
  private enemiesSpawned: number;
  private enemiesToSpawn: number;
  private nextId: number;
  private pathPoints: PathPoint[];

  private static readonly TURRET_STATS: Record<TurretType, { damage: number; cooldown: number; range: number; price: number; color: string }> = {
    laser: { damage: 25, cooldown: 30, range: 150, price: 50, color: '#00ffff' },
    plasma: { damage: 50, cooldown: 60, range: 120, price: 100, color: '#ff00ff' },
    freezer: { damage: 10, cooldown: 40, range: 130, price: 75, color: '#00ff88' },
  };

  private static readonly ENEMY_STATS: Record<EnemyType, { health: number; speed: number; reward: number; size: number }> = {
    basic: { health: 100, speed: 1.5, reward: 15, size: 30 },
    fast: { health: 60, speed: 3, reward: 20, size: 25 },
    tank: { health: 300, speed: 0.8, reward: 40, size: 40 },
  };

  constructor() {
    this.turrets = [];
    this.enemies = [];
    this.bullets = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.isWaveActive = false;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.nextId = 1;
    this.initPath();
  }

  private initPath(): void {
    this.pathPoints = [
      { x: 0, y: 100 },
      { x: 150, y: 100 },
      { x: 150, y: 300 },
      { x: 450, y: 300 },
      { x: 450, y: 500 },
      { x: 300, y: 500 },
      { x: 300, y: 650 },
      { x: 600, y: 650 },
    ];
  }

  getPathPoints(): PathPoint[] {
    return [...this.pathPoints];
  }

  getState(): LaserDefenseState {
    return {
      turrets: this.turrets.map(t => ({ ...t })),
      enemies: this.enemies.map(e => ({ ...e })),
      bullets: this.bullets.map(b => ({ ...b })),
      score: this.score,
      wave: this.wave,
      money: this.money,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      isWaveActive: this.isWaveActive,
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getTurretPrice(type: TurretType): number {
    return LaserDefenseEngine.TURRET_STATS[type].price;
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.turrets = [];
    this.enemies = [];
    this.bullets = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.isWaveActive = false;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
  }

  startWave(): void {
    if (this.isWaveActive) return;
    this.wave++;
    this.isWaveActive = true;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 5 + this.wave * 3;
    this.lastEnemySpawn = Date.now();
  }

  placeTurret(x: number, y: number, type: TurretType): boolean {
    if (!this.isPlaying) return false;
    if (this.money < LaserDefenseEngine.TURRET_STATS[type].price) return false;
    if (this.isPathCell(x, y)) return false;
    if (this.turrets.some(t => t.x === x && t.y === y)) return false;

    const stats = LaserDefenseEngine.TURRET_STATS[type];
    this.turrets.push({
      id: this.nextId++,
      x,
      y,
      type,
      angle: 0,
      cooldown: 0,
      maxCooldown: stats.cooldown,
      damage: stats.damage,
      range: stats.range,
      level: 1,
    });
    this.money -= stats.price;
    return true;
  }

  upgradeTurret(x: number, y: number): boolean {
    const turret = this.turrets.find(t => t.x === x && t.y === y);
    if (!turret) return false;
    if (turret.level >= 5) return false;
    const upgradeCost = LaserDefenseEngine.TURRET_STATS[turret.type].price * turret.level;
    if (this.money < upgradeCost) return false;

    this.money -= upgradeCost;
    turret.level++;
    turret.damage *= 1.5;
    turret.range *= 1.1;
    turret.maxCooldown = Math.floor(turret.maxCooldown * 0.85);
    return true;
  }

  sellTurret(x: number, y: number): boolean {
    const index = this.turrets.findIndex(t => t.x === x && t.y === y);
    if (index === -1) return false;
    const turret = this.turrets[index];
    const refund = Math.floor(LaserDefenseEngine.TURRET_STATS[turret.type].price * turret.level * 0.6);
    this.money += refund;
    this.turrets.splice(index, 1);
    return true;
  }

  private isPathCell(gridX: number, gridY: number): boolean {
    const cellSize = 50;
    const pathWidth = 40;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      const minX = Math.min(p1.x, p2.x) - pathWidth;
      const maxX = Math.max(p1.x, p2.x) + pathWidth;
      const minY = Math.min(p1.y, p2.y) - pathWidth;
      const maxY = Math.max(p1.y, p2.y) + pathWidth;
      const cellCenterX = gridX * cellSize + cellSize / 2;
      const cellCenterY = gridY * cellSize + cellSize / 2;
      if (cellCenterX >= minX && cellCenterX <= maxX && cellCenterY >= minY && cellCenterY <= maxY) {
        return true;
      }
    }
    return false;
  }

  private getPositionOnPath(pathProgress: number): Position {
    const totalLength = this.getPathLength();
    const targetDist = pathProgress * totalLength;
    let currentDist = 0;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      const segLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (currentDist + segLength >= targetDist) {
        const t = (targetDist - currentDist) / segLength;
        return {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        };
      }
      currentDist += segLength;
    }
    return this.pathPoints[this.pathPoints.length - 1];
  }

  private getPathLength(): number {
    let length = 0;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      length += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    return length;
  }

  private spawnEnemy(): void {
    const rand = Math.random();
    let type: EnemyType;
    if (rand < 0.5) type = 'basic';
    else if (rand < 0.8) type = 'fast';
    else type = 'tank';

    const stats = LaserDefenseEngine.ENEMY_STATS[type];
    const healthMult = 1 + (this.wave - 1) * 0.2;
    this.enemies.push({
      id: this.nextId++,
      x: this.pathPoints[0].x,
      y: this.pathPoints[0].y,
      type,
      health: stats.health * healthMult,
      maxHealth: stats.health * healthMult,
      speed: stats.speed + this.wave * 0.1,
      reward: stats.reward,
      pathIndex: 0,
      pathProgress: 0,
    });
    this.enemiesSpawned++;
  }

  private findTarget(turret: Turret): Enemy | null {
    const turretX = turret.x * 50 + 25;
    const turretY = turret.y * 50 + 25;
    let closest: Enemy | null = null;
    let closestDist = turret.range;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - turretX, enemy.y - turretY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();

    if (this.isWaveActive && this.enemiesSpawned < this.enemiesToSpawn) {
      const spawnInterval = Math.max(500, 1500 - this.wave * 50);
      if (now - this.lastEnemySpawn > spawnInterval) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }
    }

    const pathLength = this.getPathLength();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.pathProgress += enemy.speed / pathLength;
      if (enemy.pathProgress >= 1) {
        this.enemies.splice(i, 1);
        this.lives--;
        if (this.lives <= 0) {
          this.isGameOver = true;
        }
        continue;
      }
      const pos = this.getPositionOnPath(enemy.pathProgress);
      enemy.x = pos.x;
      enemy.y = pos.y;
    }

    for (const turret of this.turrets) {
      turret.cooldown = Math.max(0, turret.cooldown - 1);
      const target = this.findTarget(turret);
      if (target) {
        const turretX = turret.x * 50 + 25;
        const turretY = turret.y * 50 + 25;
        turret.angle = Math.atan2(target.y - turretY, target.x - turretX);
        if (turret.cooldown === 0) {
          const angle = turret.angle;
          const speed = 8;
          this.bullets.push({
            id: this.nextId++,
            x: turretX,
            y: turretY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: turret.damage,
            type: turret.type,
            life: 100,
          });
          turret.cooldown = turret.maxCooldown;
        }
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;
      if (bullet.life <= 0 || bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
        continue;
      }
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
        const hitRadius = LaserDefenseEngine.ENEMY_STATS[enemy.type].size / 2;
        if (dist < hitRadius + BULLET_SIZE / 2) {
          enemy.health -= bullet.damage;
          if (bullet.type === 'freezer') {
            enemy.speed *= 0.5;
          }
          this.bullets.splice(i, 1);
          if (enemy.health <= 0) {
            this.score += enemy.reward * 10;
            this.money += enemy.reward;
            this.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    if (this.isWaveActive && this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0) {
      this.isWaveActive = false;
      this.money += 50 + this.wave * 10;
    }
  }
}
