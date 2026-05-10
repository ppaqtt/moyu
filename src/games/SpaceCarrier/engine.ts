export const SPACE_CARRIER_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  CARRIER_WIDTH: 120,
  CARRIER_HEIGHT: 80,
  FIGHTER_SIZE: 20,
  BULLET_SIZE: 6,
  ENEMY_SIZE: 25,
};

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CARRIER_WIDTH,
  CARRIER_HEIGHT,
  FIGHTER_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
} = SPACE_CARRIER_CONSTANTS;

export interface Fighter {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  cooldown: number;
  targetId: number | null;
  type: 'assault' | 'bomber' | 'interceptor';
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  type: 'bullet' | 'missile';
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  type: 'scout' | 'fighter' | 'bomber';
  attackCooldown: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface SpaceCarrierState {
  carrierX: number;
  carrierY: number;
  carrierHealth: number;
  carrierMaxHealth: number;
  fighters: Fighter[];
  enemies: Enemy[];
  bullets: Bullet[];
  explosions: Explosion[];
  score: number;
  wave: number;
  credits: number;
  isGameOver: boolean;
  isPlaying: boolean;
  fighterCapacity: number;
  fighterCount: number;
}

export class SpaceCarrierEngine {
  private carrierX: number;
  private carrierY: number;
  private carrierHealth: number;
  private carrierMaxHealth: number;
  private fighters: Fighter[];
  private enemies: Enemy[];
  private bullets: Bullet[];
  private explosions: Explosion[];
  private score: number;
  private wave: number;
  private credits: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private fighterCapacity: number;
  private lastEnemySpawn: number;
  private enemiesSpawned: number;
  private enemiesToSpawn: number;
  private nextId: number;
  private mouseX: number;
  private mouseY: number;
  private selectedFighterType: 'assault' | 'bomber' | 'interceptor';

  private static readonly FIGHTER_STATS = {
    assault: { health: 50, damage: 15, cooldown: 20, speed: 4, price: 100, color: '#00ffff' },
    bomber: { health: 80, damage: 40, cooldown: 40, speed: 2, price: 200, color: '#ff6600' },
    interceptor: { health: 30, damage: 10, cooldown: 10, speed: 6, price: 150, color: '#ff00ff' },
  };

  private static readonly ENEMY_STATS = {
    scout: { health: 30, damage: 5, speed: 2, reward: 20, color: '#ffff00' },
    fighter: { health: 60, damage: 10, speed: 1.5, reward: 40, color: '#ff4444' },
    bomber: { health: 100, damage: 20, speed: 1, reward: 60, color: '#ff8800' },
  };

  constructor() {
    this.carrierX = CANVAS_WIDTH / 2;
    this.carrierY = CANVAS_HEIGHT - 100;
    this.carrierHealth = 500;
    this.carrierMaxHealth = 500;
    this.fighters = [];
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.credits = 300;
    this.isGameOver = false;
    this.isPlaying = false;
    this.fighterCapacity = 10;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.nextId = 1;
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT / 2;
    this.selectedFighterType = 'assault';
  }

