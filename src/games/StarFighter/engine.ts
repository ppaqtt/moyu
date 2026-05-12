export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dx: number;
  dy: number;
  isEnemy: boolean;
  type: 'plasma' | 'laser' | 'missile';
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'scout' | 'fighter' | 'cruiser' | 'destroyer';
  speed: number;
  shootTimer: number;
  angle: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  angle: number;
  weapons: {
    plasma: number;
    laser: number;
    missile: number;
  };
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface StarFighterState {
  player: Player;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPlaying: boolean;
  energy: number;
  maxEnergy: number;
  boost: number;
}

export class StarFighterEngine {
  private CANVAS_WIDTH = 600;
  private CANVAS_HEIGHT = 800;
  private PLAYER_WIDTH = 50;
  private PLAYER_HEIGHT = 60;
  private ENEMY_SIZE = 40;
  private BULLET_WIDTH = 8;
  private BULLET_HEIGHT = 16;

  private player: Player;
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private score: number;
  private level: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private energy: number;
  private maxEnergy: number;
  private boost: number;
  private lastPlasma: number;
  private lastLaser: number;
  private lastMissile: number;
  private spawnTimer: number;
  private keys: Set<string>;
  private mouseX: number;
  private mouseY: number;
  private invincibleTime: number;

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
    this.energy = 100;
    this.maxEnergy = 100;
    this.boost = 100;
    this.lastPlasma = 0;
    this.lastLaser = 0;
    this.lastMissile = 0;
    this.spawnTimer = 0;
    this.keys = new Set();
    this.mouseX = this.CANVAS_WIDTH / 2;
    this.mouseY = this.CANVAS_HEIGHT / 2;
    this.invincibleTime = 0;
  }

  private createPlayer(): Player {
    return {
      x: this.CANVAS_WIDTH / 2 - this.PLAYER_WIDTH / 2,
      y: this.CANVAS_HEIGHT - this.PLAYER_HEIGHT - 30,
      width: this.PLAYER_WIDTH,
      height: this.PLAYER_HEIGHT,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      speed: 6,
      angle: 0,
      weapons: {
        plasma: 100,
        laser: 100,
        missile: 100
      }
    };
  }

  getState(): StarFighterState {
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
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      boost: this.boost
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
    this.energy = 100;
    this.boost = 100;
    this.lastPlasma = 0;
    this.lastLaser = 0;
    this.lastMissile = 0;
    this.spawnTimer = 0;
    this.invincibleTime = 0;
  }

  setKeyDown(key: string): void {
    this.keys.add(key);
  }

  setKeyUp(key: string): void {
    this.keys.delete(key);
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  shootPlasma(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastPlasma < 150) return;
    if (this.player.weapons.plasma < 5) return;
    this.lastPlasma = now;
    this.player.weapons.plasma = Math.max(0, this.player.weapons.plasma - 5);

    this.playerBullets.push({
      x: this.player.x + this.player.width / 2 - this.BULLET_WIDTH / 2,
      y: this.player.y,
      width: this.BULLET_WIDTH,
      height: this.BULLET_HEIGHT,
      speed: 15,
      dx: 0,
      dy: -1,
      isEnemy: false,
      type: 'plasma'
    });
  }

  shootLaser(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastLaser < 300) return;
    if (this.player.weapons.laser < 15) return;
    this.lastLaser = now;
    this.player.weapons.laser = Math.max(0, this.player.weapons.laser - 15);

    for (let i = -1; i <= 1; i++) {
      this.playerBullets.push({
        x: this.player.x + this.player.width / 2 - 2 + i * 12,
        y: this.player.y,
        width: 4,
        height: this.BULLET_HEIGHT * 1.5,
        speed: 20,
        dx: i * 0.1,
        dy: -1,
        isEnemy: false,
        type: 'laser'
      });
    }
  }

  shootMissile(): void {
    if (!this.isPlaying || this.isGameOver) return;
    const now = Date.now();
    if (now - this.lastMissile < 800) return;
    if (this.player.weapons.missile < 25) return;
    this.lastMissile = now;
    this.player.weapons.missile = Math.max(0, this.player.weapons.missile - 25);

    const target = this.findNearestEnemy();
    const angle = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : -Math.PI / 2;

    this.playerBullets.push({
      x: this.player.x + this.player.width / 2 - 5,
      y: this.player.y + this.player.height / 2,
      width: 10,
      height: 10,
      speed: 8,
      dx: Math.cos(angle) * 0.5,
      dy: Math.sin(angle) * 0.5,
      isEnemy: false,
      type: 'missile'
    });
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  private spawnEnemy(): void {
    const types: ('scout' | 'fighter' | 'cruiser' | 'destroyer')[] = ['scout', 'scout', 'fighter', 'fighter', 'cruiser', 'destroyer'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = this.ENEMY_SIZE;
    let height = this.ENEMY_SIZE;
    let health = 1;
    let speed = 2 + this.level * 0.2;
    let shootTimer = 0;

    if (type === 'destroyer') {
      width = this.ENEMY_SIZE * 2;
      height = this.ENEMY_SIZE * 2.5;
      health = 20;
      speed = 0.5;
      shootTimer = 30;
    } else if (type === 'cruiser') {
      width = this.ENEMY_SIZE * 1.5;
      height = this.ENEMY_SIZE * 1.8;
      health = 8;
      speed = 1;
      shootTimer = 50;
    } else if (type === 'fighter') {
      health = 3;
      speed = 2.5;
      shootTimer = 60;
    } else {
      health = 1;
      speed = 3.5;
      shootTimer = 80;
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
      shootTimer,
      angle: 0
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 35,
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

    let dx = 0, dy = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('w')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('s')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const boostActive = this.keys.has('Shift') && this.boost > 0;
      const speedMult = boostActive ? 1.8 : 1;
      if (boostActive) this.boost = Math.max(0, this.boost - 0.5);
      
      this.player.x += (dx / len) * this.player.speed * speedMult;
      this.player.y += (dy / len) * this.player.speed * speedMult;
    }

    this.player.angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x) + Math.PI / 2;

    this.player.x = Math.max(0, Math.min(this.CANVAS_WIDTH - this.player.width, this.player.x));
    this.player.y = Math.max(50, Math.min(this.CANVAS_HEIGHT - this.player.height - 10, this.player.y));

    if (this.keys.has(' ')) this.shootPlasma();
    if (this.keys.has('1')) this.shootPlasma();
    if (this.keys.has('2')) this.shootLaser();
    if (this.keys.has('3')) this.shootMissile();

    this.energy = Math.min(this.maxEnergy, this.energy + 0.1);
    this.player.weapons.plasma = Math.min(100, this.player.weapons.plasma + 0.3);
    this.player.weapons.laser = Math.min(100, this.player.weapons.laser + 0.15);
    this.player.weapons.missile = Math.min(100, this.player.weapons.missile + 0.1);
    this.boost = Math.min(100, this.boost + 0.2);

    if (this.invincibleTime > 0) this.invincibleTime--;

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.dx * bullet.speed;
      bullet.y += bullet.dy * bullet.speed;

      if (bullet.y < -20 || bullet.y > this.CANVAS_HEIGHT + 20 ||
          bullet.x < -20 || bullet.x > this.CANVAS_WIDTH + 20) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(600, 1500 - this.level * 100);
    this.spawnTimer++;
    if (this.spawnTimer > spawnRate / 16) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;
      enemy.angle += 0.02;

      if (enemy.y > this.CANVAS_HEIGHT + enemy.height) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.shootTimer--;
      if (enemy.shootTimer <= 0) {
        const angle = Math.atan2(
          this.player.y - enemy.y,
          this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2)
        );
        const bulletCount = enemy.type === 'destroyer' ? 3 : enemy.type === 'cruiser' ? 2 : 1;
        for (let b = 0; b < bulletCount; b++) {
          this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 3,
            y: enemy.y + enemy.height,
            width: 6,
            height: 10,
            speed: 5 + this.level * 0.4,
            dx: Math.cos(angle + (b - 0.5) * 0.3),
            dy: Math.sin(angle + (b - 0.5) * 0.3),
            isEnemy: true,
            type: 'plasma'
          });
        }
        enemy.shootTimer = enemy.type === 'destroyer' ? 40 : 70;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy)) {
          const damage = bullet.type === 'missile' ? 5 : bullet.type === 'laser' ? 2 : 1;
          enemy.health -= damage;
          this.playerBullets.splice(j, 1);

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'destroyer' ? 200 : enemy.type === 'cruiser' ? 100 : enemy.type === 'fighter' ? 40 : 20;
            this.score += baseScore * this.level;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 2);
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

      if (bullet.y < -20 || bullet.y > this.CANVAS_HEIGHT + 20 ||
          bullet.x < -20 || bullet.x > this.CANVAS_WIDTH + 20) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (this.invincibleTime <= 0 && this.checkCollision(bullet, this.player)) {
        if (this.player.shield > 0) {
          this.player.shield -= 10;
        } else {
          this.player.health -= 8;
        }
        this.invincibleTime = 20;
        this.enemyBullets.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (this.invincibleTime <= 0 && this.checkCollision(this.player, enemy)) {
        if (this.player.shield > 0) {
          this.player.shield = 0;
        } else {
          this.player.health -= 25;
        }
        this.invincibleTime = 60;
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
        this.enemies.splice(i, 1);

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    this.level = Math.floor(this.score / 1000) + 1;
  }
}
