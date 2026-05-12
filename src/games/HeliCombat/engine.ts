export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dx: number;
  dy: number;
  isEnemy: boolean;
  type: 'bullet' | 'rocket';
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'tank' | 'soldier' | 'uav' | 'bunker';
  speed: number;
  shootTimer: number;
  movePattern: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  rockets: number;
  maxRockets: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface HeliCombatState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPlaying: boolean;
  invincibleTime: number;
  scoreMultiplier: number;
}

export class HeliCombatEngine {
  private CANVAS_WIDTH = 600;
  private CANVAS_HEIGHT = 800;
  private PLAYER_WIDTH = 60;
  private PLAYER_HEIGHT = 70;
  private ENEMY_SIZE = 35;
  private BULLET_WIDTH = 4;
  private BULLET_HEIGHT = 10;
  private ROCKET_WIDTH = 8;
  private ROCKET_HEIGHT = 16;

  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private score: number;
  private level: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private invincibleTime: number;
  private scoreMultiplier: number;
  private lastShot: number;
  private lastRocket: number;
  private spawnTimer: number;
  private keys: Set<string>;
  private shootInterval: number;

  constructor() {
    this.player = this.createPlayer();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.scoreMultiplier = 1;
    this.lastShot = 0;
    this.lastRocket = 0;
    this.spawnTimer = 0;
    this.keys = new Set();
    this.shootInterval = 120;
  }

  private createPlayer(): Player {
    return {
      x: this.CANVAS_WIDTH / 2 - this.PLAYER_WIDTH / 2,
      y: 100,
      width: this.PLAYER_WIDTH,
      height: this.PLAYER_HEIGHT,
      health: 100,
      maxHealth: 100,
      speed: 5,
      rockets: 10,
      maxRockets: 10
    };
  }

  getState(): HeliCombatState {
    return {
      player: { ...this.player },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      invincibleTime: this.invincibleTime,
      scoreMultiplier: this.scoreMultiplier
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
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.invincibleTime = 0;
    this.scoreMultiplier = 1;
    this.lastShot = 0;
    this.lastRocket = 0;
    this.spawnTimer = 0;
    this.shootInterval = 120;
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

    this.playerBullets.push({
      x: this.player.x + this.player.width / 2 - this.BULLET_WIDTH / 2,
      y: this.player.y + this.player.height,
      width: this.BULLET_WIDTH,
      height: this.BULLET_HEIGHT,
      speed: 10,
      dx: 0,
      dy: 1,
      isEnemy: false,
      type: 'bullet'
    });
  }

  shootRocket(): void {
    if (!this.isPlaying || this.isGameOver || this.player.rockets <= 0) return;
    const now = Date.now();
    if (now - this.lastRocket < 500) return;
    this.lastRocket = now;
    this.player.rockets--;

    this.playerBullets.push({
      x: this.player.x + this.player.width / 2 - this.ROCKET_WIDTH / 2,
      y: this.player.y + this.player.height,
      width: this.ROCKET_WIDTH,
      height: this.ROCKET_HEIGHT,
      speed: 6,
      dx: 0,
      dy: 1,
      isEnemy: false,
      type: 'rocket'
    });
  }

  private spawnEnemy(): void {
    const types: ('tank' | 'soldier' | 'uav' | 'bunker')[] = ['tank', 'soldier', 'soldier', 'uav', 'bunker'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = this.ENEMY_SIZE;
    let height = this.ENEMY_SIZE;
    let health = 1;
    let speed = 1 + this.level * 0.1;
    let shootTimer = 0;

    if (type === 'tank') {
      width = this.ENEMY_SIZE * 1.5;
      height = this.ENEMY_SIZE * 1.2;
      health = 5;
      speed = 0.5;
      shootTimer = 90;
    } else if (type === 'uav') {
      width = this.ENEMY_SIZE * 0.8;
      height = this.ENEMY_SIZE * 0.8;
      health = 2;
      speed = 2;
      shootTimer = 50;
    } else if (type === 'bunker') {
      width = this.ENEMY_SIZE * 1.8;
      height = this.ENEMY_SIZE * 1.2;
      health = 10;
      speed = 0;
      shootTimer = 60;
    }

    this.enemies.push({
      x: Math.random() * (this.CANVAS_WIDTH - width),
      y: this.CANVAS_HEIGHT + 50,
      width,
      height,
      health,
      maxHealth: health,
      type,
      speed,
      shootTimer,
      movePattern: Math.random() * Math.PI * 2
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 30,
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
    this.player.y = Math.max(20, Math.min(this.CANVAS_HEIGHT / 2, this.player.y));

    if (this.keys.has(' ')) {
      this.shoot();
    }
    if (this.keys.has('Shift')) {
      this.shootRocket();
    }

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.dx * bullet.speed;
      bullet.y += bullet.dy * bullet.speed;

      if (bullet.y > this.CANVAS_HEIGHT + 20 || bullet.y < -20 ||
          bullet.x < -20 || bullet.x > this.CANVAS_WIDTH + 20) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(800, 2000 - this.level * 150);
    this.spawnTimer++;
    if (this.spawnTimer > spawnRate / 16) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.type === 'uav') {
        enemy.movePattern += 0.05;
        enemy.x += Math.sin(enemy.movePattern) * 2;
        enemy.y -= enemy.speed * 0.5;
      } else {
        enemy.y -= enemy.speed;
      }

      if (enemy.y < -enemy.height) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.shootTimer--;
      if (enemy.shootTimer <= 0) {
        const angle = Math.atan2(
          this.player.y - enemy.y,
          this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2)
        );
        this.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 3,
          y: enemy.y,
          width: 6,
          height: 10,
          speed: 4 + this.level * 0.3,
          dx: Math.cos(angle),
          dy: Math.sin(angle),
          isEnemy: true,
          type: 'bullet'
        });
        enemy.shootTimer = enemy.type === 'bunker' ? 40 : 80;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy)) {
          const damage = bullet.type === 'rocket' ? 5 : 1;
          enemy.health -= damage;
          this.playerBullets.splice(j, 1);

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'bunker' ? 100 : enemy.type === 'tank' ? 50 : enemy.type === 'uav' ? 30 : 15;
            this.score += baseScore * this.level * this.scoreMultiplier;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 1.5);
            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.x += bullet.dx * bullet.speed;
      bullet.y += bullet.dy * bullet.speed;

      if (bullet.y > this.CANVAS_HEIGHT + 20 || bullet.y < -20 ||
          bullet.x < -20 || bullet.x > this.CANVAS_WIDTH + 20) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.invincibleTime <= 0 && this.checkCollision(bullet, this.player)) {
        this.player.health -= 5;
        this.invincibleTime = 30;
        this.enemyBullets.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy)) {
        this.player.health -= 15;
        this.invincibleTime = 60;
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
        this.enemies.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    if (this.player.rockets < this.player.maxRockets && Math.random() < 0.001) {
      this.player.rockets = Math.min(this.player.maxRockets, this.player.rockets + 1);
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    this.level = Math.floor(this.score / 1000) + 1;
    this.shootInterval = Math.max(80, 120 - this.level * 5);
    this.scoreMultiplier = 1 + Math.floor(this.level / 3) * 0.5;
  }
}
