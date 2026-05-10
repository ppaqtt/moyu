export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  isEnemy: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'fighter' | 'bomber' | 'ace';
  speed: number;
  bulletTimer: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  shootCooldown: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'health' | 'shield' | 'bomb';
}

export interface WW2FighterState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  powerUps: PowerUp[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPlaying: boolean;
  invincibleTime: number;
  wave: number;
  enemiesKilled: number;
  waveEnemiesRemaining: number;
}

export class WW2FighterEngine {
  private CANVAS_WIDTH = 600;
  private CANVAS_HEIGHT = 800;
  private PLAYER_WIDTH = 50;
  private PLAYER_HEIGHT = 60;
  private ENEMY_SIZE = 40;
  private BULLET_WIDTH = 6;
  private BULLET_HEIGHT = 15;
  private ENEMY_BULLET_WIDTH = 8;
  private ENEMY_BULLET_HEIGHT = 12;

  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private powerUps: PowerUp[];
  private score: number;
  private level: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private invincibleTime: number;
  private wave: number;
  private enemiesKilled: number;
  private waveEnemiesRemaining: number;
  private lastShot: number;
  private spawnTimer: number;
  private keys: Set<string>;
  private shootInterval: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.waveEnemiesRemaining = 0;
    this.lastShot = 0;
    this.spawnTimer = 0;
    this.keys = new Set();
    this.shootInterval = 200;
  }

  private createPlayer(): Player {
    return {
      x: this.CANVAS_WIDTH / 2 - this.PLAYER_WIDTH / 2,
      y: this.CANVAS_HEIGHT - this.PLAYER_HEIGHT - 20,
      width: this.PLAYER_WIDTH,
      height: this.PLAYER_HEIGHT,
      health: 100,
      maxHealth: 100,
      speed: 6,
      shootCooldown: 0
    };
  }

  getState(): WW2FighterState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      invincibleTime: this.invincibleTime,
      wave: this.wave,
      enemiesKilled: this.enemiesKilled,
      waveEnemiesRemaining: this.waveEnemiesRemaining
    };
  }

  getCanvasSize() {
    return { width: this.CANVAS_WIDTH, height: this.CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.waveEnemiesRemaining = 0;
    this.lastShot = 0;
    this.spawnTimer = 0;
    this.shootInterval = 200;
  }

  setKeyDown(key: string): void {
    this.keys.add(key);
  }

  setKeyUp(key: string): void {
    this.keys.delete(key);
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastShot < this.shootInterval) return;
    this.lastShot = now;

    const bulletX = this.player.x + this.player.width / 2 - this.BULLET_WIDTH / 2;
    const bulletY = this.player.y;
    this.playerBullets.push({
      x: bulletX,
      y: bulletY,
      width: this.BULLET_WIDTH,
      height: this.BULLET_HEIGHT,
      speed: 12,
      isEnemy: false
    });
  }

  private spawnEnemy(): void {
    const types: ('fighter' | 'bomber' | 'ace')[] = ['fighter', 'fighter', 'fighter', 'bomber', 'ace'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = this.ENEMY_SIZE;
    let height = this.ENEMY_SIZE;
    let health = 1;
    let speed = 2 + this.level * 0.3;

    if (type === 'bomber') {
      width = this.ENEMY_SIZE * 1.5;
      height = this.ENEMY_SIZE * 1.2;
      health = 3;
      speed *= 0.6;
    } else if (type === 'ace') {
      health = 5;
      speed *= 1.2;
    }

    this.enemies.push({
      x: Math.random() * (this.CANVAS_WIDTH - width),
      y: -height,
      width,
      height,
      health,
      maxHealth: health,
      type,
      speed,
      bulletTimer: 0
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: ('health' | 'shield' | 'bomb')[] = ['health', 'shield', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      width: 30,
      height: 30,
      type
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 25,
      size
    });
  }

  private checkCollision(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
      this.player.x -= this.player.speed;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d')) {
      this.player.x += this.player.speed;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w')) {
      this.player.y -= this.player.speed;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s')) {
      this.player.y += this.player.speed;
    }

    this.player.x = Math.max(0, Math.min(this.CANVAS_WIDTH - this.player.width, this.player.x));
    this.player.y = Math.max(this.CANVAS_HEIGHT / 2, Math.min(this.CANVAS_HEIGHT - this.player.height - 10, this.player.y));

    if (this.keys.has(' ')) {
      this.shoot();
    }

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.y -= bullet.speed;
      if (bullet.y < -bullet.height) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(500, 1500 - this.level * 100);
    this.spawnTimer++;
    if (this.spawnTimer > spawnRate / 16) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;

      enemy.bulletTimer++;
      if (enemy.bulletTimer > (enemy.type === 'bomber' ? 60 : 80)) {
        this.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - this.ENEMY_BULLET_WIDTH / 2,
          y: enemy.y + enemy.height,
          width: this.ENEMY_BULLET_WIDTH,
          height: this.ENEMY_BULLET_HEIGHT,
          speed: 5 + this.level * 0.5,
          isEnemy: true
        });
        enemy.bulletTimer = 0;
      }

      if (enemy.y > this.CANVAS_HEIGHT + enemy.height) {
        this.enemies.splice(i, 1);
        continue;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy)) {
          this.playerBullets.splice(j, 1);
          enemy.health--;

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'ace' ? 50 : enemy.type === 'bomber' ? 30 : 15;
            this.score += baseScore * this.level;
            this.enemiesKilled++;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);

            if (Math.random() < 0.2) {
              this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }

            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.y += bullet.speed;
      if (bullet.y > this.CANVAS_HEIGHT) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.invincibleTime <= 0 && this.checkCollision(bullet, this.player)) {
        this.player.health -= 10;
        this.invincibleTime = 60;
        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 30);
        this.enemyBullets.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy)) {
        this.player.health -= 20;
        this.invincibleTime = 90;
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
        this.enemies.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2;

      if (powerUp.y > this.CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(this.player, powerUp)) {
        if (powerUp.type === 'health') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        } else if (powerUp.type === 'shield') {
          this.invincibleTime = Math.max(this.invincibleTime, 180);
        } else if (powerUp.type === 'bomb') {
          this.enemies.forEach(e => {
            this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.width);
            this.score += 10;
          });
          this.enemies = [];
          this.enemyBullets = [];
        }
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    this.level = Math.floor(this.score / 500) + 1;
    this.shootInterval = Math.max(100, 200 - this.level * 10);
  }
}
