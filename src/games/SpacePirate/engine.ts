export const SPACE_PIRATE_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_SIZE: 30,
  ENEMY_SIZE: 25,
  BULLET_SIZE: 6,
  INITIAL_LIVES: 3,
};

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  ENEMY_SIZE,
  BULLET_SIZE,
  INITIAL_LIVES,
} = SPACE_PIRATE_CONSTANTS;

export interface Ship {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  cooldown: number;
  type: 'player' | 'pirate' | 'escort';
  loot: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
}

export interface Loot {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: 'gold' | 'gem' | 'health';
  value: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface SpacePirateState {
  player: Ship;
  enemies: Ship[];
  bullets: Bullet[];
  loots: Loot[];
  explosions: Explosion[];
  score: number;
  wave: number;
  lives: number;
  gold: number;
  gems: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class SpacePirateEngine {
  private player: Ship;
  private enemies: Ship[];
  private bullets: Bullet[];
  private loots: Loot[];
  private explosions: Explosion[];
  private score: number;
  private wave: number;
  private lives: number;
  private gold: number;
  private gems: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastShot: number;
  private lastEnemySpawn: number;
  private enemiesSpawned: number;
  private enemiesToSpawn: number;
  private nextId: number;
  private keysPressed: Set<string>;
  private invincibleTime: number;

  constructor() {
    this.player = this.createPlayer();
    this.enemies = [];
    this.bullets = [];
    this.loots = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.lives = INITIAL_LIVES;
    this.gold = 0;
    this.gems = 0;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.nextId = 1;
    this.keysPressed = new Set();
    this.invincibleTime = 0;
  }

  private createPlayer(): Ship {
    return {
      id: 0,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      maxHealth: 100,
      cooldown: 0,
      type: 'player',
      loot: 0,
    };
  }

  getState(): SpacePirateState {
    return {
      player: { ...this.player },
      enemies: this.enemies.map(e => ({ ...e })),
      bullets: this.bullets.map(b => ({ ...b })),
      loots: this.loots.map(l => ({ ...l })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      wave: this.wave,
      lives: this.lives,
      gold: this.gold,
      gems: this.gems,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.enemies = [];
    this.bullets = [];
    this.loots = [];
    this.explosions = [];
    this.score = 0;
    this.wave = 0;
    this.lives = INITIAL_LIVES;
    this.gold = 0;
    this.gems = 0;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastShot = 0;
    this.lastEnemySpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 0;
    this.invincibleTime = 0;
  }

  startWave(): void {
    this.wave++;
    this.enemiesSpawned = 0;
    this.enemiesToSpawn = 2 + this.wave * 2;
    this.lastEnemySpawn = Date.now();
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.keysPressed.add(key);
    } else {
      this.keysPressed.delete(key);
    }
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastShot < 150) return;
    this.lastShot = now;

    const angle = this.player.angle;
    const speed = 12;
    this.bullets.push({
      id: this.nextId++,
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: 20,
      fromPlayer: true,
    });
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

  private spawnLoot(x: number, y: number, ship: Ship): void {
    const rand = Math.random();
    let type: 'gold' | 'gem' | 'health';
    let value: number;

    if (rand < 0.6) {
      type = 'gold';
      value = 10 + Math.floor(ship.loot * 0.5);
    } else if (rand < 0.9) {
      type = 'gem';
      value = 5 + Math.floor(ship.loot * 0.2);
    } else {
      type = 'health';
      value = 20;
    }

    this.loots.push({
      id: this.nextId++,
      x: x + (Math.random() - 0.5) * 20,
      y,
      vy: 1 + Math.random(),
      type,
      value,
    });
  }

  private spawnEnemy(): void {
    const rand = Math.random();
    let type: 'pirate' | 'escort';
    let health: number;
    let speed: number;
    let loot: number;
    let size: number;

    if (rand < 0.7) {
      type = 'pirate';
      health = 60 + this.wave * 15;
      speed = 1.5 + this.wave * 0.1;
      loot = 20 + this.wave * 5;
      size = ENEMY_SIZE;
    } else {
      type = 'escort';
      health = 120 + this.wave * 25;
      speed = 1 + this.wave * 0.05;
      loot = 50 + this.wave * 10;
      size = ENEMY_SIZE * 1.3;
    }

    const side = Math.floor(Math.random() * 3);
    let x: number, y: number;
    if (side === 0) {
      x = Math.random() * CANVAS_WIDTH;
      y = -size;
    } else if (side === 1) {
      x = -size;
      y = Math.random() * CANVAS_HEIGHT * 0.5;
    } else {
      x = CANVAS_WIDTH + size;
      y = Math.random() * CANVAS_HEIGHT * 0.5;
    }

    this.enemies.push({
      id: this.nextId++,
      x,
      y,
      vx: 0,
      vy: speed,
      angle: Math.PI / 2,
      health,
      maxHealth: health,
      cooldown: 0,
      type,
      loot,
    });
    this.enemiesSpawned++;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();

    const speed = 5;
    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      this.player.vy = -speed;
    } else if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      this.player.vy = speed;
    } else {
      this.player.vy *= 0.9;
    }

    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      this.player.vx = -speed;
    } else if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      this.player.vx = speed;
    } else {
      this.player.vx *= 0.9;
    }

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, this.player.x));
    this.player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, this.player.y));

    let targetX = this.player.x;
    let targetY = this.player.y - 50;
    if (this.keysPressed.has('w')) targetY = this.player.y - 100;
    else if (this.keysPressed.has('s')) targetY = this.player.y + 100;
    if (this.keysPressed.has('a')) targetX = this.player.x - 100;
    else if (this.keysPressed.has('d')) targetX = this.player.x + 100;

    this.player.angle = Math.atan2(targetY - this.player.y, targetX - this.player.x) + Math.PI / 2;

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    if (this.wave === 0 || (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0)) {
      if (now - this.lastEnemySpawn > 2000) {
        this.startWave();
      }
    } else if (this.enemiesSpawned < this.enemiesToSpawn) {
      const spawnInterval = Math.max(1000, 2500 - this.wave * 150);
      if (now - this.lastEnemySpawn > spawnInterval) {
        this.spawnEnemy();
        this.lastEnemySpawn = now;
      }
    }

    for (const enemy of this.enemies) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      enemy.angle = Math.atan2(dy, dx) + Math.PI / 2;

      if (dist > 150) {
        enemy.vx = (dx / dist) * 2;
        enemy.vy = (dy / dist) * 2;
      } else {
        enemy.vx *= 0.95;
        enemy.vy *= 0.95;
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      enemy.x = Math.max(-ENEMY_SIZE, Math.min(CANVAS_WIDTH + ENEMY_SIZE, enemy.x));
      enemy.y = Math.max(-ENEMY_SIZE, Math.min(CANVAS_HEIGHT + ENEMY_SIZE, enemy.y));

      enemy.cooldown = Math.max(0, enemy.cooldown - 1);
      if (enemy.cooldown === 0 && dist < 400) {
        const bulletAngle = Math.atan2(dy, dx);
        this.bullets.push({
          id: this.nextId++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(bulletAngle) * 5,
          vy: Math.sin(bulletAngle) * 5,
          damage: 10 + this.wave * 2,
          fromPlayer: false,
        });
        enemy.cooldown = enemy.type === 'escort' ? 40 : 60;
      }

      if (dist < PLAYER_SIZE + ENEMY_SIZE * 0.7) {
        if (this.invincibleTime <= 0) {
          this.player.health -= 20;
          this.invincibleTime = 60;
          this.createExplosion(this.player.x, this.player.y, 30);
          if (this.player.health <= 0) {
            this.lives--;
            if (this.lives <= 0) {
              this.isGameOver = true;
            } else {
              this.player.health = this.player.maxHealth;
              this.player.x = CANVAS_WIDTH / 2;
              this.player.y = CANVAS_HEIGHT - 80;
              this.invincibleTime = 120;
            }
          }
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

      if (bullet.fromPlayer) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
          if (dist < ENEMY_SIZE) {
            enemy.health -= bullet.damage;
            this.bullets.splice(i, 1);
            if (enemy.health <= 0) {
              this.createExplosion(enemy.x, enemy.y, 40);
              this.score += enemy.loot * 5;
              for (let k = 0; k < 3; k++) {
                this.spawnLoot(enemy.x, enemy.y, enemy);
              }
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      } else {
        const dist = Math.hypot(this.player.x - bullet.x, this.player.y - bullet.y);
        if (dist < PLAYER_SIZE) {
          if (this.invincibleTime <= 0) {
            this.player.health -= bullet.damage;
            this.invincibleTime = 30;
            this.createExplosion(bullet.x, bullet.y, 20);
            if (this.player.health <= 0) {
              this.lives--;
              if (this.lives <= 0) {
                this.isGameOver = true;
              } else {
                this.player.health = this.player.maxHealth;
                this.player.x = CANVAS_WIDTH / 2;
                this.player.y = CANVAS_HEIGHT - 80;
                this.invincibleTime = 120;
              }
            }
          }
          this.bullets.splice(i, 1);
        }
      }
    }

    for (let i = this.loots.length - 1; i >= 0; i--) {
      const loot = this.loots[i];
      loot.y += loot.vy;

      if (loot.y > CANVAS_HEIGHT) {
        this.loots.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(this.player.x - loot.x, this.player.y - loot.y);
      if (dist < PLAYER_SIZE + 15) {
        switch (loot.type) {
          case 'gold':
            this.gold += loot.value;
            break;
          case 'gem':
            this.gems += loot.value;
            break;
          case 'health':
            this.player.health = Math.min(this.player.maxHealth, this.player.health + loot.value);
            break;
        }
        this.score += loot.value;
        this.loots.splice(i, 1);
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