  getState(): SpaceCarrierState {
    return {
      carrierX: this.carrierX,
      carrierY: this.carrierY,
      carrierHealth: this.carrierHealth,
      carrierMaxHealth: this.carrierMaxHealth,
      fighters: this.fighters.map(f => ({ ...f })),
      enemies: this.enemies.map(e => ({ ...e })),
      bullets: this.bullets.map(b => ({ ...b })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      wave: this.wave,
      credits: this.credits,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      fighterCapacity: this.fighterCapacity,
      fighterCount: this.fighters.length,
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getFighterPrice(type: 'assault' | 'bomber' | 'interceptor'): number {
    return SpaceCarrierEngine.FIGHTER_STATS[type].price;
  }

  getSelectedFighterType(): 'assault' | 'bomber' | 'interceptor' {
    return this.selectedFighterType;
  }

  setSelectedFighterType(type: 'assault' | 'bomber' | 'interceptor'): void {
    this.selectedFighterType = type;
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.carrierX = CANVAS_WIDTH / 2;
    this.carrierY = CANVAS_HEIGHT - 100;
    this.carrierHealth = 500;
    this.fighters = [];
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.credits = 300;
    this.isGameOver = false;
    this.isPlaying = false;
    this.fighterCapacity = 10;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
  }

  startWave(): void {
    this.wave++;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 3 + this.wave * 2;
    this.lastEnemySpawn = Date.now();
    this.credits += 50 + this.wave * 20;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  launchFighter(): boolean {
    if (!this.isPlaying || this.isGameOver) return false;
    if (this.fighters.length >= this.fighterCapacity) return false;
    if (this.credits < SpaceCarrierEngine.FIGHTER_STATS[this.selectedFighterType].price) return false;

    const stats = SpaceCarrierEngine.FIGHTER_STATS[this.selectedFighterType];
    this.credits -= stats.price;

    const angle = Math.atan2(this.mouseY - this.carrierY, this.mouseX - this.carrierX);
    const launchOffset = 60;

    this.fighters.push({
      id: this.nextId++,
      x: this.carrierX + Math.cos(angle) * launchOffset,
      y: this.carrierY + Math.sin(angle) * launchOffset,
      vx: Math.cos(angle) * stats.speed,
      vy: Math.sin(angle) * stats.speed,
      angle,
      health: stats.health,
      maxHealth: stats.health,
      cooldown: 0,
      targetId: null,
      type: this.selectedFighterType,
    });
    return true;
  }

  recallFighter(id: number): void {
    const index = this.fighters.findIndex(f => f.id === id);
    if (index !== -1) {
      this.credits += Math.floor(SpaceCarrierEngine.FIGHTER_STATS[this.fighters[index].type].price * 0.5);
      this.fighters.splice(index, 1);
    }
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 20 + size / 3,
      size,
    });
  }

  private spawnEnemy(): void {
    const rand = Math.random();
    let type: 'scout' | 'fighter' | 'bomber';
    if (rand < 0.4) type = 'scout';
    else if (rand < 0.75) type = 'fighter';
    else type = 'bomber';

    const stats = SpaceCarrierEngine.ENEMY_STATS[type];
    const healthMult = 1 + (this.wave - 1) * 0.15;

    const side = Math.floor(Math.random() * 3);
    let x: number, y: number;
    if (side === 0) {
      x = Math.random() * CANVAS_WIDTH;
      y = -ENEMY_SIZE;
    } else if (side === 1) {
      x = -ENEMY_SIZE;
      y = Math.random() * (CANVAS_HEIGHT / 2);
    } else {
      x = CANVAS_WIDTH + ENEMY_SIZE;
      y = Math.random() * (CANVAS_HEIGHT / 2);
    }

    this.enemies.push({
      id: this.nextId++,
      x,
      y,
      vx: 0,
      vy: stats.speed,
      health: stats.health * healthMult,
      maxHealth: stats.health * healthMult,
      type,
      attackCooldown: 0,
    });
    this.enemiesSpawned++;
  }

  private findTarget(fighter: Fighter): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - fighter.x, enemy.y - fighter.y);
      if (dist < 250 && dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();

    this.carrierX = Math.max(CARRIER_WIDTH / 2, Math.min(CANVAS_WIDTH - CARRIER_WIDTH / 2, this.mouseX));
    this.carrierY = Math.max(CARRIER_HEIGHT / 2, Math.min(CANVAS_HEIGHT - CARRIER_HEIGHT / 2, this.mouseY));

    if (this.wave > 0 && this.enemiesSpawned < this.enemiesToSpawn) {
      const spawnInterval = Math.max(800, 2000 - this.wave * 100);
      if (now - this.lastEnemySpawn > spawnInterval) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }
    }

    if (this.wave === 0 || (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0)) {
      if (now - this.lastEnemySpawn > 2000) {
        this.startWave();
      }
    }

    for (let i = this.fighters.length - 1; i >= 0; i--) {
      const fighter = this.fighters[i];
      fighter.cooldown = Math.max(0, fighter.cooldown - 1);

      const target = this.findTarget(fighter);
      if (target) {
        fighter.targetId = target.id;
        const dx = target.x - fighter.x;
        const dy = target.y - fighter.y;
        fighter.angle = Math.atan2(dy, dx);

        const stats = SpaceCarrierEngine.FIGHTER_STATS[fighter.type];
        const targetDist = Math.hypot(dx, dy);

        if (targetDist > 100) {
          fighter.vx = (dx / targetDist) * stats.speed;
          fighter.vy = (dy / targetDist) * stats.speed;
        } else {
          fighter.vx *= 0.95;
          fighter.vy *= 0.95;
        }

        if (fighter.cooldown === 0 && targetDist < 200) {
          const bulletSpeed = 10;
          this.bullets.push({
            id: this.nextId++,
            x: fighter.x,
            y: fighter.y,
            vx: Math.cos(fighter.angle) * bulletSpeed,
            vy: Math.sin(fighter.angle) * bulletSpeed,
            damage: stats.damage,
            fromPlayer: true,
            type: fighter.type === 'bomber' ? 'missile' : 'bullet',
          });
          fighter.cooldown = stats.cooldown;
        }
      } else {
        fighter.targetId = null;
        const homeAngle = Math.atan2(this.carrierY - fighter.y, this.carrierX - fighter.x);
        const distToHome = Math.hypot(this.carrierX - fighter.x, this.carrierY - fighter.y);

        if (distToHome > 80) {
          fighter.vx += Math.cos(homeAngle) * 0.1;
          fighter.vy += Math.sin(homeAngle) * 0.1;
          fighter.angle = Math.atan2(fighter.vy, fighter.vx);
        }
      }

      fighter.x += fighter.vx;
      fighter.y += fighter.vy;
      fighter.x = Math.max(0, Math.min(CANVAS_WIDTH, fighter.x));
      fighter.y = Math.max(0, Math.min(CANVAS_HEIGHT, fighter.y));

      if (Math.hypot(this.carrierX - fighter.x, this.carrierY - fighter.y) < 30) {
        this.fighters.splice(i, 1);
        continue;
      }
    }

    for (const enemy of this.enemies) {
      const dx = this.carrierX - enemy.x;
      const dy = this.carrierY - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 100) {
        enemy.vx = (dx / dist) * SpaceCarrierEngine.ENEMY_STATS[enemy.type].speed;
        enemy.vy = (dy / dist) * SpaceCarrierEngine.ENEMY_STATS[enemy.type].speed;
      } else {
        enemy.vx *= 0.98;
        enemy.vy *= 0.98;
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      enemy.x = Math.max(0, Math.min(CANVAS_WIDTH, enemy.x));
      enemy.y = Math.max(0, Math.min(CANVAS_HEIGHT, enemy.y));

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - 1);
      if (enemy.attackCooldown === 0 && dist < 300) {
        const angle = Math.atan2(dy, dx);
        this.bullets.push({
          id: this.nextId++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          damage: SpaceCarrierEngine.ENEMY_STATS[enemy.type].damage,
          fromPlayer: false,
          type: 'bullet',
        });
        enemy.attackCooldown = 60;
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

      if (bullet.fromPlayer) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
          if (dist < ENEMY_SIZE) {
            enemy.health -= bullet.damage;
            if (bullet.type === 'missile') {
              this.createExplosion(bullet.x, bullet.y, 30);
            }
            this.bullets.splice(i, 1);
            if (enemy.health <= 0) {
              this.createExplosion(enemy.x, enemy.y, 40);
              this.score += SpaceCarrierEngine.ENEMY_STATS[enemy.type].reward * 10;
              this.credits += SpaceCarrierEngine.ENEMY_STATS[enemy.type].reward;
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      } else {
        const dist = Math.hypot(this.carrierX - bullet.x, this.carrierY - bullet.y);
        if (dist < CARRIER_WIDTH / 2) {
          this.carrierHealth -= bullet.damage;
          this.createExplosion(bullet.x, bullet.y, 20);
          this.bullets.splice(i, 1);
          if (this.carrierHealth <= 0) {
            this.isGameOver = true;
          }
        }
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
