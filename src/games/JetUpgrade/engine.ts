export const JET_UPGRADE_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 800,
  PLAYER_SIZE: 40,
  BULLET_SIZE: 8,
  ENEMY_SIZE: 30,
  INITIAL_MONEY: 0,
  INITIAL_LIVES: 3,
};

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
  INITIAL_MONEY,
  INITIAL_LIVES,
} = JET_UPGRADE_CONSTANTS;

export interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  speed: number;
  bulletCount: number;
  piercing: number;
  missileEnabled: boolean;
  shieldEnabled: boolean;
  level: number;
  experience: number;
  experienceToNext: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  piercing: number;
  type: 'normal' | 'missile';
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  type: 'basic' | 'fast' | 'tank' | 'boss';
  reward: number;
  shootCooldown: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'damage' | 'speed' | 'shield';
  width: number;
  height: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface JetUpgradeState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  score: number;
  wave: number;
  money: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export type UpgradeType = 'damage' | 'fireRate' | 'speed' | 'multiShot' | 'piercing' | 'missile' | 'shield';

export const UPGRADE_COSTS: Record<UpgradeType, number[]> = {
  damage: [100, 250, 500, 1000, 2000],
  fireRate: [100, 250, 500, 1000, 2000],
  speed: [80, 200, 400, 800, 1600],
  multiShot: [200, 500, 1000, 2000, 0],
  piercing: [150, 350, 700, 1500, 0],
  missile: [300, 600, 1200, 0, 0],
  shield: [250, 500, 1000, 0, 0],
};

export const UPGRADE_NAMES: Record<UpgradeType, string> = {
  damage: '伤害',
  fireRate: '射速',
  speed: '速度',
  multiShot: '多发',
  piercing: '穿透',
  missile: '导弹',
  shield: '护盾',
};

export class JetUpgradeEngine {
  private player: Player;
  private bullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private explosions: Explosion[];
  private score: number;
  private wave: number;
  private money: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastShot: number;
  private lastEnemySpawn: number;
  private enemiesSpawned: number;
  private enemiesToSpawn: number;
  private upgrades: Record<UpgradeType, number>;
  private lastBossSpawn: number;
  private hasBossThisWave: boolean;

