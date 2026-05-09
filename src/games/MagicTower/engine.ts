// 魔法塔防游戏引擎

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;
export const MANA_MAX = 100;

export type MagicType = 'fire' | 'ice' | 'lightning';

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
  type: string;
  pathIndex: number;
  isAlive: boolean;
  isSlowed: boolean;
  slowTimer: number;
  isShocked: boolean;
  shockTimer: number;
}

export interface MagicTower {
  id: number;
  x: number;
  y: number;
  type: MagicType;
  damage: number;
  range: number;
  manaCost: number;
  cooldown: number;
  lastFire: number;
  isReady: boolean;
}

export interface MagicBolt {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  type: MagicType;
  isAlive: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface GameState {
  towers: MagicTower[];
  enemies: Enemy[];
  bolts: MagicBolt[];
  score: number;
  lives: number;
  mana: number;
  manaRegen: number;
  wave: number;
  isGameOver: boolean;
  isWaveActive: boolean;
  enemiesRemaining: number;
}

// 路径点
const PATH_POINTS: Position[] = [
  { x: -30, y: 250 },
  { x: 100, y: 250 },
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 300, y: 400 },
  { x: 500, y: 400 },
  { x: 500, y: 250 },
  { x: 630, y: 250 }
];

// 塔防配置
const TOWER_CONFIGS: Record<MagicType, { damage: number; range: number; manaCost: number; cooldown: number; color: string }> = {
  fire: { damage: 40, range: 130, manaCost: 15, cooldown: 1000, color: '#e74c3c' },
  ice: { damage: 20, range: 120, manaCost: 12, cooldown: 800, color: '#3498db' },
  lightning: { damage: 30, range: 150, manaCost: 20, cooldown: 1200, color: '#f1c40f' }
};

const ENEMY_TYPES = ['imp', 'wraith', 'golem'];

const ENEMY_CONFIGS: Record<string, { health: number; speed: number; reward: number }> = {
  imp: { health: 80, speed: 1.8, reward: 12 },
  wraith: { health: 60, speed: 2.5, reward: 15 },
  golem: { health: 250, speed: 0.7, reward: 35 }
};

export class MagicTowerEngine {
  private towers: MagicTower[];
  private enemies: Enemy[];
  private bolts: MagicBolt[];
  private score: number;
  private lives: number;
  private mana: number;
  private manaRegen: number;
  private wave: number;
  private isGameOver: boolean;
  private isWaveActive: boolean;
  private enemiesSpawned: number;
  private enemiesPerWave: number;
  private lastSpawnTime: number;
  private enemyIdCounter: number;
  private towerIdCounter: number;
  private boltIdCounter: number;
  private lastUpdate: number;

  constructor() {
    this.towers = [];
    this.enemies = [];
    this.bolts = [];
    this.score = 0;
    this.lives = 20;
    this.mana = MANA_MAX;
    this.manaRegen = 0.15;
    this.wave = 0;
    this.isGameOver = false;
    this.isWaveActive = false;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 5;
    this.lastSpawnTime = 0;
    this.enemyIdCounter = 0;
    this.towerIdCounter = 0;
    this.boltIdCounter = 0;
    this.lastUpdate = Date.now();
  }

  getState(): GameState {
    return {
      towers: this.towers.map(t => ({ ...t })),
      enemies: this.enemies.map(e => ({ ...e })),
      bolts: this.bolts.map(b => ({ ...b })),
      score: this.score,
      lives: this.lives,
      mana: this.mana,
      manaRegen: this.manaRegen,
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

  canAffordTower(type: MagicType): boolean {
    const config = TOWER_CONFIGS[type];
    return this.mana >= config.manaCost && this.mana >= 30; // 至少保留30法力
  }

  placeTower(x: number, y: number, type: MagicType): boolean {
    if (this.isGameOver) return false;
    if (!this.canAffordTower(type)) return false;

    // 检查格子是否已有塔或路径
    if (this.isPathCell(x, y)) return false;
    if (this.towers.some(t => t.x === x && t.y === y)) return false;

    const config = TOWER_CONFIGS[type];
    this.mana -= 30; // 基础放置费用

    this.towers.push({
      id: this.towerIdCounter++,
      x,
      y,
      type,
      damage: config.damage,
      range: config.range,
      manaCost: config.manaCost,
      cooldown: config.cooldown,
      lastFire: 0,
      isReady: true
    });

    return true;
  }

  private isPathCell(x: number, y: number): boolean {
    const cellSize = 50;
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

    let type = 'imp';
    const rand = Math.random();
    if (this.wave >= 3 && rand < 0.25) {
      type = 'wraith';
    }
    if (this.wave >= 5 && rand < 0.15) {
      type = 'golem';
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
      isSlowed: false,
      slowTimer: 0,
      isShocked: false,
      shockTimer: 0
    });

    this.enemiesSpawned++;
  }

  private updateEnemies(): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdate;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive) continue;

