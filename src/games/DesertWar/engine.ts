// 沙漠战争塔防游戏引擎

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

export type EnemyType = 'worm' | 'scorpion' | 'spider';
export type TowerType = 'camel' | 'sniper' | 'sandstorm';

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  type: EnemyType;
  pathIndex: number;
  isAlive: boolean;
  isBurrowed: boolean;
  burrowTimer: number;
}

export interface Tower {
  id: number;
  x: number;
  y: number;
  type: TowerType;
  damage: number;
  range: number;
  fireRate: number;
  lastFire: number;
  target: Enemy | null;
  charge: number;
  maxCharge: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  type: TowerType;
  isAlive: boolean;
}

export interface GameState {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  score: number;
  lives: number;
  money: number;
  wave: number;
  isGameOver: boolean;
  isWaveActive: boolean;
  enemiesRemaining: number;
}

// 路径点 - 蜿蜒的沙漠路径
const PATH_POINTS: Position[] = [
  { x: -30, y: 250 },
  { x: 80, y: 250 },
  { x: 80, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 350 },
  { x: 350, y: 350 },
  { x: 350, y: 180 },
  { x: 500, y: 180 },
  { x: 500, y: 400 },
  { x: 630, y: 400 }
];

// 塔防配置
const TOWER_CONFIGS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  camel: { damage: 20, range: 100, fireRate: 600, cost: 50 },
  sniper: { damage: 80, range: 200, fireRate: 2000, cost: 120 },
  sandstorm: { damage: 15, range: 80, fireRate: 400, cost: 80 }
};

const ENEMY_CONFIGS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  worm: { health: 150, speed: 2.0, reward: 25 },
  scorpion: { health: 80, speed: 1.5, reward: 15 },
  spider: { health: 50, speed: 3.0, reward: 10 }
};

export class DesertWarEngine {
  private towers: Tower[];
  private enemies: Enemy[];
  private projectiles: Projectile[];
  private score: number;
  private lives: number;
  private money: number;
  private wave: number;
  private isGameOver: boolean;
  private isWaveActive: boolean;
  private enemiesSpawned: number;
  private enemiesPerWave: number;
  private lastSpawnTime: number;
  private enemyIdCounter: number;
  private towerIdCounter: number;
  private projectileIdCounter: number;
  private lastUpdate: number;

  constructor() {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.score = 0;
    this.lives = 20;
    this.money = 250;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 6;
    this.lastSpawnTime = 0;
    this.enemyIdCounter = 0;
    this.towerIdCounter = 0;
    this.projectileIdCounter = 0;
    this.lastUpdate = Date.now();
  }

  getState(): GameState {
    return {
      towers: this.towers.map(t => ({ ...t, target: t.target ? { ...t.target } : null })),
      enemies: this.enemies.map(e => ({ ...e })),
      projectiles: this.projectiles.map(p => ({ ...p })),
      score: this.score,
      lives: this.lives,
      money: this.money,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isWaveActive: this.isWaveActive,
      enemiesRemaining: this.enemies.filter(e => e.isAlive).length
    };
  }

  startWave(): boolean {
    if (this.isWaveActive) return false;
    this.wave++;
    this.isWaveActive = true;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 5 + this.wave * 2;
    this.lastSpawnTime = Date.now();
    return true;
  }

  canAffordTower(type: TowerType): boolean {
    return this.money >= TOWER_CONFIGS[type].cost;
  }

  placeTower(x: number, y: number, type: TowerType): boolean {
    if (this.isGameOver) return false;
    if (!this.canAffordTower(type)) return false;

    // 检查格子是否已有塔或路径
    if (this.isPathCell(x, y)) return false;
    if (this.towers.some(t => t.x === x && t.y === y)) return false;

    const config = TOWER_CONFIGS[type];
    this.money -= config.cost;

    this.towers.push({
      id: this.towerIdCounter++,
      x,
      y,
      type,
      damage: config.damage,
      range: config.range,
      fireRate: config.fireRate,
      lastFire: 0,
      target: null,
      charge: 0,
      maxCharge: type === 'sniper' ? 100 : 50
    });

    return true;
  }

