// 直升机逃生游戏引擎
// Helicopter Escape Game Engine

export const NEON_COLORS = {
  primary: '#00f5ff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  danger: '#ff3366',
  success: '#00ff88',
  warning: '#ffaa00',
  background: '#0a0a1a',
  surface: '#1a1a2e',
  text: '#ffffff',
  textMuted: '#8888aa',
  sky: '#1a3a5c',
  ground: '#2d5016',
  helicopter: '#ff6600',
  enemy: '#ff0000',
  bullet: '#ffff00',
  fuel: '#00ff00'
};

export interface HelicopterStats {
  health: number;
  fuel: number;
  altitude: number;
  speed: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy';
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: 'drone' | 'jet' | 'missile' | 'tank';
  health: number;
  speed: number;
  lastShot: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'health' | 'fuel' | 'ammo' | 'shield';
  collected: boolean;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'building' | 'mountain' | 'cloud';
  width: number;
  height: number;
}

export interface GameState {
  stats: HelicopterStats;
  position: { x: number; y: number };
  bullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  obstacles: Obstacle[];
  score: number;
  distance: number;
  wave: number;
  gameOver: boolean;
  victory: boolean;
  shieldActive: boolean;
  shieldTime: number;
}

export interface GameConfig {
  gameWidth: number;
  gameHeight: number;
  targetDistance: number;
  enemySpawnRate: number;
}

const DEFAULT_CONFIG: GameConfig = {
  gameWidth: 800,
  gameHeight: 600,
  targetDistance: 10000, // 目标距离
  enemySpawnRate: 2000 // 毫秒
};