  constructor() {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.upgrades = { damage: 0, fireRate: 0, speed: 0, multiShot: 0, piercing: 0, missile: 0, shield: 0 };
    this.lastBossSpawn = 0;
    this.hasBossThisWave = false;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      health: 100,
      maxHealth: 100,
      damage: 10,
      fireRate: 200,
      bulletSpeed: 12,
      speed: 5,
      bulletCount: 1,
      piercing: 0,
      missileEnabled: false,
      shieldEnabled: false,
      level: 1,
      experience: 0,
      experienceToNext: 100,
    };
  }

  getState(): JetUpgradeState {
    return {
      player: { ...this.player },
      bullets: this.bullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      wave: this.wave,
      money: this.money,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getUpgrades(): Record<UpgradeType, number> {
    return { ...this.upgrades };
  }

  getUpgradeCost(type: UpgradeType): number {
    const level = this.upgrades[type];
    if (level >= UPGRADE_COSTS[type].length) return Infinity;
    return UPGRADE_COSTS[type][level];
  }

  purchaseUpgrade(type: UpgradeType): boolean {
    if (!this.isPlaying || this.isGameOver) return false;
    const cost = this.getUpgradeCost(type);
    if (this.money < cost) return false;
    if (UPGRADE_COSTS[type].length > 0 && this.upgrades[type] >= UPGRADE_COSTS[type].length) return false;

    this.money -= cost;
    this.upgrades[type]++;

    switch (type) {
      case 'damage':
        this.player.damage += 5;
        break;
      case 'fireRate':
        this.player.fireRate = Math.max(50, this.player.fireRate - 20);
        break;
      case 'speed':
        this.player.speed += 1;
        break;
      case 'multiShot':
        this.player.bulletCount++;
        break;
      case 'piercing':
        this.player.piercing++;
        break;
      case 'missile':
        this.player.missileEnabled = true;
        break;
      case 'shield':
        this.player.shieldEnabled = true;
        this.player.maxHealth += 50;
        this.player.health = this.player.maxHealth;
        break;
    }
    return true;
  }

  start(): void {
    this.isPlaying = true;
    this.startWave();
  }

  reset(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.money = INITIAL_MONEY;
    this.lives = INITIAL_LIVES;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.upgrades = { damage: 0, fireRate: 0, speed: 0, multiShot: 0, piercing: 0, missile: 0, shield: 0 };
    this.lastBossSpawn = 0;
    this.hasBossThisWave = false;
  }

  private startWave(): void {
    this.wave++;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 3 + this.wave * 2;
    this.hasBossThisWave = this.wave % 3 === 0;
    this.lastEnemySpawn = Date.now();
    this.lastBossSpawn = Date.now();
  }

  setMousePosition(x: number, y: number): void {
    this.player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, x));
    this.player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, y));
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastShot < this.player.fireRate) return;
    this.lastShot = now;

    const bulletCount = this.player.bulletCount;
    const spreadAngle = 0.15;
    const startAngle = -(bulletCount - 1) * spreadAngle / 2;

    for (let i = 0; i < bulletCount; i++) {
      const angle = -Math.PI / 2 + startAngle + i * spreadAngle;
      this.bullets.push({
        x: this.player.x,
        y: this.player.y - PLAYER_SIZE / 2,
        vx: Math.cos(angle) * this.player.bulletSpeed,
        vy: Math.sin(angle) * this.player.bulletSpeed,
        damage: this.player.damage,
        piercing: this.player.piercing,
        type: 'normal',
      });
    }

    if (this.player.missileEnabled && now - this.lastShot > 1000) {
      this.bullets.push({
        x: this.player.x - 15,
        y: this.player.y,
        vx: 0,
        vy: -this.player.bulletSpeed * 0.8,
        damage: this.player.damage * 2,
        piercing: 3,
        type: 'missile',
      });
      this.bullets.push({
        x: this.player.x + 15,
        y: this.player.y,
        vx: 0,
        vy: -this.player.bulletSpeed * 0.8,
        damage: this.player.damage * 2,
        piercing: 3,
        type: 'missile',
      });
    }
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 20 + size / 5,
      size,
    });
  }

  private spawnEnemy(): void {
    const rand = Math.random();
    let type: 'basic' | 'fast' | 'tank';
    let health = 50 + this.wave * 10;
    let reward = 10 + this.wave * 2;
    let speed = 1 + this.wave * 0.1;
    let size = ENEMY_SIZE;

    if (rand < 0.5) {
      type = 'basic';
    } else if (rand < 0.8) {
      type = 'fast';
      health *= 0.7;
      speed *= 1.8;
      size *= 0.8;
    } else {
      type = 'tank';
      health *= 3;
      speed *= 0.5;
      size *= 1.3;
      reward *= 2;
    }

    this.enemies.push({
      x: Math.random() * (CANVAS_WIDTH - ENEMY_SIZE * 2) + ENEMY_SIZE,
      y: -ENEMY_SIZE,
      vx: 0,
      vy: speed,
      health,
      maxHealth: health,
      type,
      reward,
      shootCooldown: 0,
    });
    this.enemiesSpawned++;
  }

  private spawnBoss(): void {
    const bossHealth = 200 + this.wave * 100;
    this.enemies.push({
      x: CANVAS_WIDTH / 2,
      y: -60,
      vx: 0,
      vy: 0.5,
      health: bossHealth,
      maxHealth: bossHealth,
      type: 'boss',
      reward: 200 + this.wave * 50,
      shootCooldown: 0,
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUp['type'][] = ['health', 'damage', 'speed', 'shield'];
    const weights = [0.35, 0.25, 0.25, 0.15];
    const rand = Math.random();
    let cumulative = 0;
    let type: PowerUp['type'] = 'health';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      type,
      width: 30,
      height: 30,
    });
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        this.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
        if (dist < ENEMY_SIZE) {
          enemy.health -= bullet.damage;
          if (bullet.type === 'missile') {
            this.createExplosion(bullet.x, bullet.y, 30);
          }
          if (bullet.piercing > 0) {
            bullet.piercing--;
          } else {
            this.bullets.splice(i, 1);
          }
          if (enemy.health <= 0) {
            this.createExplosion(enemy.x, enemy.y, 40);
            this.score += enemy.reward * 10;
            this.money += enemy.reward;
            this.player.experience += enemy.reward;
            if (this.player.experience >= this.player.experienceToNext) {
              this.player.level++;
              this.player.experience -= this.player.experienceToNext;
              this.player.experienceToNext = Math.floor(this.player.experienceToNext * 1.5);
              this.money += 50 + this.player.level * 10;
            }
            if (Math.random() < 0.2) {
              this.spawnPowerUp(enemy.x, enemy.y);
            }
            this.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    for (const enemy of this.enemies) {
      enemy.y += enemy.vy;
      if (enemy.type === 'boss') {
        enemy.x += Math.sin(now / 1000) * 2;
        enemy.x = Math.max(ENEMY_SIZE, Math.min(CANVAS_WIDTH - ENEMY_SIZE, enemy.x));
      }

      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - 1);
      if (enemy.shootCooldown === 0 && enemy.y > 50) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        this.bullets.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          damage: 10 + this.wave * 2,
          piercing: 0,
          type: 'normal',
        });
        enemy.shootCooldown = enemy.type === 'boss' ? 30 : 60;
      }

      if (enemy.y > CANVAS_HEIGHT + ENEMY_SIZE) {
        this.lives--;
        if (this.lives <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 1.5;

      if (powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(this.player.x - powerUp.x - powerUp.width / 2, this.player.y - powerUp.y - powerUp.height / 2);
      if (dist < PLAYER_SIZE) {
        switch (powerUp.type) {
          case 'health':
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
            break;
          case 'damage':
            this.player.damage += 3;
            break;
          case 'speed':
            this.player.speed += 0.5;
            break;
          case 'shield':
            this.money += 100;
            break;
        }
        this.powerUps.splice(i, 1);
      }
    }

    if (this.enemies.length === 0 && this.enemiesSpawned >= this.enemiesToSpawn) {
      if (this.hasBossThisWave && now - this.lastBossSpawn > 5000) {
        this.spawnBoss();
        this.lastBossSpawn = now;
        this.hasBossThisWave = false;
      } else if (!this.hasBossThisWave) {
        this.startWave();
      }
    } else if (this.enemiesSpawned < this.enemiesToSpawn) {
      const spawnInterval = Math.max(500, 1500 - this.wave * 50);
      if (now - this.lastEnemySpawn > spawnInterval) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }
  }
}