  private isPathCell(x: number, y: number): boolean {
    const cellSize = 45;
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p1 = PATH_POINTS[i];
      const p2 = PATH_POINTS[i + 1];
      
      const minX = Math.min(p1.x, p2.x) - cellSize;
      const maxX = Math.max(p1.x, p2.x) + cellSize;
      const minY = Math.min(p1.y, p2.y) - cellSize;
      const maxY = Math.max(p1.y, p2.y) + cellSize;

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return true;
      }
    }
    return false;
  }

  private spawnEnemy(): void {
    if (this.enemiesSpawned >= this.enemiesPerWave) return;

    let type: EnemyType = 'worm';
    const rand = Math.random();
    if (this.wave >= 2 && rand < 0.3) {
      type = 'scorpion';
    }
    if (this.wave >= 4 && rand < 0.2) {
      type = 'spider';
    }

    const config = ENEMY_CONFIGS[type];
    const healthMultiplier = 1 + (this.wave - 1) * 0.25;

    this.enemies.push({
      id: this.enemyIdCounter++,
      x: PATH_POINTS[0].x,
      y: PATH_POINTS[0].y,
      health: config.health * healthMultiplier,
      maxHealth: config.health * healthMultiplier,
      speed: config.speed,
      reward: config.reward,
      type,
      pathIndex: 0,
      isAlive: true,
      isBurrowed: false,
      burrowTimer: 0
    });

    this.enemiesSpawned++;
  }

  private updateEnemies(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdate;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      // 沙虫钻地效果
      if (enemy.type === 'worm') {
        enemy.burrowTimer -= deltaTime;
        if (enemy.burrowTimer <= 0) {
          enemy.isBurrowed = !enemy.isBurrowed;
          enemy.burrowTimer = enemy.isBurrowed ? 2000 : 3000;
        }
      }

      // 路径移动
      if (enemy.pathIndex >= PATH_POINTS.length - 1) {
        enemy.isAlive = false;
        this.lives--;
        if (this.lives <= 0) {
          this.isGameOver = true;
        }
        continue;
      }

      const target = PATH_POINTS[enemy.pathIndex + 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        enemy.pathIndex++;
      } else {
        let speed = enemy.speed;
        if (enemy.isBurrowed) speed *= 1.5;
        
        const moveSpeed = speed * (deltaTime / 16);
        enemy.x += (dx / dist) * moveSpeed;
        enemy.y += (dy / dist) * moveSpeed;
      }
    }

    // 检查波次完成
    if (this.isWaveActive && this.enemiesSpawned >= this.enemiesPerWave) {
      const aliveCount = this.enemies.filter(e => e.isAlive).length;
      if (aliveCount === 0) {
        this.isWaveActive = false;
        this.money += 60 + this.wave * 12;
      }
    }
  }

  private updateTowers(): void {
    const currentTime = Date.now();

    for (const tower of this.towers) {
      // 更新充能
      tower.charge = Math.min(tower.maxCharge, tower.charge + 1);

      // 查找目标
      let closestEnemy: Enemy | null = null;
      let closestDist = Infinity;

      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;
        // 沙虫钻地时无法被瞄准
        if (enemy.isBurrowed && tower.type !== 'sandstorm') continue;

        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= tower.range && dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      tower.target = closestEnemy;

      // 发射子弹
      const fireRate = tower.type === 'sniper' ? tower.fireRate * (tower.charge / tower.maxCharge) : tower.fireRate;
      if (closestEnemy && currentTime - tower.lastFire >= fireRate) {
        tower.lastFire = currentTime;
        tower.charge = 0;

        const damage = tower.type === 'sniper' ? tower.damage * (tower.charge / tower.maxCharge + 0.5) : tower.damage;

        this.projectiles.push({
          id: this.projectileIdCounter++,
          x: tower.x,
          y: tower.y,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          damage,
          speed: tower.type === 'sniper' ? 15 : 6,
          type: tower.type,
          isAlive: true
        });
      }
    }
  }

  private updateProjectiles(): void {
    for (const proj of this.projectiles) {
      if (!proj.isAlive) continue;

      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        proj.isAlive = false;

        // 对目标造成伤害
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;
          if (enemy.isBurrowed && proj.type !== 'sandstorm') continue;

          const edx = enemy.x - proj.targetX;
          const edy = enemy.y - proj.targetY;
          const edist = Math.sqrt(edx * edx + edy * edy);

          if (edist < 30) {
            enemy.health -= proj.damage;

            if (enemy.health <= 0) {
              enemy.isAlive = false;
              this.score += enemy.reward;
              this.money += enemy.reward;
            }
            break;
          }
        }
      } else {
        proj.x += (dx / dist) * proj.speed;
        proj.y += (dy / dist) * proj.speed;
      }
    }

    // 清理
    this.projectiles = this.projectiles.filter(p => p.isAlive);
    this.enemies = this.enemies.filter(e => e.isAlive);
  }

  tick(): void {
    if (this.isGameOver) return;

    this.lastUpdate = Date.now();

    // 生成敌人
    if (this.isWaveActive && this.enemiesSpawned < this.enemiesPerWave) {
      const currentTime = Date.now();
      const spawnInterval = Math.max(1000 - this.wave * 50, 400);
      if (currentTime - this.lastSpawnTime >= spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = currentTime;
      }
    }

    this.updateEnemies();
    this.updateTowers();
    this.updateProjectiles();
  }

  reset(): void {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.score = 0;
    this.lives = 20;
    this.money = 250;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.lastSpawnTime = 0;
  }

  getPathPoints(): Position[] {
    return [...PATH_POINTS];
  }
}
