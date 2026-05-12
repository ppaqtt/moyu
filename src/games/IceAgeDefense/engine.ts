// 冰时代塔防游戏引擎

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

export type EnemyType = 'polarbear' | 'penguin' | 'seal';
export type TowerType = 'igloo' | 'snowman' | 'geyser';

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
  isFrozen: boolean;
  frozenTimer: number;
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
  isActive: boolean;
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
  isSlow: boolean;
}

export interface Snowball {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  radius: number;
  isAlive: boolean;
}

export interface GameState {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  snowballs: Snowball[];
  score: number;
  lives: number;
  money: number;
  wave: number;
  isGameOver: boolean;
  isWaveActive: boolean;
  enemiesRemaining: number;
  temperature: number;
}

// 路径点 - 冰原路径
const PATH_POINTS: Position[] = [
  { x: -30, y: 400 },
  { x: 100, y: 400 },
  { x: 100, y: 200 },
  { x: 250, y: 200 },
  { x: 250, y: 350 },
  { x: 400, y: 350 },
  { x: 400, y: 100 },
  { x: 550, y: 100 },
  { x: 550, y: 300 },
  { x: 630, y: 300 }
];

// 塔防配置
const TOWER_CONFIGS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  igloo: { damage: 25, range: 110, fireRate: 700, cost: 60 },
  snowman: { damage: 15, range: 130, fireRate: 500, cost: 80 },
  geyser: { damage: 60, range: 150, fireRate: 2500, cost: 150 }
};

const ENEMY_CONFIGS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  polarbear: { health: 200, speed: 1.2, reward: 30 },
  penguin: { health: 60, speed: 2.5, reward: 12 },
  seal: { health: 100, speed: 1.8, reward: 18 }
};

export class IceAgeDefenseEngine {
  private towers: Tower[];
  private enemies: Enemy[];
  private projectiles: Projectile[];
  private snowballs: Snowball[];
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
  private snowballIdCounter: number;
  private lastUpdate: number;

  constructor() {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.snowballs = [];
    this.score = 0;
    this.lives = 20;
    this.money = 200;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 6;
    this.lastSpawnTime = 0;
    this.enemyIdCounter = 0;
    this.towerIdCounter = 0;
    this.projectileIdCounter = 0;
    this.snowballIdCounter = 0;
    this.lastUpdate = Date.now();
  }

  getState(): GameState {
    return {
      towers: this.towers.map(t => ({ ...t, target: t.target ? { ...t.target } : null })),
      enemies: this.enemies.map(e => ({ ...e })),
      projectiles: this.projectiles.map(p => ({ ...p })),
      snowballs: this.snowballs.map(s => ({ ...s })),
      score: this.score,
      lives: this.lives,
      money: this.money,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isWaveActive: this.isWaveActive,
      enemiesRemaining: this.enemies.filter(e => e.isAlive).length,
      temperature: Math.max(-20, 10 - this.wave * 2)
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
      isActive: true
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

    let type: EnemyType = 'penguin';
    const rand = Math.random();
    if (this.wave >= 2 && rand < 0.3) {
      type = 'seal';
    }
    if (this.wave >= 4 && rand < 0.2) {
      type = 'polarbear';
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
      isAlive: true,
      isFrozen: false,
      frozenTimer: 0
    });

    this.enemiesSpawned++;
  }

  private updateEnemies(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdate;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      // 冰冻效果
      if (enemy.isFrozen) {
        enemy.frozenTimer -= deltaTime;
        if (enemy.frozenTimer <= 0) {
          enemy.isFrozen = false;
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
        if (enemy.isFrozen) speed *= 0.2;
        
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

      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;

        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= tower.range && dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      tower.target = closestEnemy;

      // 发射
      if (closestEnemy && currentTime - tower.lastFire >= tower.fireRate) {
        tower.lastFire = currentTime;

        if (tower.type === 'geyser') {
          // 间歇泉 - 发射大冰球
          this.snowballs.push({
            id: this.snowballIdCounter++,
            x: tower.x,
            y: tower.y,
            targetX: closestEnemy.x,
            targetY: closestEnemy.y,
            damage: tower.damage,
            radius: 20,
            isAlive: true
          });
        } else {
          // 其他塔发射普通子弹
          this.projectiles.push({
            id: this.projectileIdCounter++,
            x: tower.x,
            y: tower.y,
            targetX: closestEnemy.x,
            targetY: closestEnemy.y,
            damage: tower.damage,
            speed: tower.type === 'snowman' ? 10 : 7,
            type: tower.type,
            isAlive: true,
            isSlow: tower.type === 'igloo'
          });
        }
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

        // 对目标造成伤害并可能冰冻
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;

          const edx = enemy.x - proj.targetX;
          const edy = enemy.y - proj.targetY;
          const edist = Math.sqrt(edx * edx + edy * edy);

          if (edist < 25) {
            enemy.health -= proj.damage;

            // 冰冻效果
            if (proj.isSlow && !enemy.isFrozen) {
              enemy.isFrozen = true;
              enemy.frozenTimer = 1500;
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

    this.projectiles = this.projectiles.filter(p => p.isAlive);
  }

  private updateSnowballs(): void {
    for (const ball of this.snowballs) {
      if (!ball.isAlive) continue;

      const dx = ball.targetX - ball.x;
      const dy = ball.targetY - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        ball.isAlive = false;

        // 范围伤害 + 冰冻
        const splashRadius = 60;
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;

          const edx = enemy.x - ball.targetX;
          const edy = enemy.y - ball.targetY;
          const edist = Math.sqrt(edx * edx + edy * edy);

          if (edist <= splashRadius) {
            const damageMultiplier = 1 - (edist / splashRadius) * 0.5;
            enemy.health -= ball.damage * damageMultiplier;

            if (!enemy.isFrozen) {
              enemy.isFrozen = true;
              enemy.frozenTimer = 2000;
            }

            if (enemy.health <= 0) {
              enemy.isAlive = false;
              this.score += enemy.reward;
              this.money += enemy.reward;
            }
          }
        }
      } else {
        const speed = 5;
        ball.x += (dx / dist) * speed;
        ball.y += (dy / dist) * speed;
      }
    }

    this.snowballs = this.snowballs.filter(b => b.isAlive);
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
    this.updateSnowballs();
  }

  reset(): void {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.snowballs = [];
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
}