export class HelicopterEscapeEngine {
  private state: GameState;
  private config: GameConfig;
  private lastUpdate: number;
  private lastEnemySpawn: number;
  private lastPowerUpSpawn: number;
  private keys: Set<string> = new Set();
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onGameOver?: (score: number) => void;
    onVictory?: (score: number) => void;
  } = {};

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
    this.lastEnemySpawn = Date.now();
    this.lastPowerUpSpawn = Date.now();
  }

  private initializeGame(): GameState {
    return {
      stats: {
        health: 100,
        fuel: 100,
        altitude: 100,
        speed: 0
      },
      position: { x: 100, y: this.config.gameHeight / 2 },
      bullets: [],
      enemies: [],
      powerUps: [],
      obstacles: this.generateObstacles(),
      score: 0,
      distance: 0,
      wave: 1,
      gameOver: false,
      victory: false,
      shieldActive: false,
      shieldTime: 0
    };
  }

  private generateObstacles(): Obstacle[] {
    const obstacles: Obstacle[] = [];
    
    // 生成地面建筑
    for (let i = 0; i < 20; i++) {
      obstacles.push({
        id: `building_${i}`,
        x: 300 + i * 400 + Math.random() * 200,
        y: this.config.gameHeight - 50 - Math.random() * 100,
        type: 'building',
        width: 50 + Math.random() * 100,
        height: 100 + Math.random() * 200
      });
    }

    // 生成山脉
    for (let i = 0; i < 10; i++) {
      obstacles.push({
        id: `mountain_${i}`,
        x: 500 + i * 800 + Math.random() * 300,
        y: this.config.gameHeight - 100,
        type: 'mountain',
        width: 200 + Math.random() * 300,
        height: 150 + Math.random() * 200
      });
    }

    return obstacles;
  }

  public start(): void {
    this.lastUpdate = Date.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    if (this.state.gameOver || this.state.victory) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    this.update(deltaTime);

    requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // 处理输入
    this.handleInput(deltaTime);

    // 更新位置
    this.state.distance += this.state.stats.speed * deltaTime * 10;
    this.state.stats.speed = Math.min(200, this.state.stats.speed + deltaTime * 10);

    // 消耗燃料
    this.state.stats.fuel = Math.max(0, this.state.stats.fuel - deltaTime * 2);

    // 重力影响
    if (!this.keys.has('ArrowUp') && !this.keys.has('w')) {
      this.state.position.y += 50 * deltaTime;
    }

    // 边界检查
    this.state.position.y = Math.max(50, Math.min(this.config.gameHeight - 50, this.state.position.y));

    // 生成敌人
    const now = Date.now();
    const spawnInterval = Math.max(500, this.config.enemySpawnRate - this.state.wave * 200);
    if (now - this.lastEnemySpawn > spawnInterval) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    // 生成道具
    if (now - this.lastPowerUpSpawn > 8000) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = now;
    }

    // 更新子弹
    this.updateBullets(deltaTime);

    // 更新敌人
    this.updateEnemies(deltaTime);

    // 更新道具
    this.updatePowerUps();

    // 更新护盾
    if (this.state.shieldActive) {
      this.state.shieldTime -= deltaTime;
      if (this.state.shieldTime <= 0) {
        this.state.shieldActive = false;
      }
    }

    // 碰撞检测
    this.checkCollisions();

    // 检查游戏结束
    if (this.state.stats.health <= 0 || this.state.stats.fuel <= 0) {
      this.state.gameOver = true;
      this.callbacks.onGameOver?.(this.state.score);
    }

    // 检查胜利条件
    if (this.state.distance >= this.config.targetDistance) {
      this.state.victory = true;
      this.state.score += 5000;
      this.callbacks.onVictory?.(this.state.score);
    }

    // 更新波次
    this.state.wave = Math.floor(this.state.distance / 1000) + 1;

    this.callbacks.onStateChange?.(this.state);
  }

  private handleInput(deltaTime: number): void {
    const moveSpeed = 200;

    if (this.keys.has('ArrowUp') || this.keys.has('w')) {
      this.state.position.y -= moveSpeed * deltaTime;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s')) {
      this.state.position.y += moveSpeed * deltaTime;
    }
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
      this.state.position.x -= moveSpeed * deltaTime;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d')) {
      this.state.position.x += moveSpeed * deltaTime;
    }

    // 保持x位置在合理范围内
    this.state.position.x = Math.max(50, Math.min(200, this.state.position.x));
  }

  private spawnEnemy(): void {
    const types: Enemy['type'][] = ['drone', 'jet', 'missile', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)];

    const enemyStats: Record<Enemy['type'], { health: number; speed: number; y: number }> = {
      drone: { health: 20, speed: 150, y: 100 + Math.random() * 300 },
      jet: { health: 40, speed: 250, y: 50 + Math.random() * 200 },
      missile: { health: 10, speed: 350, y: this.state.position.y },
      tank: { health: 60, speed: 80, y: this.config.gameHeight - 80 }
    };

    const stats = enemyStats[type];

    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      x: this.config.gameWidth + 50,
      y: stats.y,
      type,
      health: stats.health + this.state.wave * 5,
      speed: stats.speed,
      lastShot: Date.now()
    };

    this.state.enemies.push(enemy);
  }

  private spawnPowerUp(): void {
    const types: PowerUp['type'][] = ['health', 'fuel', 'ammo', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp: PowerUp = {
      id: `powerup_${Date.now()}_${Math.random()}`,
      x: this.config.gameWidth + 50,
      y: 100 + Math.random() * 300,
      type,
      collected: false
    };

    this.state.powerUps.push(powerUp);
  }

  private updateBullets(deltaTime: number): void {
    this.state.bullets = this.state.bullets.filter(bullet => {
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;

      // 移除超出边界的子弹
      return bullet.x > 0 && bullet.x < this.config.gameWidth &&
             bullet.y > 0 && bullet.y < this.config.gameHeight;
    });
  }

  private updateEnemies(deltaTime: number): void {
    const now = Date.now();

    this.state.enemies = this.state.enemies.filter(enemy => {
      // 移动敌人
      enemy.x -= enemy.speed * deltaTime;

      // 敌人射击
      if (now - enemy.lastShot > 2000 && enemy.type !== 'missile') {
        this.enemyShoot(enemy);
        enemy.lastShot = now;
      }

      // 导弹追踪
      if (enemy.type === 'missile') {
        const dy = this.state.position.y - enemy.y;
        enemy.y += Math.sign(dy) * 100 * deltaTime;
      }

      // 移除超出边界的敌人
      return enemy.x > -100 && enemy.health > 0;
    });
  }

  private enemyShoot(enemy: Enemy): void {
    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: enemy.x,
      y: enemy.y,
      vx: -300,
      vy: 0,
      owner: 'enemy'
    };
    this.state.bullets.push(bullet);
  }

  private updatePowerUps(): void {
    this.state.powerUps = this.state.powerUps.filter(powerUp => {
      powerUp.x -= 100 * 0.016; // 随背景移动
      return powerUp.x > -50 && !powerUp.collected;
    });
  }

  private checkCollisions(): void {
    const helicopter = {
      x: this.state.position.x,
      y: this.state.position.y,
      width: 40,
      height: 30
    };

    // 检查子弹碰撞
    this.state.bullets = this.state.bullets.filter(bullet => {
      // 检查与敌人的碰撞
      if (bullet.owner === 'player') {
        const hitEnemy = this.state.enemies.find(enemy =>
          Math.abs(bullet.x - enemy.x) < 30 &&
          Math.abs(bullet.y - enemy.y) < 20
        );

        if (hitEnemy) {
          hitEnemy.health -= 10;
          if (hitEnemy.health <= 0) {
            this.state.score += hitEnemy.type === 'tank' ? 100 : 
                               hitEnemy.type === 'jet' ? 75 : 
                               hitEnemy.type === 'missile' ? 50 : 25;
          }
          return false;
        }
      }

      // 检查与直升机的碰撞
      if (bullet.owner === 'enemy') {
        if (Math.abs(bullet.x - helicopter.x) < 20 &&
            Math.abs(bullet.y - helicopter.y) < 15) {
          if (!this.state.shieldActive) {
            this.state.stats.health -= 10;
          }
          return false;
        }
      }

      return true;
    });

    // 检查敌人碰撞
    this.state.enemies.forEach(enemy => {
      if (Math.abs(enemy.x - helicopter.x) < 30 &&
          Math.abs(enemy.y - helicopter.y) < 25) {
        if (!this.state.shieldActive) {
          this.state.stats.health -= 20;
        }
        enemy.health = 0;
      }
    });

    // 检查道具碰撞
    this.state.powerUps.forEach(powerUp => {
      if (!powerUp.collected &&
          Math.abs(powerUp.x - helicopter.x) < 30 &&
          Math.abs(powerUp.y - helicopter.y) < 25) {
        powerUp.collected = true;
        this.applyPowerUp(powerUp.type);
      }
    });

    // 检查障碍物碰撞
    this.state.obstacles.forEach(obstacle => {
      const relativeX = obstacle.x - this.state.distance;
      if (relativeX > -100 && relativeX < this.config.gameWidth + 100) {
        if (Math.abs(relativeX - helicopter.x) < obstacle.width / 2 + 20 &&
            Math.abs(obstacle.y - helicopter.y) < obstacle.height / 2 + 15) {
          if (!this.state.shieldActive) {
            this.state.stats.health -= 30;
          }
        }
      }
    });
  }

  private applyPowerUp(type: PowerUp['type']): void {
    switch (type) {
      case 'health':
        this.state.stats.health = Math.min(100, this.state.stats.health + 30);
        break;
      case 'fuel':
        this.state.stats.fuel = Math.min(100, this.state.stats.fuel + 40);
        break;
      case 'ammo':
        // 弹药已满，加分
        this.state.score += 100;
        break;
      case 'shield':
        this.state.shieldActive = true;
        this.state.shieldTime = 5; // 5秒护盾
        break;
    }
  }

  // 玩家射击
  public shoot(): void {
    if (this.state.gameOver || this.state.victory) return;

    const bullet: Bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: this.state.position.x + 20,
      y: this.state.position.y,
      vx: 500,
      vy: 0,
      owner: 'player'
    };

    this.state.bullets.push(bullet);
    this.callbacks.onStateChange?.(this.state);
  }

  // 设置按键状态
  public setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key);
    } else {
      this.keys.delete(key);
    }
  }

  // 获取游戏状态
  public getState(): GameState {
    return { ...this.state };
  }

  // 设置回调
  public onStateChange(callback: (state: GameState) => void): void {
    this.callbacks.onStateChange = callback;
  }

  public onGameOver(callback: (score: number) => void): void {
    this.callbacks.onGameOver = callback;
  }

  public onVictory(callback: (score: number) => void): void {
    this.callbacks.onVictory = callback;
  }

  // 保存游戏
  public save(): string {
    return JSON.stringify(this.state);
  }

  // 加载游戏
  public load(data: string): void {
    this.state = JSON.parse(data);
  }

  // 重置游戏
  public reset(): void {
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
    this.lastEnemySpawn = Date.now();
    this.lastPowerUpSpawn = Date.now();
    this.keys.clear();
  }
}

export default HelicopterEscapeEngine;
