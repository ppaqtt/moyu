// 弹射塔防游戏引擎

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;

export type EnemyType = 'footman' | 'knight' | 'siege';

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

export interface Boulder {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  radius: number;
  speed: number;
  isAlive: boolean;
  arcHeight: number;
  startX: number;
  startY: number;
  progress: number;
}

export interface Catapult {
  id: number;
  x: number;
  y: number;
  damage: number;
  range: number;
  cooldown: number;
  lastFire: number;
  isReloading: boolean;
  reloadProgress: number;
}

export interface SplashEffect {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  isAlive: boolean;
}

export interface GameState {
  catapults: Catapult[];
  enemies: Enemy[];
  boulders: Boulder[];
  effects: SplashEffect[];
  score: number;
  lives: number;
  money: number;
  wave: number;
  isGameOver: boolean;
  isWaveActive: boolean;
  enemiesRemaining: number;
}

// 路径点 - 从底部向上移动
const PATH_POINTS: Position[] = [
  { x: 100, y: 550 },
  { x: 100, y: 400 },
  { x: 300, y: 400 },
  { x: 300, y: 250 },
  { x: 500, y: 250 },
  { x: 500, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: -50 }
];

const CATAPULT_COST = 150;

const ENEMY_CONFIGS: Record<EnemyType, { health: number; speed: number; reward: number }> = {
  footman: { health: 80, speed: 1.5, reward: 15 },
  knight: { health: 200, speed: 1.0, reward: 30 },
  siege: { health: 150, speed: 2.0, reward: 25 }
};

export class CatapultDefenseEngine {
  private catapults: Catapult[];
  private enemies: Enemy[];
  private boulders: Boulder[];
  private effects: SplashEffect[];
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
  private catapultIdCounter: number;
  private boulderIdCounter: number;
  private effectIdCounter: number;
  private lastUpdate: number;

  constructor() {
    this.catapults = [];
    this.enemies = [];
    this.boulders = [];
    this.effects = [];
    this.score = 0;
    this.lives = 15;
    this.money = 300;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 5;
    this.lastSpawnTime = 0;
    this.enemyIdCounter = 0;
    this.catapultIdCounter = 0;
    this.boulderIdCounter = 0;
    this.effectIdCounter = 0;
    this.lastUpdate = Date.now();
  }

  getState(): GameState {
    return {
      catapults: this.catapults.map(c => ({ ...c })),
      enemies: this.enemies.map(e => ({ ...e })),
      boulders: this.boulders.map(b => ({ ...b })),
      effects: this.effects.map(e => ({ ...e })),
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
    this.enemiesPerWave = 4 + this.wave * 2;
    this.lastSpawnTime = Date.now();
    return true;
  }

  canAffordCatapult(): boolean {
    return this.money >= CATAPULT_COST;
  }

  placeCatapult(x: number, y: number): boolean {
    if (this.isGameOver) return false;
    if (!this.canAffordCatapult()) return false;
    
    // 检查是否在路径附近
    if (this.isNearPath(x, y)) return false;
    
    // 检查是否与其他投石机太近
    if (this.catapults.some(c => Math.abs(c.x - x) < 60 && Math.abs(c.y - y) < 60)) return false;

    this.money -= CATAPULT_COST;

    this.catapults.push({
      id: this.catapultIdCounter++,
      x,
      y,
      damage: 50 + this.wave * 5,
      range: 200,
      cooldown: 2000,
      lastFire: 0,
      isReloading: false,
      reloadProgress: 0
    });

    return true;
  }

  private isNearPath(x: number, y: number): boolean {
    for (const point of PATH_POINTS) {
      const dx = point.x - x;
      const dy = point.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50) return true;
    }
    return false;
  }

  private spawnEnemy(): void {
    if (this.enemiesSpawned >= this.enemiesPerWave) return;

    let type: EnemyType = 'footman';
    const rand = Math.random();
    if (this.wave >= 3 && rand < 0.25) {
      type = 'knight';
    }
    if (this.wave >= 5 && rand < 0.2) {
      type = 'siege';
    }

    const config = ENEMY_CONFIGS[type];
    const healthMultiplier = 1 + (this.wave - 1) * 0.25;

    // 随机选择入口
    const entryIndex = Math.floor(Math.random() * 4);
    const entries = [
      { x: 50, y: 550 },
      { x: 550, y: 550 },
      { x: 300, y: 550 },
      { x: 150, y: 550 }
    ];
    const entry = entries[entryIndex];

    this.enemies.push({
      id: this.enemyIdCounter++,
      x: entry.x,
      y: entry.y,
      health: config.health * healthMultiplier,
      maxHealth: config.health * healthMultiplier,
      speed: config.speed,
      reward: config.reward,
      type,
      pathIndex: -1,
      isAlive: true
    });

    this.enemiesSpawned++;
  }

