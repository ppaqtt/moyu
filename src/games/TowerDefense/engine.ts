// 经典塔防游戏引擎

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;
export const GRID_SIZE = 40;
export const GRID_COLS = CANVAS_WIDTH / GRID_SIZE;
export const GRID_ROWS = CANVAS_HEIGHT / GRID_SIZE;

export type TowerType = 'arrow' | 'cannon' | 'ice';
export type EnemyType = 'basic' | 'fast' | 'tank';

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

// 路径点 - 从左到右的S形路径
const PATH_POINTS: Position[] = [
  { x: 0, y: 200 },
  { x: 120, y: 200 },
  { x: 120, y: 80 },
  { x: 280, y: 80 },
  { x: 280, y: 320 },
  { x: 440, y: 320 },
  { x: 440, y: 160 },
  { x: 600, y: 160 }
];

// 塔防配置
const TOWER_CONFIGS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  arrow: { damage: 25, range: 120, fireRate: 800, cost: 50 },
  cannon: { damage: 60, range: 100, fireRate: 1500, cost: 100 },
  ice: { damage: 15, range: 100, fireRate: 1000, cost: 75 }
};

const ENEMY_CONFIGS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  basic: { health: 100, speed: 1.2, reward: 10 },
  fast: { health: 60, speed: 2.5, reward: 15 },
  tank: { health: 300, speed: 0.8, reward: 30 }
};

export class TowerDefenseEngine {
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
    this.money = 200;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 5;
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

  placeTower(gridX: number, gridY: number, type: TowerType): boolean {
    if (this.isGameOver) return false;
    if (!this.canAffordTower(type)) return false;

    // 检查格子是否已有塔或路径
    if (this.isPathCell(gridX, gridY)) return false;
    if (this.towers.some(t => t.x === gridX && t.y === gridY)) return false;

    const config = TOWER_CONFIGS[type];
    this.money -= config.cost;

    this.towers.push({
      id: this.towerIdCounter++,
      x: gridX,
      y: gridY,
      type,
      damage: config.damage,
      range: config.range,
      fireRate: config.fireRate,
      lastFire: 0,
      target: null
    });

    return true;
  }

  private isPathCell(gridX: number, gridY: number): boolean {
    const cellCenterX = gridX * GRID_SIZE + GRID_SIZE / 2;
    const cellCenterY = gridY * GRID_SIZE + GRID_SIZE / 2;

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p1 = PATH_POINTS[i];
      const p2 = PATH_POINTS[i + 1];
      
      const minX = Math.min(p1.x, p2.x) - GRID_SIZE;
      const maxX = Math.max(p1.x, p2.x) + GRID_SIZE;
      const minY = Math.min(p1.y, p2.y) - GRID_SIZE;
      const maxY = Math.max(p1.y, p2.y) + GRID_SIZE;

      if (cellCenterX >= minX && cellCenterX <= maxX && cellCenterY >= minY && cellCenterY <= maxY) {
        return true;
      }
    }
    return false;
  }

  private spawnEnemy(): void {
    if (this.enemiesSpawned >= this.enemiesPerWave) return;

    let type: EnemyType = 'basic';
    const rand = Math.random();
    if (this.wave >= 3 && rand < 0.3) {
      type = 'fast';
    }
    if (this.wave >= 5 && rand < 0.15) {
      type = 'tank';
    }

    const config = ENEMY_CONFIGS[type];
    const healthMultiplier = 1 + (this.wave - 1) * 0.2;

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
      isAlive: true
    });

    this.enemiesSpawned++;
  }

  private updateEnemies(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdate;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

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
        const moveSpeed = enemy.speed * (deltaTime / 16);
        enemy.x += (dx / dist) * moveSpeed;
        enemy.y += (dy / dist) * moveSpeed;
      }
    }

    // 检查波次是否完成
    if (this.isWaveActive && this.enemiesSpawned >= this.enemiesPerWave) {
      const aliveCount = this.enemies.filter(e => e.isAlive).length;
      if (aliveCount === 0) {
        this.isWaveActive = false;
        this.money += 50 + this.wave * 10;
      }
    }
  }

  private updateTowers(): void {
    const currentTime = Date.now();

    for (const tower of this.towers) {
      // 查找目标
      let closestEnemy: Enemy | null = null;
      let closestDist = Infinity;

      const towerX = tower.x * GRID_SIZE + GRID_SIZE / 2;
      const towerY = tower.y * GRID_SIZE + GRID_SIZE / 2;

      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;

        const dx = enemy.x - towerX;
        const dy = enemy.y - towerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= tower.range && dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      tower.target = closestEnemy;

      // 发射子弹
      if (closestEnemy && currentTime - tower.lastFire >= tower.fireRate) {
        tower.lastFire = currentTime;
        
        this.projectiles.push({
          id: this.projectileIdCounter++,
          x: towerX,
          y: towerY,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          damage: tower.damage,
          speed: 6,
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
        // 命中
        proj.isAlive = false;
        
        // 找到最近的敌人并造成伤害
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;
          const edx = enemy.x - proj.targetX;
          const edy = enemy.y - proj.targetY;
          const edist = Math.sqrt(edx * edx + edy * edy);
          
          if (edist < 30) {
            enemy.health -= proj.damage;
            
            // 冰塔减速效果
            if (proj.type === 'ice') {
              enemy.speed *= 0.5;
            }

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

    // 清理无效子弹
    this.projectiles = this.projectiles.filter(p => p.isAlive);
  }

  tick(): void {
    if (this.isGameOver) return;

    this.lastUpdate = Date.now();

    // 生成敌人
    if (this.isWaveActive && this.enemiesSpawned < this.enemiesPerWave) {
      const currentTime = Date.now();
      const spawnInterval = Math.max(800 - this.wave * 50, 300);
      if (currentTime - this.lastSpawnTime >= spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = currentTime;
      }
    }

    this.updateEnemies();
    this.updateTowers();
    this.updateProjectiles();

    // 清理死亡敌人
    this.enemies = this.enemies.filter(e => e.isAlive);
  }

  reset(): void {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.score = 0;
    this.lives = 20;
    this.money = 200;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.lastSpawnTime = 0;
  }

  getPathPoints(): Position[] {
    return [...PATH_POINTS];
  }

  sellTower(gridX: number, gridY: number): boolean {
    const index = this.towers.findIndex(t => t.x === gridX && t.y === gridY);
    if (index === -1) return false;

    const tower = this.towers[index];
    const refund = Math.floor(TOWER_CONFIGS[tower.type].cost * 0.6);
    this.money += refund;
    this.towers.splice(index, 1);
    return true;
  }
}