      // 更新状态效果
      if (enemy.isSlowed) {
        enemy.slowTimer -= deltaTime;
        if (enemy.slowTimer <= 0) {
          enemy.isSlowed = false;
        }
      }

      if (enemy.isShocked) {
        enemy.shockTimer -= deltaTime;
        if (enemy.shockTimer <= 0) {
          enemy.isShocked = false;
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
        if (enemy.isSlowed) speed *= 0.4;
        
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
        this.mana = Math.min(MANA_MAX, this.mana + 30 + this.wave * 5);
      }
    }
  }

  private updateTowers(): void {
    const currentTime = Date.now();

    for (const tower of this.towers) {
      // 检查法力
      tower.isReady = this.mana >= tower.manaCost;

      if (!tower.isReady) continue;

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

      // 发射魔法弹
      if (closestEnemy && currentTime - tower.lastFire >= tower.cooldown) {
        tower.lastFire = currentTime;
        this.mana -= tower.manaCost;

        this.bolts.push({
          id: this.boltIdCounter++,
          x: tower.x,
          y: tower.y,
          targetX: closestEnemy.x,
          targetY: closestEnemy.y,
          damage: tower.damage,
          speed: 8,
          type: tower.type,
          isAlive: true,
          trail: []
        });
      }
    }
  }

  private updateBolts(): void {
    for (const bolt of this.bolts) {
      if (!bolt.isAlive) continue;

      // 添加轨迹
      bolt.trail.push({ x: bolt.x, y: bolt.y, alpha: 1 });
      if (bolt.trail.length > 8) {
        bolt.trail.shift();
      }

      const dx = bolt.targetX - bolt.x;
      const dy = bolt.targetY - bolt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        bolt.isAlive = false;

        // 造成伤害并施加效果
        for (const enemy of this.enemies) {
          if (!enemy.isAlive) continue;

          const edx = enemy.x - bolt.targetX;
          const edy = enemy.y - bolt.targetY;
          const edist = Math.sqrt(edx * edx + edy * edy);

          if (edist < 40) {
            enemy.health -= bolt.damage;

            // 施加特殊效果
            if (bolt.type === 'ice') {
              enemy.isSlowed = true;
              enemy.slowTimer = 2000;
            } else if (bolt.type === 'lightning') {
              enemy.isShocked = true;
              enemy.shockTimer = 1500;
              // 闪电可以在敌人间弹射
              this.chainLightning(enemy, bolt.damage * 0.5, 2);
            }

            if (enemy.health <= 0) {
              enemy.isAlive = false;
              this.score += enemy.reward;
            }
            break;
          }
        }
      } else {
        bolt.x += (dx / dist) * bolt.speed;
        bolt.y += (dy / dist) * bolt.speed;
      }
    }

    // 清理
    this.bolts = this.bolts.filter(b => b.isAlive);
    this.enemies = this.enemies.filter(e => e.isAlive);
  }

  private chainLightning(source: Enemy, damage: number, jumps: number): void {
    if (jumps <= 0) return;

    let closest: Enemy | null = null;
    let closestDist = 100;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive || enemy === source) continue;

      const dx = enemy.x - source.x;
      const dy = enemy.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }

    if (closest) {
      closest.health -= damage;
      closest.isShocked = true;
      closest.shockTimer = 1000;

      if (closest.health <= 0) {
        closest.isAlive = false;
        this.score += closest.reward;
      }

      // 创建闪电视觉效果
      this.bolts.push({
        id: this.boltIdCounter++,
        x: source.x,
        y: source.y,
        targetX: closest.x,
        targetY: closest.y,
        damage: 0,
        speed: 20,
        type: 'lightning',
        isAlive: true,
        trail: []
      });

      this.chainLightning(closest, damage * 0.6, jumps - 1);
    }
  }

  private updateMana(): void {
    this.mana = Math.min(MANA_MAX, this.mana + this.manaRegen);
  }

  tick(): void {
    if (this.isGameOver) return;

    this.lastUpdate = Date.now();

    // 生成敌人
    if (this.isWaveActive && this.enemiesSpawned < this.enemiesPerWave) {
      const currentTime = Date.now();
      const spawnInterval = Math.max(1000 - this.wave * 60, 400);
      if (currentTime - this.lastSpawnTime >= spawnInterval) {
        this.spawnEnemy();
        this.lastSpawnTime = currentTime;
      }
    }

    this.updateMana();
    this.updateEnemies();
    this.updateTowers();
    this.updateBolts();
  }

  reset(): void {
    this.towers = [];
    this.enemies = [];
    this.bolts = [];
    this.score = 0;
    this.lives = 20;
    this.mana = MANA_MAX;
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
