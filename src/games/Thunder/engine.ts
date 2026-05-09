import { THUNDER_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT, ENEMY_WIDTH, ENEMY_HEIGHT, INITIAL_SPEED, BULLET_SPEED, ENEMY_SPEED, POWERUP_CHANCE } = THUNDER_CONSTANTS;

export type PowerUpType = 'fire' | 'shield' | 'bomb';

export interface Bullet {
  x: number;
  y: number;
  speed: number;
  isEnemy: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  type: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  fireLevel: number;
  hasShield: boolean;
  bombs: number;
}

export interface ThunderState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  invincibleTime: number;
}

export class ThunderEngine {
  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private powerUps: PowerUp[];
  private score: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private speed: number;
  private lastEnemySpawn: number;
  private lastEnemyShot: number;
  private invincibleTime: number;
  private keys: Set<string>;
  private explosions: { x: number; y: number; frame: number }[];

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      fireLevel: 1,
      hasShield: false,
      bombs: 1
    };
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.speed = INITIAL_SPEED;
    this.lastEnemySpawn = 0;
    this.lastEnemyShot = 0;
    this.invincibleTime = 0;
    this.keys = new Set();
    this.explosions = [];
  }

  getState(): ThunderState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      invincibleTime: this.invincibleTime
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      fireLevel: 1,
      hasShield: false,
      bombs: 1
    };
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isPlaying = false;
    this.speed = INITIAL_SPEED;
    this.lastEnemySpawn = 0;
    this.lastEnemyShot = 0;
    this.invincibleTime = 0;
    this.explosions = [];
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key);
    } else {
      this.keys.delete(key);
    }
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const fireLevel = this.player.fireLevel;
    const bulletX = this.player.x + this.player.width / 2 - BULLET_WIDTH / 2;
    const bulletY = this.player.y;

    if (fireLevel === 1) {
      this.playerBullets.push({ x: bulletX, y: bulletY, speed: BULLET_SPEED, isEnemy: false });
    } else if (fireLevel === 2) {
      this.playerBullets.push({ x: bulletX - 8, y: bulletY, speed: BULLET_SPEED, isEnemy: false });
      this.playerBullets.push({ x: bulletX + 8, y: bulletY, speed: BULLET_SPEED, isEnemy: false });
    } else if (fireLevel >= 3) {
      this.playerBullets.push({ x: bulletX, y: bulletY, speed: BULLET_SPEED, isEnemy: false });
      this.playerBullets.push({ x: bulletX - 10, y: bulletY + 5, speed: BULLET_SPEED, isEnemy: false });
      this.playerBullets.push({ x: bulletX + 10, y: bulletY + 5, speed: BULLET_SPEED, isEnemy: false });
    }
  }

  useBomb(): void {
    if (!this.isPlaying || this.isGameOver || this.player.bombs <= 0) return;

    this.player.bombs--;
    this.explosions = [];
    for (const enemy of this.enemies) {
      this.explosions.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2, frame: 0 });
    }
    this.enemies = [];
    this.enemyBullets = [];
    this.score += this.explosions.length * 50;
  }

  private spawnEnemy(): void {
    const types = [1, 2, 3];
    const type = types[Math.floor(Math.random() * types.length)];
    const width = type === 1 ? ENEMY_WIDTH : type === 2 ? ENEMY_WIDTH + 10 : ENEMY_WIDTH + 5;
    const height = type === 1 ? ENEMY_HEIGHT : type === 2 ? ENEMY_HEIGHT + 5 : ENEMY_HEIGHT + 10;

    this.enemies.push({
      x: Math.random() * (CANVAS_WIDTH - width),
      y: -height,
      width,
      height,
      health: type,
      type
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['fire', 'shield', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({ x, y, type });
  }

  private checkCollision(a: { x: number; y: number; width?: number; height?: number }, b: { x: number; y: number; width?: number; height?: number }, w: number, h: number): boolean {
    return a.x < b.x + w && a.x + (a.width || 0) > b.x && a.y < b.y + h && a.y + (a.height || 0) > b.y;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      this.player.x = Math.max(0, this.player.x - this.speed / 2);
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      this.player.x = Math.min(CANVAS_WIDTH - this.player.width, this.player.x + this.speed / 2);
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) {
      this.player.y = Math.max(CANVAS_HEIGHT / 2, this.player.y - this.speed / 2);
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) {
      this.player.y = Math.min(CANVAS_HEIGHT - this.player.height - 10, this.player.y + this.speed / 2);
    }

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.y -= bullet.speed;
      if (bullet.y < -BULLET_HEIGHT) {
        this.playerBullets.splice(i, 1);
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.y += bullet.speed;
      if (bullet.y > CANVAS_HEIGHT) {
        this.enemyBullets.splice(i, 1);
      }
    }

    if (now - this.lastEnemySpawn > 1000 - this.speed * 30) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += ENEMY_SPEED + this.speed * 0.2;

      if (enemy.y > CANVAS_HEIGHT) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (now - this.lastEnemyShot > 1500 && Math.random() < 0.02) {
        this.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 4,
          y: enemy.y + enemy.height,
          speed: 5 + this.speed * 0.3,
          isEnemy: true
        });
        this.lastEnemyShot = now;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy, BULLET_WIDTH, BULLET_HEIGHT) ||
            (this.checkCollision({ ...bullet, width: BULLET_WIDTH }, enemy, 0, 0) &&
             bullet.x < enemy.x + enemy.width && bullet.x + BULLET_WIDTH > enemy.x &&
             bullet.y < enemy.y + enemy.height && bullet.y + BULLET_HEIGHT > enemy.y)) {
          if (bullet.y < enemy.y + enemy.height && bullet.y + BULLET_HEIGHT > enemy.y &&
              bullet.x < enemy.x + enemy.width && bullet.x + BULLET_WIDTH > enemy.x) {
            this.playerBullets.splice(j, 1);
            enemy.health--;

            if (enemy.health <= 0) {
              this.score += enemy.type * 10;
              if (Math.random() < POWERUP_CHANCE) {
                this.spawnPowerUp(enemy.x + enemy.width / 2 - 15, enemy.y);
              }
              this.enemies.splice(i, 1);
            }
            break;
          }
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2;

      if (powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp, 30, 30)) {
        if (powerUp.type === 'fire') {
          this.player.fireLevel = Math.min(this.player.fireLevel + 1, 5);
        } else if (powerUp.type === 'shield') {
          this.player.hasShield = true;
        } else if (powerUp.type === 'bomb') {
          this.player.bombs = Math.min(this.player.bombs + 1, 3);
        }
        this.powerUps.splice(i, 1);
      }
    }

    for (const bullet of this.enemyBullets) {
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, bullet, 8, 8)) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
        } else {
          this.lives--;
          this.invincibleTime = 120;
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        break;
      }
    }

    for (const enemy of this.enemies) {
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy, 10, 10)) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.enemies = this.enemies.filter(e => e !== enemy);
        } else {
          this.lives--;
          this.invincibleTime = 120;
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        break;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > 30) {
        this.explosions.splice(i, 1);
      }
    }
  }

  getExplosions() {
    return this.explosions;
  }
}