  private findClosestPathPoint(x: number, y: number): number {
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < PATH_POINTS.length; i++) {
      const point = PATH_POINTS[i];
      const dx = point.x - x;
      const dy = point.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  private updateEnemies(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdate;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      // 找到最近的路径点
      if (enemy.pathIndex === -1) {
        enemy.pathIndex = this.findClosestPathPoint(enemy.x, enemy.y);
      }

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
        this.money += 80 + this.wave * 15;
      }
    }
  }

  private updateCatapults(): void {
    const currentTime = Date.now();

    for (const catapult of this.catapults) {
      // 更新装填进度
      if (catapult.isReloading) {
        const timeSinceFire = currentTime - catapult.lastFire;
        catapult.reloadProgress = Math.min(timeSinceFire / catapult.cooldown, 1);
        
        if (timeSinceFire >= catapult.cooldown) {
          catapult.isReloading = false;
        }
      }

      if (catapult.isReloading) continue;

      // 查找范围内最近的敌人
      let closestEnemy: Enemy | null = null;
      let closestDist = Infinity;

      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;

        const dx = enemy.x - catapult.x;
        const dy = enemy.y - catapult.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= catapult.range && dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      // 发射巨石
      if (closestEnemy) {
        catapult.lastFire = currentTime;
        catapult.isReloading = true;
        catapult.reloadProgress = 0;

        const dx = closestEnemy.x - catapult.x;
        const dy = closestEnemy.y - catapult.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.boulders.push({
          id: this.boulderIdCounter++,
          x: catapult.x,
          y: catapult.y,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          damage: catapult.damage,
          radius: 15,
          speed: 4,
          isAlive: true,
          arcHeight: dist * 0.4,
          startX: catapult.x,
          startY: catapult.y,
          progress: 0
        });
      }
    }
  }

  private updateBoulders(): void {
    const currentTime = Date.now();

    for (const boulder of this.boulders) {
      if (!boulder.isAlive) continue;

      boulder.progress += boulder.speed / 100;

      if (boulder.progress >= 1) {
        // 落地
        boulder.isAlive = false;
        
        // 创建溅射效果
        this.effects.push({
          id: this.effectIdCounter++,
          x: boulder.targetX,
          y: boulder.targetY,
          radius: 0,
          maxRadius: 60,
          alpha: 1,
          isAlive: true
        });

        // 对范围内的敌人造成伤害
        const splashDamage = boulder.damage;
        const splashRadius = 50;

        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;

          const dx = enemy.x - boulder.targetX;
          const dy = enemy.y - boulder.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= splashRadius) {
            const damageMultiplier = 1 - (dist / splashRadius) * 0.5;
            enemy.health -= splashDamage * damageMultiplier;

            if (enemy.health <= 0) {
              enemy.isAlive = false;
              this.score += enemy.reward;
              this.money += enemy.reward;
            }
          }
        }
      } else {
        // 抛物线运动
        const t = boulder.progress;
        boulder.x = boulder.startX + (boulder.targetX - boulder.startX) * t;
        
        // 抛物线高度
        const arc = 4 * boulder.arcHeight * t * (1 - t);
        boulder.y = boulder.startY + (boulder.targetY - boulder.startY) * t - arc;
      }
    }

    // 清理无效对象
    this.boulders = this.boulders.filter(b => b.isAlive);
    this.enemies = this.enemies.filter(e => e.isAlive);
  }

  private updateEffects(): void {
    for (const effect of this.effects) {
      if (!effect.isAlive) continue;

      effect.radius += 3;
      effect.alpha -= 0.05;

      if (effect.alpha <= 0 || effect.radius >= effect.maxRadius) {
        effect.isAlive = false;
      }
    }

    this.effects = this.effects.filter(e => e.isAlive);
  }

  tick(): void {
    if (this.isGameOver) return;

    this.lastUpdate = Date.now();

    // 生成敌人
    if (this.isWaveActive && this.enemiesSpawned < this.enemiesPerWave) {
      const currentTime = Date.now();
      const spawnInterval = Math.max(1200 - this.wave * 80, 500);
      if (currentTime - this.lastSpawnTime >= spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = currentTime;
      }
    }

    this.updateEnemies();
    this.updateCatapults();
    this.updateBoulders();
    this.updateEffects();
  }

  reset(): void {
    this.catapults = [];
    this.enemies = [];
    this.boulders = [];
    this.effects = [];
    this.score = 0;
    this.lives = 15;
    this.money = 300;
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
